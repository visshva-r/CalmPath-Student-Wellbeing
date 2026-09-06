import { PlanSchema, type Plan } from "@/lib/planSchema";

function clip(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function uniqueList(value: unknown, min: number, max: number, itemMax: number, filler: string) {
  const arr = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const text = clip(item, itemMax);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  while (out.length < min) out.push(filler);
  return out;
}

function uniqueResources(value: unknown) {
  const arr = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const out: { title: string; description: string }[] = [];
  for (const item of arr) {
    const rec = item as { title?: unknown; description?: unknown };
    const title = clip(rec?.title, 80);
    const description = clip(rec?.description, 200);
    const key = title.toLowerCase();
    if (!title || !description || seen.has(key)) continue;
    seen.add(key);
    out.push({ title, description });
    if (out.length >= 5) break;
  }
  if (out.length === 0) {
    out.push({
      title: "Talk to someone you trust",
      description: "A friend, family member, mentor, or counselor. Ask for 10 minutes today.",
    });
  }
  return out;
}

export function normalizePlan(input: unknown): Plan | null {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const scripts =
    raw.messageScripts && typeof raw.messageScripts === "object"
      ? (raw.messageScripts as Record<string, unknown>)
      : {};

  const candidate = {
    severityReasoning: clip(raw.severityReasoning, 600) || "Your check-in suggests a practical reset this week.",
    immediateActions: uniqueList(raw.immediateActions, 3, 5, 140, "Take 10 slow breaths."),
    dailyHabits: uniqueList(raw.dailyHabits, 3, 5, 140, "Protect a 20-minute focus block."),
    weeklyGoal: clip(raw.weeklyGoal, 200) || "Protect sleep and reduce one extra commitment.",
    followUpChecklist: uniqueList(
      raw.followUpChecklist,
      5,
      10,
      140,
      "Re-check-in and notice what improved.",
    ),
    messageScripts: {
      friend:
        clip(scripts.friend, 400) ||
        "Hey — I’m stressed and could use 10 minutes to talk. Are you free today?",
      mentor:
        clip(scripts.mentor, 400) ||
        "Hi, I’m feeling overwhelmed and could use guidance. Can we meet briefly this week?",
    },
    resources: uniqueResources(raw.resources),
  };

  const parsed = PlanSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
