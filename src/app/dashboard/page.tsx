"use client";

import { useEffect, useMemo, useState } from "react";

const HISTORY_KEY = "calmpath:history";

type HistoryItem = { createdAt: string; severity: string; score: number };

export default function DashboardPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(list)) setItems(list as HistoryItem[]);
    } catch {
      setItems([]);
    }
  }, []);

  const counts = useMemo(() => {
    const c = { low: 0, moderate: 0, high: 0 };
    for (const it of items) {
      if (it.severity === "low") c.low += 1;
      if (it.severity === "moderate") c.moderate += 1;
      if (it.severity === "high") c.high += 1;
    }
    return c;
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 text-zinc-900 dark:text-zinc-50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Impact dashboard (prototype)
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Anonymized aggregate counts from check-ins on this device (demo-ready).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
          >
            Home
          </a>
          <a
            href="/checkin"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            New check‑in
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Low" value={counts.low} />
        <Stat label="Moderate" value={counts.moderate} />
        <Stat label="High" value={counts.high} />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recent check-ins
        </h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            No check-ins yet. Complete a check‑in to populate the dashboard.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {items
              .slice()
              .reverse()
              .slice(0, 12)
              .map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {it.severity} • score {it.score}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(it.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                    anonymized
                  </span>
                </div>
              ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(HISTORY_KEY);
            setItems([]);
          }}
          className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
        >
          Reset demo data
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

