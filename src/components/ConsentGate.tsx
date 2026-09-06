"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { acceptConsent, consentAccepted } from "@/lib/sessionCheckin";
import { Button } from "@/components/ui/Button";

function subscribe() {
  return () => undefined;
}

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, consentAccepted, () => true);
  const [acceptedHere, setAcceptedHere] = useState(false);
  const accepted = stored || acceptedHere;

  if (accepted) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(18_25_22/0.55)] p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="consent-title"
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Consent
        </p>
        <h2 id="consent-title" className="mt-1 text-lg font-semibold tracking-tight">
          Before you check in
        </h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-quiet">
          <li>
            <span className="font-semibold text-foreground">Not a diagnosis.</span>{" "}
            CalmPath is first-aid for student stress. It does not replace counseling
            or emergency care.
          </li>
          <li>
            <span className="font-semibold text-foreground">Gemini sees this session only.</span>{" "}
            Sliders and optional notes go to the model to write a plan. High-risk
            answers skip the model entirely.
          </li>
          <li>
            <span className="font-semibold text-foreground">History is anonymized.</span>{" "}
            We store severity, score, and time. Notes stay off history unless you
            opt in.
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/privacy"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-quiet hover:text-foreground"
          >
            Privacy policy
          </Link>
          <Button
            type="button"
            onClick={() => {
              acceptConsent();
              setAcceptedHere(true);
            }}
          >
            I understand, continue
          </Button>
        </div>
      </div>
    </div>
  );
}
