import { doc, getDoc, setDoc } from "firebase/firestore";
import { STORAGE_KEYS } from "@/lib/constants";
import { ensureSignedIn } from "@/lib/firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export type FollowUpState = {
  checkinId: string;
  items: string[];
  completed: boolean[];
  updatedAt: string;
};

function emptyState(checkinId: string, items: string[]): FollowUpState {
  return {
    checkinId,
    items,
    completed: items.map(() => false),
    updatedAt: new Date().toISOString(),
  };
}

function readAllLocal(): Record<string, FollowUpState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.followUp);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, FollowUpState>) : {};
  } catch {
    return {};
  }
}

export function loadLocalFollowUp(checkinId: string, items: string[]): FollowUpState {
  const all = readAllLocal();
  const existing = all[checkinId];
  if (existing && Array.isArray(existing.completed) && existing.items?.length === items.length) {
    return { ...existing, items };
  }
  return emptyState(checkinId, items);
}

export function saveLocalFollowUp(state: FollowUpState) {
  const all = readAllLocal();
  all[state.checkinId] = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.followUp, JSON.stringify(all));
}

export function followUpPercent(state: FollowUpState) {
  if (state.completed.length === 0) return 0;
  const done = state.completed.filter(Boolean).length;
  return Math.round((done / state.completed.length) * 100);
}

export async function loadCloudFollowUp(checkinId: string, items: string[]) {
  if (!isFirebaseConfigured()) return null;
  const db = getFirebaseDb();
  const user = await ensureSignedIn();
  if (!db || !user) return null;
  const snap = await getDoc(doc(db, "users", user.uid, "followups", checkinId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const completed = Array.isArray(data.completed)
    ? (data.completed as boolean[]).slice(0, items.length)
    : items.map(() => false);
  while (completed.length < items.length) completed.push(false);
  return {
    checkinId,
    items,
    completed,
    updatedAt: new Date().toISOString(),
  } satisfies FollowUpState;
}

export async function saveCloudFollowUp(state: FollowUpState) {
  if (!isFirebaseConfigured()) return;
  const db = getFirebaseDb();
  const user = await ensureSignedIn();
  if (!db || !user) return;
  await setDoc(doc(db, "users", user.uid, "followups", state.checkinId), {
    uid: user.uid,
    completed: state.completed,
    percent: followUpPercent(state),
    itemCount: state.items.length,
    updatedAt: new Date().toISOString(),
  });
}
