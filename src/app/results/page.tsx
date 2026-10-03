"use client";

import { useEffect, useRef, useState } from "react";
import { FollowUpChecklist } from "@/components/FollowUpChecklist";
import { PlanBadge } from "@/components/PlanBadge";
import { PlanPipeline } from "@/components/PlanPipeline";
import { SeverityDelta } from "@/components/SeverityDelta";
import { ButtonLink } from "@/components/ui/Button";
import { Card, PageShell } from "@/components/ui/Card";
import { ScoreMeter, SeverityChip } from "@/components/ui/SeverityChip";
import { checkInStreak } from "@/lib/analytics";
import { scoreCheckIn } from "@/lib/checkin";
import { PROMPT_VERSION } from "@/lib/constants";
import {
  readLocalHistory,
  saveCloudCheckIn,
  saveLocalHistoryItem,
  type HistoryItem,
  type PlanSource,
} from "@/lib/history";
import { PlanSchema, type Plan } from "@/lib/planSchema";
import { fallbackPlan, highRiskPlan } from "@/lib/safetyPlan";
import { loadCheckInSession } from "@/lib/sessionCheckin";
import { firebaseEnabled } from "@/lib/firebase/auth";

type ApiResponse =
  | {
      plan: Plan;
      severity: string;
      score: number;
      source?: PlanSource;
      promptVersion?: string;
      cached?: boolean;
    }
  | { error: string };

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string>("unknown");
  const [score, setScore] = useState<number>(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [source, setSource] = useState<PlanSource | "unknown">("unknown");
  const [cloudSaved, setCloudSaved] = useState<"pending" | "saved" | "local" | "skipped">(
    "pending",
  );
  const [cached, setCached] = useState(false);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [previous, setPrevious] = useState<HistoryItem | null>(null);
  const [streak, setStreak] = useState(0);
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const session = loadCheckInSession();
      if (!session) {
        setError("Missing check-in. Please complete the check-in first.");
        setLoading(false);
        setCloudSaved("skipped");
        return;
      }

      const computed = scoreCheckIn(session.checkin);
      const highRisk =
        computed.severity === "high" || session.checkin.unsafeThoughts;
      setSeverity(computed.severity);
      setScore(computed.score);
      setReasons(computed.reasons);
      setLoading(true);
      setError(null);

      let nextSource: PlanSource = "fallback";
      let nextPlan: Plan = fallbackPlan();
      let nextSeverity: string = computed.severity;
      let nextScore = computed.score;

      function applySafetyFallback() {
        nextSource = "safety";
        nextPlan = highRiskPlan(
          computed.reasons[0] ?? "High-risk indicators detected.",
        );
        nextSeverity = computed.severity;
        nextScore = computed.score;
      }

      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session.checkin),
        });
        const json = (await res.json()) as ApiResponse;
        if ("error" in json) {
          throw new Error(json.error);
        }
        const validated = PlanSchema.safeParse(json.plan);
        if (!validated.success) throw new Error("Invalid plan returned.");
        nextPlan = validated.data;
        nextSource = json.source ?? "gemini";
        nextSeverity = json.severity;
        nextScore = json.score;
        if (json.cached) setCached(true);
      } catch (e) {
        if (highRisk) {
          applySafetyFallback();
        } else {
          nextSource = "fallback";
          nextPlan = fallbackPlan();
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "Failed to generate plan. Try again.",
            );
          }
        }
      }

      if (cancelled) return;
      setPlan(nextPlan);
      setSource(nextSource);
      setSeverity(nextSeverity);
      setScore(nextScore);
      setLoading(false);

      if (savedRef.current) return;
      savedRef.current = true;

      const prior = readLocalHistory();
      const previousItem = prior.at(-1) ?? null;
      const historyItem = saveLocalHistoryItem({
        createdAt: new Date().toISOString(),
        severity: nextSeverity,
        score: nextScore,
        source: nextSource,
        notesIncluded: session.includeNotesInHistory,
      });
      const id = historyItem.id ?? crypto.randomUUID();
      setPrevious(previousItem);
      setStreak(checkInStreak([...prior, historyItem]));
      setCheckinId(id);

      if (!firebaseEnabled()) {
        setCloudSaved("local");
        return;
      }

      try {
        await saveCloudCheckIn({
          severity: nextSeverity,
          score: nextScore,
          source: nextSource,
          promptVersion: PROMPT_VERSION,
          includeNotes: session.includeNotesInHistory,
          notes: session.includeNotesInHistory ? session.checkin.notes : undefined,
        });
        if (!cancelled) setCloudSaved("saved");
      } catch {
        if (!cancelled) setCloudSaved("local");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const provenance =
    source === "safety"
      ? "Gemini was skipped. This is a fixed safety plan, not a model response."
      : source === "gemini" && cached
        ? "Same check-in fingerprint as a recent session. Reused the cached plan (24h)."
        : source === "gemini"
          ? "Generated by Gemini from this check-in. Validated against a Zod schema."
          : source === "fallback"
            ? "The model was unavailable. Showing a generic first-aid plan."
            : null;

  return (
    <PageShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Plan
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Your CalmPath plan
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {severity !== "unknown" ? (
              <SeverityChip severity={severity} score={score} />
            ) : null}
            {streak > 0 ? (
              <span className="text-xs font-semibold text-quiet">
                Streak {streak}d
              </span>
            ) : null}
            <PlanBadge source={source} cached={cached} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/checkin" variant="secondary" size="sm">
            Edit check-in
          </ButtonLink>
          <ButtonLink href="/dashboard" size="sm">
            Dashboard
          </ButtonLink>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-mod-soft bg-mod-soft p-4 text-sm">
          <p className="font-semibold">Note</p>
          <p className="mt-1 text-quiet">{error}</p>
        </div>
      ) : null}

      {cloudSaved === "saved" ? (
        <p className="mb-4 text-xs text-quiet">
          Anonymized summary saved to your account.
        </p>
      ) : null}

      {loading || !plan ? (
        <Card>
          <p className="text-sm text-quiet">
            Scoring check-in, then generating your plan…
          </p>
          <div className="mt-4 grid gap-3">
            <div className="h-16 animate-pulse rounded-xl bg-soft" />
            <div className="h-24 animate-pulse rounded-xl bg-soft" />
            <div className="h-24 animate-pulse rounded-xl bg-soft" />
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <PlanPipeline
            severity={severity}
            score={score}
            source={source}
            cached={cached}
          />

          {source === "safety" ? (
            <div
              className="rounded-xl border border-moderate/40 bg-mod-soft px-4 py-3 text-sm"
              role="status"
            >
              <p className="font-semibold text-moderate">Safety guardrail active</p>
              <p className="mt-1 text-quiet">
                This session did not call Gemini. You are seeing a fixed escalation
                plan for high-risk answers.
              </p>
            </div>
          ) : null}

          <Card title="Why this band">
            <ScoreMeter score={score} />
            {provenance ? (
              <p className="mt-4 text-sm leading-6 text-quiet">{provenance}</p>
            ) : null}
            {reasons.length > 0 ? (
              <ul className="mt-4 grid gap-2">
                {reasons.map((reason) => (
                  <li
                    key={reason}
                    className="rounded-xl bg-soft px-3 py-2 text-sm"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <SeverityDelta previous={previous} current={{ severity, score }} />

          <Card title="What this means">
            <p className="text-base leading-7">{plan.severityReasoning}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Do this now (10–20 min)">
              <ol className="list-decimal space-y-2 pl-5 text-base">
                {plan.immediateActions.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ol>
            </Card>
            <Card title="Daily habits (next 7 days)">
              <ol className="list-decimal space-y-2 pl-5 text-base">
                {plan.dailyHabits.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ol>
            </Card>
          </div>

          <Card title="Weekly goal">
            <p className="text-base">{plan.weeklyGoal}</p>
          </Card>

          {checkinId ? (
            <FollowUpChecklist checkinId={checkinId} items={plan.followUpChecklist} />
          ) : (
            <Card title="Follow-up checklist">
              <ul className="grid gap-2 text-base">
                {plan.followUpChecklist.map((x, i) => (
                  <li key={i} className="rounded-lg border border-line px-3 py-2">
                    {x}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Message a friend">
              <p className="text-base leading-7">{plan.messageScripts.friend}</p>
            </Card>
            <Card title="Message a mentor/counselor">
              <p className="text-base leading-7">{plan.messageScripts.mentor}</p>
            </Card>
          </div>

          <Card title="Resources">
            <div className="grid gap-2">
              {plan.resources.map((r, i) => (
                <div key={i} className="rounded-xl bg-soft px-4 py-3">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 text-sm text-quiet">{r.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-xs leading-5 text-quiet">
            Safety note: CalmPath is not medical advice. If you feel unsafe,
            seek immediate help from local emergency services or a trusted person.
          </p>
        </div>
      )}
    </PageShell>
  );
}
