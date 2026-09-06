import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

const steps = [
  {
    n: "01",
    title: "Check in",
    body: "Sleep, stress, support. About two minutes, with a live score as you go.",
  },
  {
    n: "02",
    title: "See why",
    body: "Low, moderate, or high, with the reasons behind it.",
  },
  {
    n: "03",
    title: "Do the week",
    body: "Immediate actions, habits, scripts, and a 7-day checklist you can tick off.",
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
            Sample outcome
          </p>
          <p className="mt-2 text-lg font-semibold">Moderate · score 58</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
            <div className="h-full w-[58%] rounded-full bg-moderate" />
          </div>
          <ul className="mt-5 grid gap-2 text-sm text-quiet">
            <li className="rounded-xl bg-soft px-3 py-2">Low sleep last night (&lt;6h)</li>
            <li className="rounded-xl bg-soft px-3 py-2">Workload pressure is elevated</li>
            <li className="rounded-xl bg-brand-soft px-3 py-2 text-brand">
              Plan path: Gemini (not a medical label)
            </li>
          </ul>
          <p className="mt-4 text-xs text-quiet">
            High-risk check-ins never call Gemini. They return a safety template instead.
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
