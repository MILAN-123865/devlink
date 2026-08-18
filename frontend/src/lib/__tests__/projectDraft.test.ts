import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DRAFT_MAX_AGE_MS,
  DRAFT_SCHEMA_VERSION,
  DRAFT_STORAGE_KEY,
  clearDraftFromLocalStorage,
  getDraftSavedAt,
  loadDraftFromLocalStorage,
  saveDraftToLocalStorage,
} from "@/lib/projectDraft";

/**
 * These functions were no-op stubs — `saveDraftToLocalStorage` did nothing and
 * `loadDraftFromLocalStorage` always returned `null` — so the autosave hook
 * was persisting to nowhere while every call reported success.
 */

const NOW = 1_700_000_000_000;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("round trip", () => {
  it("stores and reads back a draft", () => {
    const draft = { title: "Round Trip", team_size: 3 };

    expect(saveDraftToLocalStorage(draft, NOW)).toEqual({ ok: true });
    expect(loadDraftFromLocalStorage(NOW)).toEqual(draft);
  });

  it("returns null when nothing is stored", () => {
    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
  });

  it("overwrites a previous draft", () => {
    saveDraftToLocalStorage({ title: "First" }, NOW);
    saveDraftToLocalStorage({ title: "Second" }, NOW);

    expect(loadDraftFromLocalStorage(NOW)).toEqual({ title: "Second" });
  });

  it("clears a stored draft", () => {
    saveDraftToLocalStorage({ title: "Doomed" }, NOW);
    clearDraftFromLocalStorage();

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("reports when the draft was written", () => {
    saveDraftToLocalStorage({ title: "Timed" }, NOW);

    expect(getDraftSavedAt()?.getTime()).toBe(NOW);
  });

  it("reports no timestamp when nothing is stored", () => {
    expect(getDraftSavedAt()).toBeNull();
  });
});

describe("hostile stored data", () => {
  it("discards an unparseable entry and does not throw", () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, "{not json");

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
    // Cleared, so it does not fail again on every subsequent load.
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("discards a draft written by an incompatible version", () => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: DRAFT_SCHEMA_VERSION + 1,
        savedAt: NOW,
        data: { title: "From the future" },
      }),
    );

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
  });

  it("discards an entry with no timestamp", () => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: DRAFT_SCHEMA_VERSION, data: { title: "x" } }),
    );

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
  });

  it("discards a draft past its maximum age", () => {
    saveDraftToLocalStorage({ title: "Ancient" }, NOW);

    expect(loadDraftFromLocalStorage(NOW + DRAFT_MAX_AGE_MS - 1)).toEqual({
      title: "Ancient",
    });
    expect(loadDraftFromLocalStorage(NOW + DRAFT_MAX_AGE_MS + 1)).toBeNull();
  });

  it("survives a bare value that is not an envelope", () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify("just a string"));

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
  });
});

describe("storage failures", () => {
  it("reports a quota error instead of throwing", () => {
    const quota = new Error("full");
    quota.name = "QuotaExceededError";
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw quota;
    });

    expect(saveDraftToLocalStorage({ title: "Too big" })).toMatchObject({
      ok: false,
      reason: "quota",
    });
  });

  it("recognises the Firefox quota error code", () => {
    const quota = new Error("full") as Error & { code: number };
    quota.code = 1014;
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw quota;
    });

    expect(saveDraftToLocalStorage({ title: "Too big" })).toMatchObject({
      ok: false,
      reason: "quota",
    });
  });

  it("reports a non-quota write failure as a generic error", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("something else");
    });

    expect(saveDraftToLocalStorage({ title: "Nope" })).toMatchObject({
      ok: false,
      reason: "error",
    });
  });

  it("does not throw when reading fails", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadDraftFromLocalStorage(NOW)).toBeNull();
  });

  it("does not throw when clearing fails", () => {
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => clearDraftFromLocalStorage()).not.toThrow();
  });
});
