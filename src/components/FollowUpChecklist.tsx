"use client";

import { useEffect, useState } from "react";
import {
  followUpPercent,
  loadCloudFollowUp,
  loadLocalFollowUp,
  saveCloudFollowUp,
  saveLocalFollowUp,
  type FollowUpState,
} from "@/lib/followUp";

export function FollowUpChecklist({
  checkinId,
  items,
}: {
  checkinId: string;
  items: string[];
}) {
  const [state, setState] = useState<FollowUpState>(() =>
    loadLocalFollowUp(checkinId, items),
  );

  useEffect(() => {
    let cancelled = false;
    void loadCloudFollowUp(checkinId, items).then((cloud) => {
      if (!cancelled && cloud) setState(cloud);
    });
    return () => {
      cancelled = true;
    };
  }, [checkinId, items]);

  function toggle(index: number) {
    setState((prev) => {
      const completed = prev.completed.map((v, i) => (i === index ? !v : v));
      const next = { ...prev, completed, updatedAt: new Date().toISOString() };
      saveLocalFollowUp(next);
      void saveCloudFollowUp(next);
      return next;
    });
  }

  const percent = followUpPercent(state);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">7-day follow-up checklist</h2>
        <span className="text-xs font-semibold text-quiet">{percent}% complete</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-3 grid gap-2 text-base">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex items-start gap-3 rounded-lg border border-line px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={Boolean(state.completed[i])}
                onChange={() => toggle(i)}
              />
              <span className={state.completed[i] ? "text-quiet line-through" : ""}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
