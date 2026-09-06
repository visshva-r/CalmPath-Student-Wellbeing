import { describe, expect, it } from "vitest";
import { CheckInSchema, scoreCheckIn } from "@/lib/checkin";
import { sampleCheckIn } from "@/test/fixtures";

describe("CheckInSchema", () => {
  it("accepts a valid check-in", () => {
    const parsed = CheckInSchema.safeParse(sampleCheckIn());
    expect(parsed.success).toBe(true);
  });

  it("rejects out-of-range stress", () => {
    const parsed = CheckInSchema.safeParse(sampleCheckIn({ stress: 11 }));
    expect(parsed.success).toBe(false);
  });
});

describe("scoreCheckIn", () => {
  it("returns low severity for a healthy baseline", () => {
    const result = scoreCheckIn(sampleCheckIn());
    expect(result.severity).toBe("low");
    expect(result.score).toBeLessThan(45);
  });

  it("returns high severity when unsafe thoughts are flagged", () => {
    const result = scoreCheckIn(sampleCheckIn({ unsafeThoughts: true }));
    expect(result.severity).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons.some((r) => r.toLowerCase().includes("safety"))).toBe(true);
  });

  it("increases score for low sleep and high workload", () => {
    const calm = scoreCheckIn(sampleCheckIn());
    const strained = scoreCheckIn(
      sampleCheckIn({
        sleepHours: 4,
        stress: 9,
        anxiety: 9,
        workload: 10,
        focus: 2,
      }),
    );
    expect(strained.score).toBeGreaterThan(calm.score);
    expect(strained.severity).not.toBe("low");
  });
});
