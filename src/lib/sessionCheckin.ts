import { z } from "zod";
import { CheckInSchema, type CheckIn } from "@/lib/checkin";
import { STORAGE_KEYS } from "@/lib/constants";

export const CheckInSessionSchema = z.object({
  checkin: CheckInSchema,
  includeNotesInHistory: z.boolean().default(false),
  consentedAt: z.string().optional(),
});

export type CheckInSession = z.infer<typeof CheckInSessionSchema>;

export function saveCheckInSession(session: CheckInSession) {
  sessionStorage.setItem(STORAGE_KEYS.lastCheckin, JSON.stringify(session));
}

export function loadCheckInSession(): CheckInSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.lastCheckin);
    if (!raw) return null;
    const parsedJson = JSON.parse(raw) as unknown;
    const wrapped = CheckInSessionSchema.safeParse(parsedJson);
    if (wrapped.success) return wrapped.data;
    const legacy = CheckInSchema.safeParse(parsedJson);
    if (legacy.success) {
      return { checkin: legacy.data, includeNotesInHistory: false };
    }
    return null;
  } catch {
    return null;
  }
}

export function consentAccepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.consent) === "accepted";
  } catch {
    return false;
  }
}

export function acceptConsent() {
  localStorage.setItem(STORAGE_KEYS.consent, "accepted");
}

export type { CheckIn };
