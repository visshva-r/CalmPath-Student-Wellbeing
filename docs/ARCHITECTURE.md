# CalmPath architecture

CalmPath is a Next.js App Router app. Students complete a short check-in; a **deterministic scorer** assigns low/moderate/high; **Gemini** (or a safety template) returns a structured 7-day plan. Anonymized summaries can persist in **Firestore** for student history and campus allocation views.

```mermaid
flowchart TD
  Student[Student browser] --> UI[Next.js pages]
  UI --> Consent[Consent + optional notes]
  Consent --> Score[scoreCheckIn]
  Score -->|high or unsafe| Safety[Safety plan template]
  Score -->|low or moderate| API["POST /api/generate-plan"]
  API --> Limit[IP rate limit]
  Limit --> Cache[24h fingerprint cache]
  Cache -->|miss| Gemini[Google Gemini API]
  Gemini --> Normalize[Zod + normalizePlan]
  Safety --> Results[Results + follow-up checklist]
  Normalize --> Results
  Results --> Local[localStorage fallback]
  Results --> Auth[Firebase Auth anonymous or Google]
  Auth --> FS[(Firestore)]
  FS --> Dash[Student dashboard]
  FS --> Public[publicCheckins anonymized]
  Public --> Admin[Campus admin charts]
```

## Layers

| Layer | Responsibility |
| --- | --- |
| UI (`src/app/*`) | Check-in wizard, explainable results, dashboards, privacy, admin PIN gate |
| Domain (`src/lib/checkin.ts`) | Zod payload + explainable score |
| AI (`src/lib/prompts`, `src/app/api/generate-plan`) | Versioned prompt, retries, timeout, cache |
| Persistence (`src/lib/history.ts`, `src/lib/followUp.ts`) | Device storage and optional Firestore |
| Analytics (`src/lib/analytics.ts`) | Aggregates for allocation (severity, hours, weekdays) |

## Data (privacy)

- **Sent to Gemini:** current check-in sliders + optional notes. High-risk sessions skip the model.
- **Stored by default:** severity, score, timestamp, plan source. Notes only if the student opts in.
- **Never stored in `publicCheckins`:** uid, notes, or raw answers.
- **Server logs:** event, severity, score, prompt version — not notes.

## Hosting (hybrid — stay on Vercel)

CalmPath is **not** hosted on Firebase Hosting. Production is:

| Piece | Host |
| --- | --- |
| Next.js UI + Route Handlers | **Vercel** |
| Gemini | Google AI Studio (`GEMINI_API_KEY` as a Vercel secret) |
| Optional Auth | Firebase Auth (anonymous + Google) |
| Optional persistence | Firestore (`users/{uid}/…` and `publicCheckins`) |

Firebase env vars are optional. Without them, history and follow-ups stay on the device. Enabling Firebase does not require moving the app off Vercel.
