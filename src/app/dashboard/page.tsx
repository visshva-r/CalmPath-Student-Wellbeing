"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, Skeleton } from "@/components/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, PageShell } from "@/components/ui/Card";
import { SeverityChip } from "@/components/ui/SeverityChip";
import { checkInStreak } from "@/lib/analytics";
import { useAuth } from "@/components/AuthProvider";
import { firebaseEnabled } from "@/lib/firebase/auth";
import {
  clearCloudCheckIns,
  listCloudCheckIns,
  readLocalHistory,
  writeLocalHistory,
  type HistoryItem,
} from "@/lib/history";

export default function DashboardPage() {
  const { enabled, ready, user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [source, setSource] = useState<"cloud" | "device">("device");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const local = readLocalHistory().slice().reverse();
      if (!firebaseEnabled() || !ready) {
        if (!cancelled) {
          setItems(local);
          setSource("device");
          setLoading(false);
        }
        return;
      }
      try {
        const cloud = await listCloudCheckIns();
        if (cancelled) return;
        if (cloud.length > 0) {
          setItems(cloud);
          setSource("cloud");
        } else {
          setItems(local);
          setSource("device");
        }
      } catch {
        if (!cancelled) {
          setItems(local);
          setSource("device");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, ready, user?.uid]);

  const streak = useMemo(() => checkInStreak(items), [items]);
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
    <PageShell>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            History
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Your check-ins
          </h1>
          <p className="mt-1 text-sm text-quiet">
            Anonymized counts
            {source === "cloud" ? " from your account." : " on this device."}
            {streak > 0
              ? ` Streak: ${streak} day${streak === 1 ? "" : "s"}.`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/" variant="secondary" size="sm">
            Home
          </ButtonLink>
          <ButtonLink href="/checkin" size="sm">
            New check-in
          </ButtonLink>
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

      <Card className="mt-6" title="Recent check-ins">
        {loading ? (
          <div className="grid gap-2" aria-busy="true" aria-label="Loading check-ins">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No check-ins yet"
            body="Complete a 2–3 minute check-in to populate this dashboard with anonymized severity counts."
            action={
              <ButtonLink href="/checkin" size="sm">
                Start check-in
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-2">
            {items.slice(0, 12).map((it, idx) => (
              <div
                key={it.id ?? `${it.createdAt}-${idx}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
              >
                <div>
                  <SeverityChip severity={it.severity} score={it.score} />
                  <p className="mt-1 text-xs text-quiet">
                    {new Date(it.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-quiet">anonymized</span>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              writeLocalHistory([]);
              setItems([]);
              if (firebaseEnabled()) {
                void clearCloudCheckIns();
              }
            }}
          >
            Clear local history
          </Button>
        ) : null}
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
