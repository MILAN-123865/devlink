import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProjectDraftAutoSave } from "@/hooks/useProjectDraftAutoSave";
import {
  DRAFT_STORAGE_KEY,
  loadDraftFromLocalStorage,
  saveDraftToLocalStorage,
} from "@/lib/projectDraft";

const createDraft = vi.fn();
const updateDraft = vi.fn();

vi.mock("@/services", () => ({
  projectsService: {
    createDraft: (...args: unknown[]) => createDraft(...args),
    updateDraft: (...args: unknown[]) => updateDraft(...args),
  },
}));

const AUTO_SAVE_DELAY_MS = 30000;
const LOCAL_DEBOUNCE_MS = 1000;

function form(overrides: Record<string, unknown> = {}) {
  return {
    title: "My Project",
    slug: "my-project",
    description: "",
    tagline: "",
    stage: "",
    visibility: "",
    tech_stack: "",
    repository_url: "",
    website_url: "",
    demo_url: "",
    team_size: 1,
    max_team_size: 5,
    hiring: false,
    logo_url: "",
    banner_url: "",
    ...overrides,
  };
}

/** A promise plus the handles to settle it, for holding a request open. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  createDraft.mockReset();
  updateDraft.mockReset();
  createDraft.mockResolvedValue({ id: "proj-1" });
  updateDraft.mockResolvedValue({ id: "proj-1" });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Duplicate creation
// ---------------------------------------------------------------------------

describe("concurrent saves", () => {
  it("creates one project when two saves overlap", async () => {
    // The original bug: `backendProjectId` is only set after the create
    // resolves and is read from a closure, so a second caller arriving while
    // the first POST is in flight still sees null and creates another project.
    const gate = deferred<{ id: string }>();
    createDraft.mockReturnValueOnce(gate.promise);

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    let first!: Promise<void>;
    let second!: Promise<void>;

    act(() => {
      first = result.current.saveNow();
      second = result.current.saveNow();
    });

    await act(async () => {
      gate.resolve({ id: "proj-1" });
      await Promise.all([first, second]);
    });

    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(result.current.backendProjectId).toBe("proj-1");
  });

  it("updates rather than creates once an id exists", async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(createDraft).toHaveBeenCalledTimes(1);

    rerender({ data: form({ title: "Renamed" }) });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith(
      "proj-1",
      expect.objectContaining({ title: "Renamed" }),
    );
  });

  it("does not create a second project when the interval fires mid-save", async () => {
    const gate = deferred<{ id: string }>();
    createDraft.mockReturnValueOnce(gate.promise);

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    let manual!: Promise<void>;
    act(() => {
      manual = result.current.saveNow();
    });

    // The autosave tick lands while the create is still open.
    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS);
    });

    await act(async () => {
      gate.resolve({ id: "proj-1" });
      await manual;
    });

    expect(createDraft).toHaveBeenCalledTimes(1);
  });

  it("coalesces a save requested during an in-flight save into one follow-up", async () => {
    const gate = deferred<{ id: string }>();
    createDraft.mockReturnValueOnce(gate.promise);

    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    let first!: Promise<void>;
    act(() => {
      first = result.current.saveNow();
    });

    // The form moves on while the create is open.
    rerender({ data: form({ title: "Changed While Saving" }) });

    let second!: Promise<void>;
    act(() => {
      second = result.current.saveNow();
    });

    await act(async () => {
      gate.resolve({ id: "proj-1" });
      await Promise.all([first, second]);
    });

    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledTimes(1);
    expect(updateDraft).toHaveBeenCalledWith(
      "proj-1",
      expect.objectContaining({ title: "Changed While Saving" }),
    );
  });

  it("treats an unacknowledged create as a failure rather than a success", async () => {
    // `withFallback` in services/index.ts swallows errors and resolves to `{}`,
    // so a create whose response was lost looks like it returned successfully.
    // Believing it would leave `backendProjectId` null and have the next tick
    // create another project.
    createDraft.mockResolvedValueOnce({});

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.backendProjectId).toBeNull();
    expect(result.current.saveError).toBe("network");
    expect(result.current.lastSavedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Dirty tracking
// ---------------------------------------------------------------------------

describe("dirty tracking", () => {
  it("does not re-save an unchanged form on the next tick", async () => {
    const data = form();
    const { result } = renderHook(() => useProjectDraftAutoSave(data));

    await act(async () => {
      await result.current.saveNow();
    });
    expect(createDraft).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS * 3);
    });

    expect(updateDraft).not.toHaveBeenCalled();
  });

  it("saves on the next tick once the form changes", async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    await act(async () => {
      await result.current.saveNow();
    });

    rerender({ data: form({ tagline: "Now with a tagline" }) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
    });

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });

  it("reports isDirty until the content is saved", async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.saveNow();
    });

    rerender({ data: form() });
    expect(result.current.isDirty).toBe(false);

    rerender({ data: form({ title: "Edited" }) });
    expect(result.current.isDirty).toBe(true);
  });

  it("never saves a draft with no title", async () => {
    const { result } = renderHook(() =>
      useProjectDraftAutoSave(form({ title: "   " })),
    );

    await act(async () => {
      await result.current.saveNow();
      vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS * 2);
    });

    expect(createDraft).not.toHaveBeenCalled();
  });

  it("does not restart the autosave clock when the draft id arrives", async () => {
    // The interval previously depended on `saveToBackend`, which was rebuilt
    // whenever `backendProjectId` changed — so the first successful create
    // reset the thirty-second timer.
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    await act(async () => {
      await result.current.saveNow();
    });
    expect(result.current.backendProjectId).toBe("proj-1");

    rerender({ data: form({ tagline: "changed" }) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
    });

    expect(updateDraft).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Clearing
// ---------------------------------------------------------------------------

describe("clearDraft", () => {
  it("does not let a pending debounce write the draft back", async () => {
    // Type, stop, clear within the debounce window. The still-armed timer used
    // to fire afterwards and restore the draft that was just deleted.
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    rerender({ data: form({ title: "About to be cleared" }) });

    act(() => {
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS / 2);
      result.current.clearDraft();
    });

    act(() => {
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS * 2);
    });

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(loadDraftFromLocalStorage()).toBeNull();
  });

  it("clears an already-persisted draft", () => {
    saveDraftToLocalStorage(form({ title: "Persisted" }));
    expect(loadDraftFromLocalStorage()).not.toBeNull();

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    act(() => {
      result.current.clearDraft();
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS * 2);
    });

    expect(loadDraftFromLocalStorage()).toBeNull();
  });

  it("resets the backend id so a later draft is a new project", async () => {
    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });
    expect(result.current.backendProjectId).toBe("proj-1");

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.backendProjectId).toBeNull();
    expect(result.current.lastSavedAt).toBeNull();
  });

  it("stops the interval from saving after a clear", async () => {
    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    act(() => {
      result.current.clearDraft();
    });

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS * 2);
    });

    expect(createDraft).not.toHaveBeenCalled();
  });

  it("re-arms autosave when the user explicitly saves again", async () => {
    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    act(() => {
      result.current.clearDraft();
    });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(createDraft).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe("localStorage persistence", () => {
  it("writes the draft after the debounce", () => {
    renderHook(() => useProjectDraftAutoSave(form({ title: "Debounced" })));

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS);
    });

    expect(loadDraftFromLocalStorage()).toMatchObject({ title: "Debounced" });
  });

  it("restores a stored draft", () => {
    saveDraftToLocalStorage(form({ title: "Restored" }));

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    expect(result.current.restoreDraft()).toMatchObject({ title: "Restored" });
  });

  it("flushes to localStorage when the page is hidden", () => {
    renderHook(() => useProjectDraftAutoSave(form({ title: "Flushed" })));

    // Well inside the debounce window — without a flush this would be lost.
    act(() => {
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(loadDraftFromLocalStorage()).toMatchObject({ title: "Flushed" });
  });

  it("does not write after unmount", () => {
    const { unmount } = renderHook(() =>
      useProjectDraftAutoSave(form({ title: "Unmounted" })),
    );

    act(() => {
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS / 2);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(LOCAL_DEBOUNCE_MS * 2);
    });

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Error surfacing
// ---------------------------------------------------------------------------

describe("error reporting", () => {
  it("exposes a failure instead of only logging it", async () => {
    createDraft.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.saveError).toBe("network");
  });

  it("does not advance lastSavedAt on a failure", async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    await act(async () => {
      await result.current.saveNow();
    });
    const good = result.current.lastSavedAt;
    expect(good).not.toBeNull();

    updateDraft.mockRejectedValueOnce(new Error("offline"));
    rerender({ data: form({ title: "Second edit" }) });

    await act(async () => {
      await result.current.saveNow();
    });

    // The old timestamp is a fact about the past and stays; `saveError` is
    // what tells the UI the draft is now behind.
    expect(result.current.lastSavedAt).toBe(good);
    expect(result.current.saveError).toBe("network");
  });

  it("clears the error on the next success", async () => {
    createDraft.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });
    expect(result.current.saveError).toBe("network");

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.saveError).toBeNull();
  });

  it("reports a storage failure separately from a network one", async () => {
    // Spy on the instance, not `Storage.prototype` — jsdom gives its
    // `localStorage` its own `setItem`, so a prototype spy is never called.
    const quota = new Error("full");
    quota.name = "QuotaExceededError";
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw quota;
      });

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });

    // The backend save succeeded; only the local copy failed. The two are
    // independent, so a successful request must not clear this.
    expect(result.current.saveError).toBe("storage");
    expect(createDraft).toHaveBeenCalledTimes(1);

    setItem.mockRestore();
  });

  it("a successful network save does not clear a storage error", async () => {
    const quota = new Error("full");
    quota.name = "QuotaExceededError";
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw quota;
      });

    const { result, rerender } = renderHook(
      ({ data }) => useProjectDraftAutoSave(data),
      { initialProps: { data: form() } },
    );

    await act(async () => {
      await result.current.saveNow();
    });
    expect(result.current.saveError).toBe("storage");

    rerender({ data: form({ tagline: "more" }) });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.saveError).toBe("storage");
    setItem.mockRestore();
  });

  it("reports isSaving while a request is open", async () => {
    const gate = deferred<{ id: string }>();
    createDraft.mockReturnValueOnce(gate.promise);

    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.saveNow();
      // Let `saveNow` reach the point where the request is open.
      await Promise.resolve();
    });

    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      gate.resolve({ id: "proj-1" });
      await pending;
    });

    expect(result.current.isSaving).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

describe("payload", () => {
  it("omits empty optional fields", async () => {
    const { result } = renderHook(() => useProjectDraftAutoSave(form()));

    await act(async () => {
      await result.current.saveNow();
    });

    const payload = createDraft.mock.calls[0][0] as Record<string, unknown>;

    expect(payload).not.toHaveProperty("description");
    expect(payload).not.toHaveProperty("repository_url");
    expect(payload.title).toBe("My Project");
    expect(payload.team_size).toBe(1);
  });

  it("keeps falsy values that are meaningful", async () => {
    const { result } = renderHook(() =>
      useProjectDraftAutoSave(form({ hiring: false, team_size: 0 })),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    const payload = createDraft.mock.calls[0][0] as Record<string, unknown>;

    expect(payload.hiring).toBe(false);
    expect(payload.team_size).toBe(0);
  });
});
