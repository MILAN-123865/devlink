/**
 * Token storage and cross-tab session sync.
 *
 * `storage` events do not fire in the tab that made the change, so a real
 * two-tab scenario cannot be reproduced in one jsdom window. These tests
 * dispatch the event the browser would have delivered, which is the same
 * thing from the listener's point of view — and they assert that the local
 * writes this tab makes itself do *not* go through that path, since a
 * listener that reacted to its own writes would loop.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REFRESH_KEY = "devlink.refresh";
const ACCESS_KEY = "devlink.access";

let tokenStore: typeof import("../tokens").tokenStore;
let stopSessionSync: typeof import("../tokens").stopSessionSync;

/**
 * Fire the `storage` event another tab's write would have produced.
 *
 * jsdom does not propagate storage writes into events, so the value is
 * written first and the event dispatched second — which is the order and the
 * state a real second tab would leave behind.
 */
function storageEventFromAnotherTab(
  key: string | null,
  newValue: string | null,
  oldValue: string | null,
) {
  if (key === null) {
    window.localStorage.clear();
  } else if (newValue === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, newValue);
  }

  window.dispatchEvent(
    new StorageEvent("storage", {
      key,
      newValue,
      oldValue,
      storageArea: window.localStorage,
    }),
  );
}

beforeEach(async () => {
  vi.resetModules();
  window.localStorage.clear();
  window.sessionStorage.clear();

  const module = await import("../tokens");
  tokenStore = module.tokenStore;
  stopSessionSync = module.stopSessionSync;
});

afterEach(() => {
  stopSessionSync?.();
});

// ── Basic storage ────────────────────────────────────────────────────────────

describe("storage", () => {
  it("keeps the access token out of localStorage", () => {
    tokenStore.set("access", "refresh");

    expect(window.sessionStorage.getItem(ACCESS_KEY)).toBe("access");
    expect(window.localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(window.localStorage.getItem(REFRESH_KEY)).toBe("refresh");
  });

  it("reads the access token back from sessionStorage after a reload", async () => {
    window.sessionStorage.setItem(ACCESS_KEY, "survived");
    vi.resetModules();

    const { tokenStore: reloaded } = await import("../tokens");

    expect(reloaded.getAccess()).toBe("survived");
  });

  it("leaves the refresh token alone when it is not passed", () => {
    tokenStore.set("access-1", "refresh-1");
    tokenStore.set("access-2");

    expect(tokenStore.getRefresh()).toBe("refresh-1");
    expect(tokenStore.getAccess()).toBe("access-2");
  });

  it("clear removes both", () => {
    tokenStore.set("access", "refresh");
    tokenStore.clear();

    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
  });

  it("notifies subscribers on set and clear", () => {
    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    tokenStore.set("access", "refresh");
    tokenStore.clear();

    expect(seen).toEqual(["access", null]);
    off();
  });

  it("unsubscribe returns nothing usable as a value", () => {
    // `Set.delete` returns a boolean; an unsubscribe that returns one is easy
    // to misread, and misbehaves as a React effect cleanup.
    const off = tokenStore.subscribe(() => {});

    expect(off()).toBeUndefined();
  });

  it("stops notifying after unsubscribing", () => {
    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));
    off();

    tokenStore.set("access", "refresh");

    expect(seen).toEqual([]);
  });
});

// ── Sign-out in another tab ──────────────────────────────────────────────────

describe("sign-out in another tab", () => {
  it("clears this tab's access token", () => {
    // The bug: this tab stayed fully authenticated, and kept making
    // authorised requests, until its own access token happened to expire.
    tokenStore.set("access", "refresh");

    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(tokenStore.getAccess()).toBeNull();
    expect(window.sessionStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it("notifies subscribers", () => {
    tokenStore.set("access", "refresh");

    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(seen).toEqual([null]);
    off();
  });

  it("treats localStorage.clear() as a sign-out", () => {
    tokenStore.set("access", "refresh");

    storageEventFromAnotherTab(null, null, null);

    expect(tokenStore.getAccess()).toBeNull();
  });

  it("does nothing when this tab was already signed out", () => {
    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(seen).toEqual([]);
    off();
  });
});

// ── Sign-in as somebody else in another tab ──────────────────────────────────

describe("a different session in another tab", () => {
  it("drops this tab's stale access token", () => {
    // Otherwise this tab renders user A while holding A's access token, then
    // on expiry refreshes against B's refresh token and silently becomes B --
    // with a page still full of A's data.
    tokenStore.set("access-user-a", "refresh-user-a");

    storageEventFromAnotherTab(REFRESH_KEY, "refresh-user-b", "refresh-user-a");

    expect(tokenStore.getAccess()).toBeNull();
  });

  it("leaves the new refresh token in place", () => {
    // It belongs to the new session and is perfectly valid; only this tab's
    // access token is stale.
    tokenStore.set("access-user-a", "refresh-user-a");

    storageEventFromAnotherTab(REFRESH_KEY, "refresh-user-b", "refresh-user-a");

    expect(tokenStore.getRefresh()).toBe("refresh-user-b");
  });

  it("notifies subscribers that this tab is unauthenticated", () => {
    tokenStore.set("access-user-a", "refresh-user-a");

    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    storageEventFromAnotherTab(REFRESH_KEY, "refresh-user-b", "refresh-user-a");

    expect(seen).toEqual([null]);
    off();
  });
});

// ── Events that must not disturb the session ─────────────────────────────────

describe("unrelated storage activity", () => {
  it("ignores a different key", () => {
    tokenStore.set("access", "refresh");

    storageEventFromAnotherTab("some.other.key", "value", null);

    expect(tokenStore.getAccess()).toBe("access");
  });

  it("ignores a write that did not change the value", () => {
    tokenStore.set("access", "refresh");

    storageEventFromAnotherTab(REFRESH_KEY, "refresh", "refresh");

    expect(tokenStore.getAccess()).toBe("access");
  });

  it("does not react to this tab's own writes", () => {
    // `storage` does not fire in the originating tab, so a local `set` must
    // notify exactly once -- via `set` itself, not via the listener as well.
    tokenStore.set("access-1", "refresh-1");

    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    tokenStore.set("access-2", "refresh-2");

    expect(seen).toEqual(["access-2"]);
    expect(tokenStore.getAccess()).toBe("access-2");
    off();
  });

  it("does not loop when a subscriber writes back", () => {
    tokenStore.set("access", "refresh");

    let calls = 0;
    const off = tokenStore.subscribe((t) => {
      calls += 1;
      if (calls > 5) throw new Error("runaway notification loop");
      if (t === null) tokenStore.getAccess();
    });

    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(calls).toBe(1);
    off();
  });
});

// ── Teardown ─────────────────────────────────────────────────────────────────

describe("listener lifecycle", () => {
  it("stops reacting after teardown", () => {
    tokenStore.set("access", "refresh");

    stopSessionSync();
    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(tokenStore.getAccess()).toBe("access");
  });

  it("registering twice does not double-handle an event", async () => {
    const { startSessionSync } = await import("../tokens");
    startSessionSync();
    startSessionSync();

    tokenStore.set("access", "refresh");

    const seen: (string | null)[] = [];
    const off = tokenStore.subscribe((t) => seen.push(t));

    storageEventFromAnotherTab(REFRESH_KEY, null, "refresh");

    expect(seen).toEqual([null]);
    off();
  });
});
