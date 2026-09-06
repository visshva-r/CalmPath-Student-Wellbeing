"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, Skeleton } from "@/components/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, PageShell } from "@/components/ui/Card";
import { SeverityChip } from "@/components/ui/SeverityChip";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  filterByDays,
  peakHours,
  peakWeekdays,
  sampleCampusData,
  severityCounts,
  toCsv,
  trendByDay,
} from "@/lib/analytics";
import { firebaseEnabled } from "@/lib/firebase/auth";
import { listPublicCheckIns, readLocalHistory, type HistoryItem } from "@/lib/history";

const GRID = "#d5ccbb";
const BRAND = "#2a6b5a";
const HIGH = "#b54a32";

function adminUnlocked() {
  const pin = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "";
  if (!pin) return true;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.admin) === "ok";
  } catch {
    return false;
  }
}

export default function AdminPage() {
  const pinRequired = Boolean(process.env.NEXT_PUBLIC_ADMIN_PIN);
  const sessionUnlocked = useSyncExternalStore(
    () => () => undefined,
    adminUnlocked,
    () => !pinRequired,
  );
  const [unlockedHere, setUnlockedHere] = useState(false);
  const unlocked = sessionUnlocked || unlockedHere;
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [range, setRange] = useState<7 | 30>(7);
  const [usingSample, setUsingSample] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const local = readLocalHistory();
      if (firebaseEnabled()) {
        try {
          const cloud = await listPublicCheckIns();
          if (!cancelled && cloud.length > 0) {
            setItems(cloud);
            setUsingSample(false);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      if (!cancelled) {
        setItems(local.length > 0 ? local : sampleCampusData());
        setUsingSample(local.length === 0);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  const scoped = useMemo(() => filterByDays(items, range), [items, range]);
  const counts = useMemo(() => severityCounts(scoped), [scoped]);
  const trend = useMemo(() => trendByDay(scoped, range), [scoped, range]);
  const hours = useMemo(() => peakHours(scoped), [scoped]);
  const weekdays = useMemo(() => peakWeekdays(scoped), [scoped]);

  function exportCsv() {
    const blob = new Blob([toCsv(scoped)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calmpath-admin-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <PageShell>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Campus ops
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Campus admin</h1>
        <p className="mt-2 text-sm text-quiet">
          Enter the admin PIN to view anonymized allocation insights.
        </p>
        <form
          className="mt-6 grid max-w-sm gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
              sessionStorage.setItem(STORAGE_KEYS.admin, "ok");
              setUnlockedHere(true);
              setPinError(null);
            } else {
              setPinError("Incorrect PIN.");
            }
          }}
        >
          <label htmlFor="admin-pin" className="text-sm font-semibold">
            Admin PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            aria-invalid={pinError ? true : undefined}
            aria-describedby={pinError ? "admin-pin-error" : undefined}
            autoComplete="current-password"
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
            placeholder="Enter PIN"
          />
          {pinError ? (
            <p id="admin-pin-error" className="text-sm text-high" role="alert">
              {pinError}
            </p>
          ) : null}
          <Button type="submit">Unlock</Button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Campus ops
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Resource allocation
          </h1>
          <p className="mt-1 max-w-xl text-sm text-quiet">
            Anonymized severity demand so campuses can staff counselors where load
            is highest.
            {usingSample ? " Showing sample campus data for demo." : ""}
            {!pinRequired
              ? " Ungated demo. Set NEXT_PUBLIC_ADMIN_PIN to lock this page."
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={range === 7 ? "primary" : "secondary"}
            size="sm"
            aria-pressed={range === 7}
            onClick={() => setRange(7)}
          >
            7 days
          </Button>
          <Button
            type="button"
            variant={range === 30 ? "primary" : "secondary"}
            size="sm"
            aria-pressed={range === 30}
            onClick={() => setRange(30)}
          >
            30 days
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setItems(sampleCampusData());
              setUsingSample(true);
            }}
          >
            Load sample
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Stat label="Low" value={counts.low} tone="low" />
            <Stat label="Moderate" value={counts.moderate} tone="moderate" />
            <Stat label="High" value={counts.high} tone="high" />
          </>
        )}
      </div>

      {loading ? (
        <div
          className="mt-6 grid gap-4 lg:grid-cols-2"
          aria-busy="true"
          aria-label="Loading charts"
        >
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card title={`Check-in trend (${range}d)`}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={BRAND}
                  strokeWidth={2}
                  name="Check-ins"
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke={HIGH}
                  strokeWidth={2}
                  name="High"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Severity mix">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { label: "Low", count: counts.low },
                  { label: "Moderate", count: counts.moderate },
                  { label: "High", count: counts.high },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BRAND} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Peak hours">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Peak weekdays">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdays}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="mt-6" title="Recent anonymized check-ins">
        {loading ? (
          <div className="grid gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : scoped.length === 0 ? (
          <EmptyState
            title="No campus check-ins in this range"
            body="Load sample data to preview allocation charts, or complete student check-ins on this device."
          />
        ) : (
          <div className="grid gap-2">
            {scoped.slice(0, 16).map((it) => (
              <div
                key={it.id ?? it.createdAt}
                className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm"
              >
                <div>
                  <SeverityChip severity={it.severity} score={it.score} />
                  <p className="mt-1 text-xs text-quiet">
                    {new Date(it.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-quiet">no PII</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "low" | "moderate" | "high";
}) {
  const bar =
    tone === "high" ? "bg-high" : tone === "moderate" ? "bg-moderate" : "bg-low";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-medium text-quiet">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <div className={`mt-3 h-1 rounded-full ${bar}`} />
    </div>
  );
}
