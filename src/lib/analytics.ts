import type { HistoryItem } from "@/lib/history";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function inLastDays(iso: string, days: number) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * DAY_MS;
}

export function filterByDays(items: HistoryItem[], days: number) {
  return items.filter((it) => inLastDays(it.createdAt, days));
}

export function severityCounts(items: HistoryItem[]) {
  const c = { low: 0, moderate: 0, high: 0 };
  for (const it of items) {
    if (it.severity === "low") c.low += 1;
    if (it.severity === "moderate") c.moderate += 1;
    if (it.severity === "high") c.high += 1;
  }
  return c;
}

export function trendByDay(items: HistoryItem[], days = 14) {
  const map = new Map<string, { date: string; count: number; high: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key.slice(5), count: 0, high: 0 });
  }
  for (const it of items) {
    const key = it.createdAt.slice(0, 10);
    const row = map.get(key);
    if (!row) continue;
    row.count += 1;
    if (it.severity === "high") row.high += 1;
  }
  return [...map.values()];
}

export function peakHours(items: HistoryItem[]) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const it of items) {
    const h = new Date(it.createdAt).getHours();
    if (h >= 0 && h < 24) hours[h]!.count += 1;
  }
  return hours;
}

export function peakWeekdays(items: HistoryItem[]) {
  const days = WEEKDAYS.map((label) => ({ label, count: 0 }));
  for (const it of items) {
    const d = new Date(it.createdAt).getDay();
    days[d]!.count += 1;
  }
  return days;
}

function localDayKey(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function checkInStreak(items: HistoryItem[]) {
  const days = new Set(
    items
      .map((it) => {
        const parsed = new Date(it.createdAt);
        return Number.isNaN(parsed.getTime()) ? "" : localDayKey(parsed);
      })
      .filter(Boolean),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export function toCsv(items: HistoryItem[]) {
  const header = "createdAt,severity,score,source";
  const rows = items.map((it) =>
    [it.createdAt, it.severity, it.score, it.source ?? ""].join(","),
  );
  return [header, ...rows].join("\n");
}

export function sampleCampusData(): HistoryItem[] {
  const now = Date.now();
  const severities = ["low", "moderate", "high"] as const;
  return Array.from({ length: 36 }, (_, i) => {
    const created = new Date(now - (i * 7 + (i % 5)) * 60 * 60 * 1000);
    const severity = severities[i % 3]!;
    return {
      id: `sample-${i}`,
      createdAt: created.toISOString(),
      severity,
      score: severity === "high" ? 82 : severity === "moderate" ? 58 : 28,
      source: i % 7 === 0 ? "safety" : "gemini",
    };
  });
}

export { inLastDays };
