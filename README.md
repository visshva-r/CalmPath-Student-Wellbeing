## CalmPath — Student Stress & Burnout First‑Aid (Solution Challenge 2026)

**CalmPath** is a prototype that helps students do a 2–3 minute wellbeing check‑in and generates a **personalized next‑7‑days plan** using **Google Gemini**. It focuses on **actionable steps**, with **safety guardrails** (no diagnosis, no medical advice).

### Why it matters (SDG 3)
Students often face high stress around exams, workload, and lack of sleep. CalmPath provides a quick triage + an immediate plan and follow‑up checklist to reduce overwhelm and encourage reaching out for support.

### Demo flow
- Landing → Check‑in → Results (Gemini plan)
- Impact dashboard (anonymized aggregate counts — demo-ready)

### Google AI usage (mandatory)
- **Gemini API** via `@google/generative-ai` in `src/app/api/generate-plan/route.ts`

## Run locally
1) Install deps

```bash
npm install
```

2) Add env var

Copy `.env.local.example` → `.env.local` and set:
- `GEMINI_API_KEY=...` (from Google AI Studio)

3) Start

```bash
npm run dev
```

Open `http://localhost:3000`

## Deploy (Vercel)
1) Push this repo to GitHub (public)  
2) Import to Vercel  
3) Add `GEMINI_API_KEY` in Vercel Environment Variables  
4) Deploy

## Safety note
CalmPath is **not medical advice** and does **not** diagnose. If a user indicates they feel unsafe, the system prioritizes safety guidance and encourages contacting trusted help/emergency services.
