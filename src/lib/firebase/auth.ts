import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export function firebaseEnabled() {
  return isFirebaseConfigured();
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function ensureSignedIn(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const linked = await linkWithPopup(current, provider);
      return linked.user;
    } catch {
      const cred = await signInWithPopup(auth, provider);
      return cred.user;
    }
  }
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
