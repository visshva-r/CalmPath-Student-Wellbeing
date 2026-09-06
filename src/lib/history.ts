import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { STORAGE_KEYS } from "@/lib/constants";
import { ensureSignedIn } from "@/lib/firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Severity } from "@/lib/checkin";

export type PlanSource = "gemini" | "safety" | "fallback";

export type HistoryItem = {
  id?: string;
  createdAt: string;
  severity: Severity | string;
  score: number;
  source?: PlanSource;
  notesIncluded?: boolean;
  notes?: string;
};

export function readLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(items.slice(-200)));
}

export function saveLocalHistoryItem(item: HistoryItem) {
  const withId = { ...item, id: item.id ?? crypto.randomUUID() };
  const next = [...readLocalHistory(), withId];
  writeLocalHistory(next);
  return withId;
}

export async function saveCloudCheckIn(item: {
  severity: string;
  score: number;
  source: PlanSource;
  promptVersion: string;
  includeNotes: boolean;
  notes?: string;
}): Promise<{ checkinId: string | null; planId: string | null }> {
  const db = getFirebaseDb();
  const user = await ensureSignedIn();
  if (!db || !user) return { checkinId: null, planId: null };

  const checkinRef = await addDoc(collection(db, "users", user.uid, "checkins"), {
    uid: user.uid,
    severity: item.severity,
    score: item.score,
    createdAt: serverTimestamp(),
    notesIncluded: item.includeNotes,
    ...(item.includeNotes && item.notes ? { notes: item.notes.slice(0, 500) } : {}),
  });

  const now = new Date();
  try {
    await addDoc(collection(db, "publicCheckins"), {
      severity: item.severity,
      score: item.score,
      source: item.source,
      createdAt: serverTimestamp(),
      hour: now.getHours(),
      weekday: now.getDay(),
    });
  } catch {
    // Admin aggregate is optional if rules are not published yet.
  }

  const planRef = await addDoc(collection(db, "users", user.uid, "plans"), {
    uid: user.uid,
    checkinId: checkinRef.id,
    severity: item.severity,
    score: item.score,
    source: item.source,
    promptVersion: item.promptVersion,
    createdAt: serverTimestamp(),
  });

  return { checkinId: checkinRef.id, planId: planRef.id };
}

export async function listCloudCheckIns(): Promise<HistoryItem[]> {
  const db = getFirebaseDb();
  const user = await ensureSignedIn();
  if (!db || !user) return [];

  const q = query(
    collection(db, "users", user.uid, "checkins"),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt =
      typeof data.createdAt?.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
    return {
      id: d.id,
      createdAt,
      severity: data.severity as string,
      score: Number(data.score) || 0,
      notesIncluded: Boolean(data.notesIncluded),
    };
  });
}

export async function listPublicCheckIns(): Promise<HistoryItem[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(collection(db, "publicCheckins"), orderBy("createdAt", "desc"), limit(400));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const createdAt =
      typeof data.createdAt?.toDate === "function"
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
    return {
      id: d.id,
      createdAt,
      severity: data.severity as string,
      score: Number(data.score) || 0,
      source: data.source as PlanSource | undefined,
    };
  });
}

export async function clearCloudCheckIns() {
  const db = getFirebaseDb();
  const user = await ensureSignedIn();
  if (!db || !user) return;
  const snap = await getDocs(collection(db, "users", user.uid, "checkins"));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "users", user.uid, "checkins", d.id))));
}
