import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { tokenStore } from "@/api/tokens";

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Bumped whenever the token changes, to re-run the lookup below.
  //
  // This used to read the token once on mount and never look again, so a
  // token change -- including a sign-out in another tab, which `tokenStore`
  // now propagates -- left this hook showing the previous user indefinitely.
  const [tokenVersion, setTokenVersion] = useState(0);

  useEffect(() => {
    return tokenStore.subscribe(() => setTokenVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      return;
    }
    let cancelled = false;
    api
      .get<AuthUser>("/api/users/me")
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenVersion]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return { user, setUser, logout };
}
