import { SeverityChip } from "@/components/ui/SeverityChip";
import type { PlanSource } from "@/lib/history";

export function PlanPipeline({
  severity,
  score,
  source,
  cached,
}: {
  severity: string;
  score: number;
  source: PlanSource | "unknown";
  cached?: boolean;
}) {
  const planLabel =
    source === "safety"
      ? "Fixed safety plan"
      : source === "gemini"
        ? cached
          ? "Gemini plan (cached)"
          : "Gemini plan"
        : source === "fallback"
          ? "Offline fallback"
          : "Plan";

  const planDetail =
    source === "safety"
      ? "Safety guardrail: model not called"
      : source === "gemini"
        ? "Response validated with Zod"
        : source === "fallback"
          ? "Used when the API is unavailable"
          : "";

  const steps = [
    {
      n: "1",
      title: "Check-in",
      detail: "3-step wizard (validated inputs)",
    },
    {
      n: "2",
      title: "Severity",
      detail: "Deterministic score + reasons",
    },
    {
      n: "3",
      title: planLabel,
      detail: planDetail,
    },
  ];

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-4"
      aria-label="How your plan was built"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Live flow
      </p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.n}
            className={`relative rounded-xl border border-line bg-background px-3 py-3 ${
              i === 2 && source === "safety" ? "border-moderate bg-mod-soft/40" : ""
            }`}
          >
            <p className="font-mono text-[10px] text-brand">{step.n}</p>
            <p className="mt-1 text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-quiet">{step.detail}</p>
            {i === 1 ? (
              <div className="mt-2">
                <SeverityChip severity={severity} score={score} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
