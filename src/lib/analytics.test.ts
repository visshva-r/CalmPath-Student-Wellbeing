import { describe, expect, it } from "vitest";
import { checkInStreak, severityCounts, toCsv } from "@/lib/analytics";
import type { HistoryItem } from "@/lib/history";

function item(partial: Partial<HistoryItem> & Pick<HistoryItem, "createdAt" | "severity">): HistoryItem {
  return { score: 40, ...partial };
}

describe("analytics", () => {
  it("counts severity bands", () => {
    const counts = severityCounts([
      item({ createdAt: new Date().toISOString(), severity: "low" }),
      item({ createdAt: new Date().toISOString(), severity: "high", score: 90 }),
      item({ createdAt: new Date().toISOString(), severity: "high", score: 88 }),
    ]);
    expect(counts).toEqual({ low: 1, moderate: 0, high: 2 });
  });

  it("computes a streak from consecutive calendar days", () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const items: HistoryItem[] = [
      item({ createdAt: today.toISOString(), severity: "low" }),
      item({ createdAt: yesterday.toISOString(), severity: "moderate", score: 50 }),
    ];
    expect(checkInStreak(items)).toBe(2);
  });

  it("exports csv with a header row", () => {
    const csv = toCsv([
      item({
        createdAt: "2026-08-14T00:00:00.000Z",
        severity: "low",
        source: "gemini",
      }),
    ]);
    expect(csv.startsWith("createdAt,severity,score,source")).toBe(true);
    expect(csv).toContain("low");
  });
});
