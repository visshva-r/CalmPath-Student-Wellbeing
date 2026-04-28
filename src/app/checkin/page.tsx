"use client";

import { useMemo, useState } from "react";
import { CheckInSchema, scoreCheckIn, type CheckIn } from "@/lib/checkin";

const STORAGE_KEY = "calmpath:lastCheckin";

function clampInt(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function CheckInPage() {
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
    window.location.href = "/results";
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Student check‑in (2–3 minutes)
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Answer honestly. This does not diagnose — it helps generate a practical
            plan.
          </p>
        </div>
        <a
          href="/"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
        >
          Back
        </a>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Sleep (hours last night)"
            hint="0–24"
            value={form.sleepHours}
            onChange={(v) => update("sleepHours", Math.min(24, Math.max(0, v)))}
            step={0.5}
            min={0}
            max={24}
          />
          <Slider
            label="Workload pressure"
            value={form.workload}
            onChange={(v) => update("workload", v)}
          />
          <Slider
            label="Stress level"
            value={form.stress}
            onChange={(v) => update("stress", v)}
          />
          <Slider
            label="Anxiety / worry"
            value={form.anxiety}
            onChange={(v) => update("anxiety", v)}
          />
          <Slider
            label="Focus / clarity"
            value={form.focus}
            higherIsBetter
            onChange={(v) => update("focus", v)}
          />
          <Slider
            label="Social support"
            value={form.socialSupport}
            higherIsBetter
            onChange={(v) => update("socialSupport", v)}
          />
          <Slider
            label="Appetite / energy"
            value={form.appetite}
            higherIsBetter
            onChange={(v) => update("appetite", v)}
          />
          <Field
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

        <div className="mt-6 grid gap-3">
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.unsafeThoughts}
              onChange={(e) => update("unsafeThoughts", e.target.checked)}
            />
            <span className="text-sm text-zinc-800 dark:text-zinc-100">
              I feel unsafe or I’m worried I might harm myself.
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                If this is true, CalmPath will prioritize safety resources.
              </span>
            </span>
          </label>

          <div>
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Optional notes (what’s causing stress?)
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:ring-zinc-700"
              placeholder="e.g., exams next week, family pressure, lack of sleep…"
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Preview
              </p>
              <p className="text-sm text-zinc-900 dark:text-zinc-50">
                Severity:{" "}
                <span className="font-semibold">{computed.severity}</span> •
                Score: <span className="font-semibold">{computed.score}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Generate my plan
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              We’ll use Gemini to generate actionable steps (not diagnosis).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  higherIsBetter,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  higherIsBetter?: boolean;
}) {
  const display = value;
  const caption = higherIsBetter ? "higher is better" : "higher is harder";
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {label}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{caption}</p>
        </div>
        <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {display}/10
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-3 w-full"
      />
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {label}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        </div>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:ring-zinc-700"
        />
      </div>
    </div>
  );
}

