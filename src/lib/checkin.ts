import { z } from "zod";

export const CheckInSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  stress: z.number().int().min(0).max(10),
  anxiety: z.number().int().min(0).max(10),
  focus: z.number().int().min(0).max(10),
  socialSupport: z.number().int().min(0).max(10),
  appetite: z.number().int().min(0).max(10),
  workload: z.number().int().min(0).max(10),
  lowMoodDaysLast2Weeks: z.number().int().min(0).max(14),
  unsafeThoughts: z.boolean(),
  notes: z.string().max(500).optional().default(""),
});

export type CheckIn = z.infer<typeof CheckInSchema>;

export type Severity = "low" | "moderate" | "high";

export function scoreCheckIn(input: CheckIn): {
  score: number;
  severity: Severity;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Sleep: <6 tends to correlate with higher stress risk.
  if (input.sleepHours < 5) {
    score += 20;
    reasons.push("Very low sleep reported (<5 hours).");
  } else if (input.sleepHours < 6) {
    score += 12;
    reasons.push("Low sleep reported (<6 hours).");
  } else if (input.sleepHours < 7) {
    score += 6;
  }

  // Higher is worse for these.
  score += Math.round((input.stress / 10) * 18);
  score += Math.round((input.anxiety / 10) * 18);
  score += Math.round((input.workload / 10) * 14);

  // Lower is worse for these.
  score += Math.round(((10 - input.focus) / 10) * 10);
  score += Math.round(((10 - input.socialSupport) / 10) * 10);
  score += Math.round(((10 - input.appetite) / 10) * 6);

  // Mood days.
  if (input.lowMoodDaysLast2Weeks >= 10) {
    score += 14;
    reasons.push("Low mood reported for many days in the last 2 weeks.");
  } else if (input.lowMoodDaysLast2Weeks >= 5) {
    score += 8;
  }

  // Safety override.
  if (input.unsafeThoughts) {
    score = Math.max(score, 85);
    reasons.push("Safety concern flagged by the user.");
  }

  const severity: Severity =
    score >= 80 ? "high" : score >= 45 ? "moderate" : "low";

  if (reasons.length === 0) {
    if (severity === "low") reasons.push("Overall indicators look manageable.");
    if (severity === "moderate")
      reasons.push("Some indicators suggest elevated stress.");
    if (severity === "high")
      reasons.push("Multiple indicators suggest high stress risk.");
  }

  return { score, severity, reasons };
}

export function defaultResources(): { title: string; description: string }[] {
  return [
    {
      title: "Talk to someone you trust",
      description:
        "A friend, family member, mentor, or counselor. Ask for 10 minutes today.",
    },
    {
      title: "Campus counseling / student support",
      description:
        "If your college has a counseling cell, use it. If not, ask your department advisor for resources.",
    },
    {
      title: "Emergency help",
      description:
        "If you feel in immediate danger, contact local emergency services right now.",
    },
  ];
}

