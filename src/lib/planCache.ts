import { createHash } from "node:crypto";
import type { CheckIn } from "@/lib/checkin";
import type { Plan } from "@/lib/planSchema";
import { PROMPT_VERSION } from "@/lib/constants";

type CacheEntry = {
  plan: Plan;
  severity: string;
  score: number;
  source: "gemini";
  expiresAt: number;
};

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export function checkInFingerprint(checkin: CheckIn) {
  const payload = {
    v: PROMPT_VERSION,
    sleepHours: checkin.sleepHours,
    stress: checkin.stress,
    anxiety: checkin.anxiety,
    focus: checkin.focus,
    socialSupport: checkin.socialSupport,
    appetite: checkin.appetite,
    workload: checkin.workload,
    lowMoodDaysLast2Weeks: checkin.lowMoodDaysLast2Weeks,
    unsafeThoughts: checkin.unsafeThoughts,
    notes: (checkin.notes ?? "").trim().toLowerCase(),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function getCachedPlan(fingerprint: string): CacheEntry | null {
  const hit = cache.get(fingerprint);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(fingerprint);
    return null;
  }
  return hit;
}

export function setCachedPlan(fingerprint: string, entry: Omit<CacheEntry, "expiresAt">) {
  cache.set(fingerprint, { ...entry, expiresAt: Date.now() + TTL_MS });
}

export function clearPlanCache() {
  cache.clear();
}
