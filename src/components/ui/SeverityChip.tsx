import type { Severity } from "@/lib/checkin";

const styles: Record<Severity, string> = {
  low: "bg-brand-soft text-low",
  moderate: "bg-mod-soft text-moderate",
  high: "bg-high-soft text-high",
};

export function normalizeSeverity(value: string): Severity {
  if (value === "high" || value === "moderate") return value;
  return "low";
}

export function SeverityChip({
  severity,
  score,
}: {
  severity: string;
  score?: number;
}) {
  const band = normalizeSeverity(severity);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[band]}`}
    >
      {band}
      {typeof score === "number" ? (
        <span className="tabular-nums opacity-80">· {score}</span>
      ) : null}
    </span>
  );
}

export function ScoreMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const band: Severity =
    clamped >= 80 ? "high" : clamped >= 45 ? "moderate" : "low";
  const fill =
    band === "high" ? "bg-high" : band === "moderate" ? "bg-moderate" : "bg-low";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-quiet">Your score</p>
        <p className="text-2xl font-semibold tabular-nums">{clamped}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-quiet">
        <span>Low</span>
        <span>45</span>
        <span>80</span>
        <span>High</span>
      </div>
    </div>
  );
}
