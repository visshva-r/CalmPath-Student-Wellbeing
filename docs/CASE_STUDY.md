# CalmPath — case study

Student stress first-aid for GDG Solution Challenge 2026 (SDG 3). Live: [calm-path-student-wellbeing.vercel.app](https://calm-path-student-wellbeing.vercel.app/).

## Problem

Students hit exam weeks with no short, private way to triage stress. Chatbots dump advice, campus tools ask for identity, and “wellness apps” often look like diagnosis. CalmPath is a **2–3 minute check-in** that returns a **practical 7-day plan** without pretending to be clinical care.

## Constraints I designed for

- **Not medical advice.** Copy, prompts, and the safety path refuse diagnosis.
- **Privacy by default.** Stored history is severity, score, timestamp, plan source. Notes are opt-in.
- **Model is optional.** High-risk / “I feel unsafe” **never calls Gemini**. A fixed safety plan is returned instead.
- **Demo without cloud.** The product works on `localStorage` if Firebase env vars are missing.
- **Stay on Vercel.** Firebase Auth/Firestore is optional Google Cloud — not a hosting migration.

## What is actually hard (the resume story)

| Decision | Why it matters |
| --- | --- |
| Deterministic `scoreCheckIn` | Explainable band (low &lt; 45, moderate, high ≥ 80) with **reasons**, not a hidden LLM score |
| Safety gate before Gemini | Reduces harm and cost; judges can demo the unsafe checkbox |
| Zod on check-in **and** plan JSON | Model output is normalized (trim/dedupe) or rejected |
| IP rate limit + 24h fingerprint cache | Protects the Gemini key on a public demo |
| Anonymized `publicCheckins` | Campus admin can staff by demand without PII |
| Hybrid persistence | Auth/Firestore when configured; device storage otherwise |

## Architecture (one paragraph)

Next.js App Router UI posts a check-in to `/api/generate-plan`. The route scores locally, short-circuits to a safety template on high risk, else calls Gemini with a **versioned prompt**, validates with Zod, caches identical payloads for 24h, and logs events without notes. The student sees reasons + plan + a 7-day checklist. Campus `/admin` charts anonymized demand (7/30d, peak hours, CSV).

## What I would ship next

- Real campus pilot with counselor hours mapped to peak-load charts
- Prompt eval set (golden check-ins) instead of only schema checks
- Server-side admin auth (PIN in session is a demo gate)

## Resume bullets

- Shipped an end-to-end student wellbeing product (Next.js, Gemini, optional Firebase) with a **safety-gated LLM path**, explainable scoring, and a 7-day follow-up loop.
- Designed a **privacy-first data model**: anonymized aggregates for campus allocation; notes stored only on explicit opt-in; app degrades to local storage without cloud credentials.
- Added production habits: Zod contracts, IP rate limits, 24h plan cache, Vitest + Playwright, GitHub Actions CI.
