import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CheckInSchema, scoreCheckIn } from "@/lib/checkin";
import { PlanSchema } from "@/lib/planSchema";
import { PROMPT_VERSION } from "@/lib/constants";
import {
  CALMPATH_SYSTEM_INSTRUCTION,
  buildPlanPrompt,
  planUserMessage,
} from "@/lib/prompts/calmPathPlan";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { checkInFingerprint, getCachedPlan, setCachedPlan } from "@/lib/planCache";
import { normalizePlan } from "@/lib/planNormalize";
import { highRiskPlan } from "@/lib/safetyPlan";

export const runtime = "nodejs";

type PlanSource = "gemini" | "safety";

function jsonResponse(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

function safeJsonParse(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Gemini request timed out.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function userFacingGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.toLowerCase().includes("timeout")) {
    return "The AI service took too long. Please try again in a moment.";
  }
  if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("permission")) {
    return "The AI service is not configured correctly. Please try again later.";
  }
  return "We couldn’t generate a plan right now. Please try again.";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  const limitHeaders = {
    "X-RateLimit-Remaining": String(limit.remaining),
  };

  if (!limit.ok) {
    console.info("[generate-plan]", {
      event: "rate_limited",
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse(
      {
        error: `Too many plan requests. Please wait ${limit.retryAfterSec} seconds and try again.`,
      },
      429,
      { ...limitHeaders, "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.info("[generate-plan]", { event: "missing_api_key", promptVersion: PROMPT_VERSION });
    return jsonResponse(
      {
        error:
          "Missing GEMINI_API_KEY. Add it to .env.local and your Vercel project env vars.",
      },
      500,
      limitHeaders,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.info("[generate-plan]", { event: "invalid_json", promptVersion: PROMPT_VERSION });
    return jsonResponse({ error: "Invalid JSON body" }, 400, limitHeaders);
  }

  const parsed = CheckInSchema.safeParse(body);
  if (!parsed.success) {
    console.info("[generate-plan]", {
      event: "invalid_payload",
      issueCount: parsed.error.issues.length,
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse(
      { error: "Invalid check-in payload", issues: parsed.error.issues },
      400,
      limitHeaders,
    );
  }

  const checkin = parsed.data;
  const { severity, score, reasons } = scoreCheckIn(checkin);
  const highRisk = severity === "high" || checkin.unsafeThoughts;

  console.info("[generate-plan]", {
    event: "request",
    severity,
    score,
    highRisk,
    hasNotes: Boolean(checkin.notes && checkin.notes.length > 0),
    promptVersion: PROMPT_VERSION,
  });

  if (highRisk) {
    const source: PlanSource = "safety";
    const plan =
      normalizePlan(highRiskPlan(reasons[0] ?? "High-risk indicators detected.")) ??
      highRiskPlan(reasons[0] ?? "High-risk indicators detected.");
    console.info("[generate-plan]", {
      event: "safety_path",
      severity,
      score,
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse(
      {
        plan,
        severity,
        score,
        source,
        promptVersion: PROMPT_VERSION,
        cached: false,
      },
      200,
      limitHeaders,
    );
  }

  const fingerprint = checkInFingerprint(checkin);
  const cached = getCachedPlan(fingerprint);
  if (cached) {
    console.info("[generate-plan]", {
      event: "cache_hit",
      severity,
      score,
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse(
      {
        plan: cached.plan,
        severity: cached.severity,
        score: cached.score,
        source: cached.source,
        promptVersion: PROMPT_VERSION,
        cached: true,
      },
      200,
      limitHeaders,
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: CALMPATH_SYSTEM_INSTRUCTION,
  });

  const prompt = buildPlanPrompt({ checkin, severity, score, reasons });
  const userMessage = planUserMessage(prompt);

  let text = "";
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await withTimeout(model.generateContent(userMessage), 20_000);
        text = result.response.text();
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        if (attempt < 2) await sleep(400 * (attempt + 1));
      }
    }
    if (!text) throw lastError ?? new Error("Gemini request failed.");
  } catch (e) {
    console.info("[generate-plan]", {
      event: "gemini_failed",
      severity,
      score,
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse({ error: userFacingGeminiError(e) }, 502, limitHeaders);
  }

  const maybeJson = safeJsonParse(text);
  const validated = normalizePlan(maybeJson) ?? PlanSchema.safeParse(maybeJson).data ?? null;
  if (!validated) {
    console.info("[generate-plan]", {
      event: "invalid_model_json",
      promptVersion: PROMPT_VERSION,
    });
    return jsonResponse(
      { error: "The AI response was not usable. Please try again." },
      502,
      limitHeaders,
    );
  }

  setCachedPlan(fingerprint, {
    plan: validated,
    severity,
    score,
    source: "gemini",
  });

  console.info("[generate-plan]", {
    event: "ok",
    severity,
    score,
    source: "gemini",
    promptVersion: PROMPT_VERSION,
  });

  return jsonResponse(
    {
      plan: validated,
      severity,
      score,
      source: "gemini" satisfies PlanSource,
      promptVersion: PROMPT_VERSION,
      cached: false,
    },
    200,
    limitHeaders,
  );
}
