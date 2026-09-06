"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ConsentGate } from "@/components/ConsentGate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, PageShell } from "@/components/ui/Card";
import { SeverityChip } from "@/components/ui/SeverityChip";
import { daysSince } from "@/lib/analytics";
import { CheckInSchema, scoreCheckIn, type CheckIn } from "@/lib/checkin";
import { readLocalHistory } from "@/lib/history";
import { saveCheckInSession } from "@/lib/sessionCheckin";

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

const STEPS = [
  { title: "Rest & body", blurb: "Sleep, energy, and mood days." },
  { title: "Stress & support", blurb: "Pressure, worry, focus, and who you can lean on." },
  { title: "Safety & notes", blurb: "Anything urgent, plus optional context for the plan." },
];

export default function CheckInPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CheckIn>({
    sleepHours: 6.5,
    stress: 5,
    anxiety: 4,
    focus: 5,
    socialSupport: 5,
    appetite: 6,
    workload: 6,
    lowMoodDaysLast2Weeks: 3,
    unsafeThoughts: false,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [includeNotesInHistory, setIncludeNotesInHistory] = useState(false);
  const lastCheckIn = useSyncExternalStore(
    () => () => undefined,
    () => readLocalHistory().at(-1) ?? null,
    () => null,
  );

  const computed = useMemo(() => scoreCheckIn(form), [form]);

  function update<K extends keyof CheckIn>(key: K, value: CheckIn[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    setError(null);
    const parsed = CheckInSchema.safeParse(form);
    if (!parsed.success) {
      setError("Please check your inputs.");
      return;
    }
    saveCheckInSession({
      checkin: parsed.data,
      includeNotesInHistory,
      consentedAt: new Date().toISOString(),
    });
    window.location.href = "/results";
  }

  return (
    <ConsentGate>
      <PageShell>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {STEPS[step].title}
            </h1>
            <p className="mt-1 text-sm text-quiet">{STEPS[step].blurb}</p>
          </div>
          <ButtonLink href="/" variant="secondary" size="sm">
            Home
          </ButtonLink>
        </div>

        <div className="mb-5 flex gap-2" aria-hidden>
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-soft"}`}
            />
          ))}
        </div>

        {lastCheckIn ? (
          <p className="mb-4 text-sm text-quiet">
            Last check-in:{" "}
            <SeverityChip severity={lastCheckIn.severity} score={lastCheckIn.score} />
            {daysSince(lastCheckIn.createdAt) >= 6
              ? ". Time for a 7-day re-check-in: compare how you feel vs last time."
              : `. ${daysSince(lastCheckIn.createdAt)}d ago.`}
          </p>
        ) : null}

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < STEPS.length - 1) {
                setStep((s) => s + 1);
                return;
              }
              onSubmit();
            }}
          >
            {step === 0 ? (
              <div className="grid gap-4">
                <Field
                  id="sleep-hours"
                  label="Sleep (hours last night)"
                  hint="0–24"
                  value={form.sleepHours}
                  onChange={(v) => update("sleepHours", Math.min(24, Math.max(0, v)))}
                  step={0.5}
                  min={0}
                  max={24}
                />
                <Slider
                  id="appetite"
                  label="Appetite / energy"
                  value={form.appetite}
                  higherIsBetter
                  onChange={(v) => update("appetite", v)}
                />
                <Field
                  id="low-mood-days"
                  label="Low mood days (last 2 weeks)"
                  hint="0–14"
                  value={form.lowMoodDaysLast2Weeks}
                  onChange={(v) =>
                    update("lowMoodDaysLast2Weeks", clampInt(v, 0, 14))
                  }
                  step={1}
                  min={0}
                  max={14}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4">
                <Slider
                  id="workload"
                  label="Workload pressure"
                  value={form.workload}
                  onChange={(v) => update("workload", v)}
                />
                <Slider
                  id="stress"
                  label="Stress level"
                  value={form.stress}
                  onChange={(v) => update("stress", v)}
                />
                <Slider
                  id="anxiety"
                  label="Anxiety / worry"
                  value={form.anxiety}
                  onChange={(v) => update("anxiety", v)}
                />
                <Slider
                  id="focus"
                  label="Focus / clarity"
                  value={form.focus}
                  higherIsBetter
                  onChange={(v) => update("focus", v)}
                />
                <Slider
                  id="social-support"
                  label="Social support"
                  value={form.socialSupport}
                  higherIsBetter
                  onChange={(v) => update("socialSupport", v)}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4">
                <label
                  htmlFor="unsafe-thoughts"
                  className={`flex items-start gap-3 rounded-xl border p-4 ${
                    form.unsafeThoughts
                      ? "border-high bg-high-soft"
                      : "border-line"
                  }`}
                >
                  <input
                    id="unsafe-thoughts"
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={form.unsafeThoughts}
                    onChange={(e) => update("unsafeThoughts", e.target.checked)}
                  />
                  <span className="text-sm">
                    I feel unsafe or I’m worried I might harm myself.
                    <span className="mt-1 block text-xs text-quiet">
                      If this is true, CalmPath skips Gemini and shows a safety plan.
                    </span>
                  </span>
                </label>

                <div>
                  <label htmlFor="notes" className="text-sm font-semibold">
                    Optional notes (what’s causing stress?)
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes ?? ""}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none"
                    placeholder="e.g., exams next week, family pressure, lack of sleep…"
                  />
                  <label
                    htmlFor="include-notes"
                    className="mt-3 flex items-start gap-3 text-sm"
                  >
                    <input
                      id="include-notes"
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={includeNotesInHistory}
                      onChange={(e) => setIncludeNotesInHistory(e.target.checked)}
                    />
                    <span>
                      Include notes in saved history
                      <span className="mt-1 block text-xs text-quiet">
                        Off by default. Notes still inform this session’s plan.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-soft/70 p-4">
              <div>
                <p className="text-xs font-medium text-quiet">Live preview</p>
                <p className="mt-1 flex flex-wrap items-center gap-2" aria-live="polite">
                  <SeverityChip severity={computed.severity} score={computed.score} />
                  {computed.reasons[0] ? (
                    <span className="text-xs text-quiet">{computed.reasons[0]}</span>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Back
                  </Button>
                ) : null}
                <Button type="submit">
                  {step < STEPS.length - 1 ? "Next" : "Generate my plan"}
                </Button>
              </div>
            </div>
            {error ? (
              <p className="mt-2 text-sm text-high" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-2 text-xs text-quiet">
                {form.unsafeThoughts
                  ? "Safety path: Gemini will not be called."
                  : "We’ll suggest concrete next steps. This is not a diagnosis."}
              </p>
            )}
          </form>
        </Card>
      </PageShell>
    </ConsentGate>
  );
}

function Slider({
  id,
  label,
  value,
  onChange,
  higherIsBetter,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  higherIsBetter?: boolean;
}) {
  const caption = higherIsBetter ? "higher is better" : "higher is harder";
  const hintId = `${id}-hint`;
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-sm font-semibold">
            {label}
          </label>
          <p id={hintId} className="text-xs text-quiet">
            {caption}
          </p>
        </div>
        <div className="text-sm font-semibold tabular-nums" aria-hidden>
          {value}/10
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        value={value}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`${value} out of 10, ${caption}`}
        aria-describedby={hintId}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="cp-slider mt-3"
      />
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  step,
  min,
  max,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  const hintId = `${id}-hint`;
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-sm font-semibold">
            {label}
          </label>
          <p id={hintId} className="text-xs text-quiet">
            {hint}
          </p>
        </div>
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-describedby={hintId}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-line bg-background px-2 py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
