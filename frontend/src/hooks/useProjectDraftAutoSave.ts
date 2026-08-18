import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  saveDraftToLocalStorage,
  loadDraftFromLocalStorage,
  clearDraftFromLocalStorage,
  type ProjectDraftFormData,
} from "@/lib/projectDraft";
import { projectsService } from "@/services";

const AUTO_SAVE_DELAY_MS = 30000;
const LOCAL_STORAGE_DEBOUNCE_MS = 1000;

export type DraftSaveError = "network" | "storage";

export interface ProjectDraftAutoSave {
  /** Id of the backend draft, once one has been created. */
  backendProjectId: string | null;
  /** When the backend last accepted a save. */
  lastSavedAt: Date | null;
  /** A backend save is in flight. */
  isSaving: boolean;
  /** The form differs from what was last saved to the backend. */
  isDirty: boolean;
  /** Set when the last save attempt failed; cleared by the next success. */
  saveError: DraftSaveError | null;
  restoreDraft: () => ProjectDraftFormData | null;
  clearDraft: () => void;
  saveNow: () => Promise<void>;
}

/**
 * The only fields that go to the backend. Listing them once removes the two
 * hand-maintained copies of the payload (one in the create branch, one in the
 * update branch) that had to be kept in step by hand.
 */
const DRAFT_FIELDS = [
  "title",
  "slug",
  "description",
  "tagline",
  "stage",
  "visibility",
  "tech_stack",
  "repository_url",
  "website_url",
  "demo_url",
  "team_size",
  "max_team_size",
  "hiring",
  "logo_url",
  "banner_url",
] as const;

/** Fields where an empty string means "not set" rather than "set to empty". */
const OMIT_WHEN_EMPTY = new Set<string>([
  "description",
  "tagline",
  "stage",
  "visibility",
  "tech_stack",
  "repository_url",
  "website_url",
  "demo_url",
  "logo_url",
  "banner_url",
]);

function buildPayload(data: ProjectDraftFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of DRAFT_FIELDS) {
    const value = data?.[field];
    if (OMIT_WHEN_EMPTY.has(field)) {
      if (value) payload[field] = value;
    } else {
      payload[field] = value;
    }
  }

  return payload;
}

/**
 * A stable string identifying the saveable content of the form.
 *
 * Used to decide whether anything actually changed. Without it the interval
 * re-sends an identical draft every thirty seconds for as long as the page is
 * open — a user who types a title and then reads the docs for twenty minutes
 * sends forty identical requests, multiplied by every open tab.
 */
function fingerprint(data: ProjectDraftFormData): string {
  return JSON.stringify(buildPayload(data));
}

/**
 * Autosave a project draft to `localStorage` and to the backend.
 *
 * ## What was wrong
 *
 * **Two overlapping saves created two projects.** `saveToBackend` had no
 * in-flight guard, and `backendProjectId` — the thing that makes a save an
 * update rather than a create — was only set *after* the create resolved. It
 * was also captured in the callback's closure, so while the first `POST` was
 * in flight every other caller still saw `null`. There are two callers: the
 * thirty-second interval and the exported `saveNow()`. On a slow connection
 * that is easy to hit — start typing, the timer fires, the request takes four
 * seconds, the user clicks "Save" at second thirty-two. Two projects, and the
 * second `setBackendProjectId` wins, so the first is orphaned in the user's
 * project list and never updated again.
 *
 * `projectsService.createDraft` goes through `withFallback`, which swallows
 * errors and returns `{}`. So a create that *succeeded server-side* but whose
 * response was lost leaves `backendProjectId` null, and the next tick creates
 * another one — unbounded draft creation on a flaky connection.
 *
 * Both are fixed by a single in-flight promise: concurrent callers await the
 * running save instead of starting a second, and a save requested during one
 * is coalesced into a single follow-up.
 *
 * **Clearing a draft did not stick.** `clearDraft` did not cancel the pending
 * `localStorage` debounce, so a draft cleared within a second of the last
 * keystroke was written straight back by the still-armed timer, and the next
 * visit restored a draft for a project that had already been published.
 *
 * **Failures were invisible.** The only handling was `console.debug`.
 * `lastSavedAt` kept its previous value, so the UI showed "Saved at 14:32" for
 * a draft that had been failing to save for half an hour, and the component
 * had no error state to render even if it wanted to.
 *
 * **Nothing was flushed when the page went away.** No `pagehide` or
 * `visibilitychange` handler, so closing the tab twenty-five seconds after the
 * last autosave discarded those twenty-five seconds.
 */
