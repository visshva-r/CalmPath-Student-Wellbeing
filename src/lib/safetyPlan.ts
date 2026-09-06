import { defaultResources } from "@/lib/checkin";
import type { Plan } from "@/lib/planSchema";

export function highRiskPlan(reason: string): Plan {
  return {
    severityReasoning:
      reason +
      " If you feel unsafe or might harm yourself, seek immediate help from local emergency services or a trusted person right now.",
    immediateActions: [
      "Stop what you’re doing and take 10 slow breaths (count 4 in, 6 out).",
      "Reach out to a trusted person now (friend/roommate/family/mentor).",
      "Move to a safer, more public place if you’re alone and feeling unsafe.",
    ],
    dailyHabits: [
      "Eat something small and drink water (even a snack counts).",
      "Take a 10-minute walk or stretch to reset your body.",
      "Do one “minimum viable task” (2 minutes) to reduce overwhelm.",
    ],
    weeklyGoal: "Book one real support touchpoint (counselor/mentor/doctor).",
    followUpChecklist: [
      "Day 1: Tell one person what you’re going through (copy a script).",
      "Day 2: Reduce one commitment for this week (say no to 1 thing).",
      "Day 3: Sleep plan: pick a fixed wake time; keep it 3 days.",
      "Day 4: Do one short study block (20 minutes) + break.",
      "Day 5: Ask for help on one specific academic task.",
      "Day 6: Do something restorative (music, sport, prayer, nature).",
      "Day 7: Re-check-in and compare how you feel vs Day 1.",
    ],
    messageScripts: {
      friend:
        "Hey — I’m not doing great today and could really use 10 minutes to talk. Are you free right now? If not, when can we talk soon?",
      mentor:
        "Hi, I’m having a rough week and I think I need some support. Could we meet for 10–15 minutes (or can you point me to the right resource)?",
    },
    resources: defaultResources(),
  };
}

export function fallbackPlan(): Plan {
  return {
    severityReasoning:
      "We couldn’t generate a Gemini plan right now, so here’s a safe fallback plan.",
    immediateActions: [
      "Take 10 slow breaths (4 in, 6 out).",
      "Write down the next smallest task (2 minutes).",
      "Message one trusted person for support.",
    ],
    dailyHabits: [
      "Sleep: pick a fixed wake time for 3 days.",
      "One 20-minute focus block + break.",
      "Move your body for 10 minutes.",
    ],
    weeklyGoal: "Reduce one commitment and protect study time.",
    followUpChecklist: [
      "Day 1: Do 1 tiny task (2 minutes).",
      "Day 2: 20-minute focus block.",
      "Day 3: Ask for help on one topic.",
      "Day 4: Clean up your schedule (remove 1 item).",
      "Day 5: Short walk + hydration.",
      "Day 6: Review what worked.",
      "Day 7: Re-check-in.",
    ],
    messageScripts: {
      friend:
        "Hey — I’m stressed and could use 10 minutes to talk. Are you free today?",
      mentor:
        "Hi, I’m feeling overwhelmed and could use guidance. Can we meet briefly this week?",
    },
    resources: defaultResources(),
  };
}
