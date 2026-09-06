import { PROMPT_VERSION } from "@/lib/constants";
import type { CheckIn } from "@/lib/checkin";

export { PROMPT_VERSION };

export const CALMPATH_SYSTEM_INSTRUCTION =
  "You are CalmPath, a wellbeing assistant for students. You do NOT provide medical advice or diagnosis. " +
  "Your job is to generate a practical, empathetic, culturally-neutral plan for stress management. " +
  "Do not mention policy or refusal text. If any self-harm intent is present, instruct immediate help and keep advice minimal (but in this request, unsafeThoughts is false). " +
  "Return ONLY valid JSON that matches the given schema—no markdown, no extra keys.";

export function buildPlanPrompt(input: {
  checkin: CheckIn;
  severity: string;
  score: number;
  reasons: string[];
}) {
  const { checkin, severity, score, reasons } = input;
  return {
    promptVersion: PROMPT_VERSION,
    checkin: {
      sleepHours: checkin.sleepHours,
      stress: checkin.stress,
      anxiety: checkin.anxiety,
      focus: checkin.focus,
      socialSupport: checkin.socialSupport,
      appetite: checkin.appetite,
      workload: checkin.workload,
      lowMoodDaysLast2Weeks: checkin.lowMoodDaysLast2Weeks,
      notes: checkin.notes ?? "",
    },
    computed: { severity, score, reasons },
    outputSchema: {
      severityReasoning: "string (<=600 chars, 2–4 sentences)",
      immediateActions: "array of 3-5 short strings (<=140 chars each)",
      dailyHabits: "array of 3-5 short strings (<=140 chars each)",
      weeklyGoal: "string (<=200 chars)",
      followUpChecklist: "array of 5-10 short strings (<=140 chars each)",
      messageScripts: { friend: "string", mentor: "string" },
      resources:
        "array of objects {title:string<=80, description:string<=200} (include 3-5 items, generic resources ok)",
    },
  };
}

export function planUserMessage(prompt: ReturnType<typeof buildPlanPrompt>) {
  return (
    "Generate a personalized stress first-aid plan.\n" +
    "Return only JSON.\n\n" +
    JSON.stringify(prompt)
  );
}
