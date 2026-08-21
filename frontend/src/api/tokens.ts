// JWT access + refresh token storage.
//
// Access token kept in-memory (safer against XSS); refresh in localStorage
// so sessions survive reloads. Swap to httpOnly cookies when backend supports.
//
// The three places a session lives have different scopes, and that difference
// is the whole reason the `storage` listener at the bottom of this file
// exists:
//
//   accessToken (module variable)  per JS context, so per tab
//   sessionStorage                 per tab
//   localStorage (refresh)         shared across every tab on the origin
//
// localStorage was chosen for the refresh token because it is shared, so a
// reload keeps the session. But being shared also means another tab can
// change it underneath this one, and the browser tells us when that happens.
// Not listening meant signing out in one tab left every other tab fully
// authenticated until its access token happened to expire.

const ACCESS_KEY = "devlink.access";
const REFRESH_KEY = "devlink.refresh";

let accessToken: string | null = null;

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

function notify(token: string | null): void {
  listeners.forEach((l) => l(token));
}

/** Drop this tab's access token without touching the shared refresh token. */
function clearLocalAccess(): void {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ACCESS_KEY);
  }
}

export const tokenStore = {
  getAccess(): string | null {
    if (accessToken) return accessToken;
    if (typeof window === "undefined") return null;
    accessToken = window.sessionStorage.getItem(ACCESS_KEY);
    return accessToken;
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string | null, refresh?: string | null) {
    accessToken = access;
    if (typeof window !== "undefined") {
      if (access) window.sessionStorage.setItem(ACCESS_KEY, access);
      else window.sessionStorage.removeItem(ACCESS_KEY);
      if (refresh !== undefined) {
        if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
        else window.localStorage.removeItem(REFRESH_KEY);
      }
    }
    notify(access);
  },
  clear() {
    this.set(null, null);
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    // Wrapped rather than returned bare: `Set.delete` returns a boolean, and
    // an unsubscribe function that returns a value is easy to misread as
    // meaningful, and misbehaves if used where a cleanup returning void is
    // expected (a React effect, for one).
    return () => {
      listeners.delete(l);
    };
  },
};

// ── Cross-tab session sync ───────────────────────────────────────────────────

/**
 * React to another tab changing the shared refresh token.
 *
 * `storage` events do not fire in the tab that made the change, so anything
 * reaching here originated elsewhere. Exported for the tests, which dispatch
 * synthetic events rather than driving two real tabs.
 */
export function handleStorageEvent(event: StorageEvent): void {
  // `key === null` means `localStorage.clear()`. That takes the refresh token
  // with it, so it is a sign-out like any other.
  if (event.key === null) {
    if (tokenStore.getAccess() === null) return;
    clearLocalAccess();
    notify(null);
    return;
  }

  if (event.key !== REFRESH_KEY) return;

  // Same value written again, or a write that changed nothing. Bailing out
  // keeps an unrelated re-save from signing the tab out.
  if (event.newValue === event.oldValue) return;

  if (event.newValue === null) {
    // Signed out elsewhere. Drop this tab's access token too -- it is still
    // valid server-side until it expires, and leaving it in place is what let
    // a "signed out" tab keep making authorised requests.
    if (tokenStore.getAccess() === null) return;
    clearLocalAccess();
    notify(null);
    return;
  }

  // The refresh token was replaced with a different one, which means a
  // different session -- often a different user -- signed in elsewhere.
  //
  // This tab's access token belongs to the previous session. Keeping it is
  // the worse of the two failure modes: the tab would go on rendering the old
  // user's data, and on expiry would silently refresh against the *new*
  // user's refresh token and become them, with a page still full of somebody
  // else's content. Dropping it makes this tab unauthenticated, so the app
  // re-establishes identity from the new refresh token instead of inheriting
  // a stale one.
  if (tokenStore.getAccess() === null) return;
  clearLocalAccess();
  notify(null);
}

let listening = false;

/**
 * Start syncing this tab with the others. Idempotent and SSR-safe.
 *
 * Returns a teardown function. Called once at module load below; exported so
 * a test can register and unregister a clean listener.
 */
export function startSessionSync(): () => void {
  if (typeof window === "undefined") return () => {};
  if (listening) return stopSessionSync;

  window.addEventListener("storage", handleStorageEvent);
  listening = true;

  return stopSessionSync;
}

export function stopSessionSync(): void {
  if (typeof window === "undefined") return;
  window.removeEventListener("storage", handleStorageEvent);
  listening = false;
}

startSessionSync();
