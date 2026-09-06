import Link from "next/link";
import { PageShell } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <PageShell>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Policy
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-quiet">
        CalmPath is a non-diagnostic student wellbeing tool. This page is the
        source of truth for what is processed, stored, and sent to Gemini.
      </p>

      <div className="mt-8 grid gap-8 border-t border-line pt-8 text-sm leading-7 text-quiet">
        <section>
          <h2 className="font-semibold text-foreground">What we process</h2>
          <p className="mt-2">
            Check-in sliders (sleep, stress, anxiety, workload, focus, support,
            appetite, mood days) and an optional notes field. We do not ask for
            your name, student ID, or medical history.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">How Gemini is used</h2>
          <p className="mt-2">
            Your current check-in is sent to Google Gemini to generate a structured
            7-day plan. High-risk or “I feel unsafe” responses skip the model and
            return a fixed safety plan instead.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">What is stored</h2>
          <p className="mt-2">
            By default we store only anonymized summaries: severity band, score,
            timestamp, and plan source (Gemini / safety / fallback). Optional notes
            are stored only if you explicitly enable “Include notes in saved
            history.” Server logs never include notes or raw check-in answers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">Accounts</h2>
          <p className="mt-2">
            If Firebase is configured, you are signed in anonymously so your
            history can persist after you choose Google sign-in. You can reset
            local demo data from the dashboard. This tool is not medical advice.
          </p>
        </section>
      </div>

      <p className="mt-10">
        <Link href="/" className="text-sm font-semibold text-brand hover:text-brand-hover">
          ← Back home
        </Link>
      </p>
    </PageShell>
  );
}
