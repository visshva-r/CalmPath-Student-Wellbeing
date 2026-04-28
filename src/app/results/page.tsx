"use client";

import { useEffect, useState } from "react";
import { CheckInSchema, defaultResources, scoreCheckIn } from "@/lib/checkin";
import { PlanSchema, type Plan } from "@/lib/planSchema";

const STORAGE_KEY = "calmpath:lastCheckin";
const HISTORY_KEY = "calmpath:history";

type ApiResponse =
  | { plan: Plan; severity: string; score: number }
  | { error: string; raw?: string };

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string>("unknown");
  const [score, setScore] = useState<number>(0);
  const [checkin, setCheckin] = useState<unknown>(null);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(STORAGE_KEY)
          : null;
      if (!raw) {
        setCheckin(null);
        return;
      }
      setCheckin(JSON.parse(raw));
    } catch {
      setCheckin(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const parsed = CheckInSchema.safeParse(checkin);
      if (!parsed.success) {
        setError("Missing check-in. Please complete the check-in first.");
        setLoading(false);
        return;
      }
      const computed = scoreCheckIn(parsed.data);
      setSeverity(computed.severity);
      setScore(computed.score);

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const json = (await res.json()) as ApiResponse;
        if ("error" in json) {
          throw new Error(json.error);
        }
        const validated = PlanSchema.safeParse(json.plan);
        if (!validated.success) throw new Error("Invalid plan returned.");

        if (cancelled) return;
        setPlan(validated.data);
        saveHistory({
          createdAt: new Date().toISOString(),
          severity: json.severity,
          score: json.score,
        });
      } catch (e) {
        if (cancelled) return;
        setPlan({
          severityReasoning:
            "We couldn’t generate a Gemini plan right now, so here’s a safe fallback plan.",
          immediateActions: [
            "Take 10 slow breaths (4 in, 6 out).",
            "Write down the next smallest task (2 minutes).",
            "Message one trusted person for support.",
          ],
          dailyHabits: [
            "Sleep: pick a fixed wake time for 3 days.",
            "One 20-minute focus block + break.",
            "Move your body for 10 minutes.",
          ],
          weeklyGoal: "Reduce one commitment and protect study time.",
          followUpChecklist: [
            "Day 1: Do 1 tiny task (2 minutes).",
            "Day 2: 20-minute focus block.",
            "Day 3: Ask for help on one topic.",
            "Day 4: Clean up your schedule (remove 1 item).",
            "Day 5: Short walk + hydration.",
            "Day 6: Review what worked.",
            "Day 7: Re-check-in.",
          ],
          messageScripts: {
            friend:
              "Hey — I’m stressed and could use 10 minutes to talk. Are you free today?",
            mentor:
              "Hi, I’m feeling overwhelmed and could use guidance. Can we meet briefly this week?",
          },
          resources: defaultResources(),
        });
        setError(
          e instanceof Error ? e.message : "Failed to generate plan. Try again.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [checkin]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your CalmPath plan
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Severity: <span className="font-semibold">{severity}</span> • Score:{" "}
            <span className="font-semibold">{score}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/checkin"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
          >
            Edit check‑in
          </a>
          <a
            href="/dashboard"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Dashboard
          </a>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Note</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {loading || !plan ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Generating your plan…
          </p>
          <div className="mt-4 grid gap-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <Card title="What this means">
            <p className="text-base leading-7 text-zinc-700 dark:text-zinc-200">
              {plan.severityReasoning}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Do this now (10–20 min)">
              <ul className="list-disc pl-5 text-base text-zinc-700 dark:text-zinc-200">
                {plan.immediateActions.map((x, i) => (
                  <li key={i} className="py-0.5">
                    {x}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Daily habits (next 7 days)">
              <ul className="list-disc pl-5 text-base text-zinc-700 dark:text-zinc-200">
                {plan.dailyHabits.map((x, i) => (
                  <li key={i} className="py-0.5">
                    {x}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Weekly goal">
            <p className="text-base text-zinc-700 dark:text-zinc-200">{plan.weeklyGoal}</p>
          </Card>

          <Card title="Follow-up checklist">
            <ul className="grid gap-2 text-base text-zinc-700 dark:text-zinc-200">
              {plan.followUpChecklist.map((x, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30"
                >
                  {x}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Message a friend">
              <p className="text-base text-zinc-700 dark:text-zinc-200">
                {plan.messageScripts.friend}
              </p>
            </Card>
            <Card title="Message a mentor/counselor">
              <p className="text-base text-zinc-700 dark:text-zinc-200">
                {plan.messageScripts.mentor}
              </p>
            </Card>
          </div>

          <Card title="Resources">
            <div className="grid gap-2">
              {plan.resources.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/30"
                >
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {r.title}
                  </p>
                  <p className="mt-1 text-base text-zinc-700 dark:text-zinc-200">
                    {r.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Safety note: CalmPath is not medical advice. If you feel unsafe,
            seek immediate help from local emergency services or a trusted person.
          </p>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function saveHistory(item: { createdAt: string; severity: string; score: number }) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const next = Array.isArray(list) ? [...list, item] : [item];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(-200)));
  } catch {
    // ignore
  }
}

