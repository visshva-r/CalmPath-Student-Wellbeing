import { describe, expect, it } from "vitest";
import { PlanSchema } from "@/lib/planSchema";
import { normalizePlan } from "@/lib/planNormalize";
import { samplePlan } from "@/test/fixtures";

describe("PlanSchema", () => {
  it("accepts a complete plan", () => {
    expect(PlanSchema.safeParse(samplePlan).success).toBe(true);
  });

  it("rejects too few immediate actions", () => {
    const parsed = PlanSchema.safeParse({
      ...samplePlan,
      immediateActions: ["only one"],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizePlan", () => {
  it("dedupes and pads short lists to schema bounds", () => {
    const plan = normalizePlan({
      severityReasoning: "  Reset this week.  ",
      immediateActions: ["Breathe", "breathe", "Walk"],
      dailyHabits: ["Sleep"],
      weeklyGoal: "Protect mornings",
      followUpChecklist: ["Day 1"],
      messageScripts: { friend: "Hi", mentor: "Hello" },
      resources: [],
    });
    expect(plan).not.toBeNull();
    expect(plan!.immediateActions.length).toBeGreaterThanOrEqual(3);
    expect(plan!.dailyHabits.length).toBeGreaterThanOrEqual(3);
    expect(plan!.followUpChecklist.length).toBeGreaterThanOrEqual(5);
    expect(new Set(plan!.immediateActions.map((x) => x.toLowerCase())).size).toBe(
      plan!.immediateActions.length,
    );
  });

  it("recovers a usable plan from empty input", () => {
    const plan = normalizePlan({});
    expect(plan).not.toBeNull();
    expect(PlanSchema.safeParse(plan).success).toBe(true);
  });
});
