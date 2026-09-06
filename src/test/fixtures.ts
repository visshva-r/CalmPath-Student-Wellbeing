import type { CheckIn } from "@/lib/checkin";
import type { Plan } from "@/lib/planSchema";

export function sampleCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    sleepHours: 7.5,
    stress: 3,
    anxiety: 3,
    focus: 7,
    socialSupport: 7,
    appetite: 7,
    workload: 4,
    lowMoodDaysLast2Weeks: 1,
    unsafeThoughts: false,
    notes: "",
    ...overrides,
  };
}

export const samplePlan: Plan = {
  severityReasoning: "Your load looks manageable this week with a few focused resets.",
  immediateActions: [
    "Take 10 slow breaths.",
    "Write the next 2-minute task.",
    "Message one trusted person.",
  ],
  dailyHabits: [
    "Keep a fixed wake time.",
    "Do one 20-minute focus block.",
    "Walk for 10 minutes.",
  ],
  weeklyGoal: "Protect sleep and reduce one extra commitment.",
  followUpChecklist: [
    "Day 1: Tiny task.",
    "Day 2: Focus block.",
    "Day 3: Ask for help.",
    "Day 4: Cut one commitment.",
    "Day 5: Short walk.",
  ],
  messageScripts: {
    friend: "Hey — can we talk for 10 minutes today?",
    mentor: "Hi, could we meet briefly this week for guidance?",
  },
  resources: [
    {
      title: "Talk to someone you trust",
      description: "Ask a friend or mentor for 10 minutes today.",
    },
  ],
};
