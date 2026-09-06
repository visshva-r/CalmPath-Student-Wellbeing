import { daysSince } from "@/lib/analytics";
import { SeverityChip } from "@/components/ui/SeverityChip";

export function SeverityDelta({
  previous,
  current,
}: {
  previous: { severity: string; score: number; createdAt: string } | null;
  current: { severity: string; score: number };
}) {
  if (!previous) return null;
  const delta = current.score - previous.score;
  const improved = delta < 0;
  const days = daysSince(previous.createdAt);
  const recheck = days >= 6;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold">Compared with last check-in</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <SeverityChip severity={previous.severity} score={previous.score} />
        <span className="text-quiet" aria-hidden>
          →
        </span>
        <SeverityChip severity={current.severity} score={current.score} />
        <span
          className={`font-semibold ${improved ? "text-low" : delta > 0 ? "text-high" : "text-quiet"}`}
        >
          {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} score`}
        </span>
      </div>
      <p className="mt-2 text-xs text-quiet">
        {days === 0
          ? "Last check-in was earlier today."
          : `${days} day${days === 1 ? "" : "s"} since last check-in.`}
        {recheck ? " This is your 7-day re-check-in. Notice what changed." : ""}
      </p>
    </section>
  );
}
