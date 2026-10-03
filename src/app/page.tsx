import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

const steps = [
  {
    n: "01",
    title: "Check in",
    body: "Three-step wizard. Inputs validated before you continue.",
  },
  {
    n: "02",
    title: "See why",
    body: "Deterministic low / moderate / high band, with reasons on the results page.",
  },
  {
    n: "03",
    title: "Do the week",
    body: "Gemini 7-day plan (Zod-validated JSON), or a fixed safety plan if risk is high.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            CalmPath · Student wellbeing
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
            Two minutes.
            <span className="mt-1 block text-brand">A clear next week.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-quiet sm:text-lg">
            A short check-in, a clear score, and a week of next steps. Not a
            diagnosis. Not a chatbot wall of text.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/checkin" size="lg">
              Start check-in
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" size="lg">
              Your history
            </ButtonLink>
          </div>
          <p className="mt-5 max-w-md text-xs leading-5 text-quiet">
            If you feel unsafe, the model is skipped and you get a fixed safety
            plan.{" "}
            <Link href="/privacy" className="font-semibold text-foreground underline decoration-line underline-offset-2">
              Privacy
            </Link>
          </p>
        </div>

        <aside className="rounded-3xl border border-line bg-surface p-6 shadow-[0_12px_40px_rgb(42_107_90/0.08)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-quiet">
            End-to-end flow
          </p>
          <ol className="mt-3 grid gap-2 text-sm">
            <li className="rounded-xl bg-soft px-3 py-2">
              <span className="font-semibold text-foreground">Check-in →</span>{" "}
              3 steps, live severity preview
            </li>
            <li className="rounded-xl bg-soft px-3 py-2">
              <span className="font-semibold text-foreground">Results →</span>{" "}
              score, reasons, plan pipeline
            </li>
            <li className="rounded-xl border border-moderate/30 bg-mod-soft/50 px-3 py-2">
              <span className="font-semibold text-foreground">Safety →</span>{" "}
              check “I feel unsafe” on step 3; Gemini is skipped
            </li>
          </ol>
          <p className="mt-4 text-xs text-quiet">
            Normal path uses Gemini; high-risk answers use a fixed safety template only.
          </p>
        </aside>
      </section>

      <section className="border-t border-line bg-surface/60">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n}>
              <p className="font-mono text-xs text-brand">{step.n}</p>
              <h2 className="mt-2 text-base font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm leading-6 text-quiet">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