export function useProjectDraftAutoSave(
  formData: ProjectDraftFormData,
): ProjectDraftAutoSave {
  const [backendProjectId, setBackendProjectId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<DraftSaveError | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Mirrors of the state above, for the callbacks. Reading state inside a
  // long-lived interval or an in-flight promise gives you the value from the
  // render that created it, which is exactly how the duplicate-create window
  // opened.
  const backendProjectIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const savedFingerprintRef = useRef<string | null>(null);
  const clearedRef = useRef(false);
  const unmountedRef = useRef(false);

  const currentFingerprint = fingerprint(formData);
  const isDirty = currentFingerprint !== savedFingerprintRef.current;

  const cancelPendingLocalSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Send one save. Never runs concurrently with itself.
   *
   * The id is read from a ref rather than from state, so a create that has
   * already resolved is visible to the very next call even if React has not
   * re-rendered yet.
   */
  const performSave = useCallback(async (data: ProjectDraftFormData) => {
    const snapshot = fingerprint(data);
    const existingId = backendProjectIdRef.current;

    try {
      if (existingId) {
        const result = await projectsService.updateDraft(
          existingId,
          buildPayload(data),
        );

        // `withFallback` resolves to `{}` when the request failed, so a
        // truthy result is not proof of anything. An update is only believed
        // when the response identifies the draft it updated.
        if (!result || !("id" in (result as object))) {
          throw new Error("Draft update was not acknowledged");
        }
      } else {
        const result = await projectsService.createDraft(buildPayload(data));

        if (!result || !("id" in (result as object))) {
          throw new Error("Draft creation was not acknowledged");
        }

        const id = (result as { id: string }).id;
        backendProjectIdRef.current = id;
        if (!unmountedRef.current) setBackendProjectId(id);
      }

      savedFingerprintRef.current = snapshot;

      if (!unmountedRef.current) {
        setLastSavedAt(new Date());
        // Only clear a *network* error. A storage failure is independent of
        // the backend — the draft reaching the server says nothing about
        // whether localStorage is full, and clearing it here would hide a
        // problem the user still has.
        setSaveError((current) => (current === "network" ? null : current));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[draft] backend save failed:", error);
      }
      // `lastSavedAt` deliberately keeps its old value — it is a fact about
      // the past. `saveError` is what tells the UI the draft is behind.
      if (!unmountedRef.current) setSaveError("network");
    }
  }, []);

  /**
   * Save, coalescing with anything already running.
   *
   * A caller arriving while a save is in flight waits for it and then, if the
   * form has moved on since, triggers exactly one follow-up. Never two
   * requests at once, and never a create racing a create.
   */
  const saveToBackend = useCallback(
    async (data: ProjectDraftFormData): Promise<void> => {
      if (!data?.title?.trim()) return;
      if (clearedRef.current) return;

      if (inFlightRef.current) {
        await inFlightRef.current;

        // The in-flight save may have covered this content already.
        if (fingerprint(formDataRef.current) === savedFingerprintRef.current) {
          return;
        }
        return saveToBackend(formDataRef.current);
      }

      if (!unmountedRef.current) setIsSaving(true);

      const run = performSave(data).finally(() => {
        inFlightRef.current = null;
        if (!unmountedRef.current) setIsSaving(false);
      });

      inFlightRef.current = run;

      return run;
    },
    [performSave],
  );

  // ---- localStorage, debounced -------------------------------------------

  useEffect(() => {
    if (clearedRef.current) return;

    cancelPendingLocalSave();

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      if (clearedRef.current) return;

      const result = saveDraftToLocalStorage(formDataRef.current);
      if (!result.ok && result.reason === "quota") {
        setSaveError("storage");
      }
    }, LOCAL_STORAGE_DEBOUNCE_MS);

    return cancelPendingLocalSave;
  }, [currentFingerprint, cancelPendingLocalSave]);

  // ---- Periodic backend save ---------------------------------------------
  //
  // Depends on nothing, so the thirty-second clock is not restarted every time
  // `backendProjectId` changes — which is what happened previously, because
  // `saveToBackend` was rebuilt on each id change and was the effect's only
  // dependency. The first successful create reset the timer.

  useEffect(() => {
    const timer = setInterval(() => {
      const data = formDataRef.current;
      if (!data?.title?.trim()) return;

      // Nothing changed since the last accepted save.
      if (fingerprint(data) === savedFingerprintRef.current) return;

      void saveToBackend(data);
    }, AUTO_SAVE_DELAY_MS);

    return () => clearInterval(timer);
  }, [saveToBackend]);

  // ---- Flush before the page goes away ------------------------------------

  useEffect(() => {
    const flush = () => {
      if (clearedRef.current) return;

      const data = formDataRef.current;
      if (!data?.title?.trim()) return;

      // `localStorage` is synchronous, so this write completes even during
      // `pagehide`. The backend request may not, which is exactly why the
      // local copy is the one worth flushing here.
      cancelPendingLocalSave();
      saveDraftToLocalStorage(data);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cancelPendingLocalSave]);

  // ---- Unmount -------------------------------------------------------------

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      cancelPendingLocalSave();
    };
  }, [cancelPendingLocalSave]);

  // ---- Public API ----------------------------------------------------------

  const restoreDraft = useCallback((): ProjectDraftFormData | null => {
    return loadDraftFromLocalStorage();
  }, []);

  const clearDraft = useCallback(() => {
    // Order matters. Cancelling first means the pending debounce cannot fire
    // between the clear and the flag being set and write the draft back.
    cancelPendingLocalSave();
    clearedRef.current = true;

    clearDraftFromLocalStorage();

    backendProjectIdRef.current = null;
    savedFingerprintRef.current = null;
    setBackendProjectId(null);
    setLastSavedAt(null);
    setSaveError(null);
  }, [cancelPendingLocalSave]);

  const saveNow = useCallback(async () => {
    const data = formDataRef.current;
    if (!data?.title?.trim()) return;

    // An explicit save re-arms autosave: the user is working on this draft
    // again, whatever happened before.
    clearedRef.current = false;

    cancelPendingLocalSave();
    const stored = saveDraftToLocalStorage(data);
    if (!stored.ok && stored.reason === "quota") setSaveError("storage");

    await saveToBackend(data);
  }, [cancelPendingLocalSave, saveToBackend]);

  return useMemo(
    () => ({
      backendProjectId,
      lastSavedAt,
      isSaving,
      isDirty,
      saveError,
      restoreDraft,
      clearDraft,
      saveNow,
    }),
    [
      backendProjectId,
      lastSavedAt,
      isSaving,
      isDirty,
      saveError,
      restoreDraft,
      clearDraft,
      saveNow,
    ],
  );
}
