"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  ensureSignedIn,
  firebaseEnabled,
  signInWithGoogle,
  signOutUser,
  watchAuth,
} from "@/lib/firebase/auth";

type AuthContextValue = {
  enabled: boolean;
  ready: boolean;
  user: User | null;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  enabled: false,
  ready: true,
  user: null,
  signInGoogle: async () => undefined,
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const enabled = firebaseEnabled();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    const unsub = watchAuth((next) => {
      setUser(next);
      setReady(true);
    });
    void ensureSignedIn().catch(() => setReady(true));
    return unsub;
  }, [enabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled,
      ready,
      user,
      signInGoogle: async () => {
        await signInWithGoogle();
      },
      signOut: async () => {
        await signOutUser();
      },
    }),
    [enabled, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
