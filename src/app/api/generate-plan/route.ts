import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CheckInSchema, defaultResources, scoreCheckIn } from "@/lib/checkin";
import { PlanSchema, type Plan } from "@/lib/planSchema";

export const runtime = "nodejs";

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function safeJsonParse(text: string): unknown {
  // Try to extract first JSON object from model output.
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

function highRiskPlan(reason: string): Plan {
  return {
    severityReasoning:
      reason +
      " If you feel unsafe or might harm yourself, seek immediate help from local emergency services or a trusted person right now.",
    immediateActions: [
      "Stop what you’re doing and take 10 slow breaths (count 4 in, 6 out).",
      "Reach out to a trusted person now (friend/roommate/family/mentor).",
      "Move to a safer, more public place if you’re alone and feeling unsafe.",
    ],
    dailyHabits: [
      "Eat something small and drink water (even a snack counts).",
      "Take a 10-minute walk or stretch to reset your body.",
      "Do one “minimum viable task” (2 minutes) to reduce overwhelm.",
    ],
    weeklyGoal: "Book one real support touchpoint (counselor/mentor/doctor).",
    followUpChecklist: [
      "Day 1: Tell one person what you’re going through (copy a script).",
      "Day 2: Reduce one commitment for this week (say no to 1 thing).",
      "Day 3: Sleep plan: pick a fixed wake time; keep it 3 days.",
      "Day 4: Do one short study block (20 minutes) + break.",
      "Day 5: Ask for help on one specific academic task.",
      "Day 6: Do something restorative (music, sport, prayer, nature).",
      "Day 7: Re-check-in and compare how you feel vs Day 1.",
    ],
    messageScripts: {
      friend:
        "Hey — I’m not doing great today and could really use 10 minutes to talk. Are you free right now? If not, when can we talk soon?",
      mentor:
        "Hi, I’m having a rough week and I think I need some support. Could we meet for 10–15 minutes (or can you point me to the right resource)?",
    },
    resources: defaultResources(),
  };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "Missing GEMINI_API_KEY. Add it to .env.local and your Vercel project env vars.",
      },
      500,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = CheckInSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Invalid check-in payload", issues: parsed.error.issues },
      400,
    );
  }

  const checkin = parsed.data;
  const { severity, score, reasons } = scoreCheckIn(checkin);
  if (severity === "high" || checkin.unsafeThoughts) {
    return jsonResponse({
      plan: highRiskPlan(reasons[0] ?? "High-risk indicators detected."),
      severity,
      score,
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    // Use a current model ID for Google AI Studio keys.
    // (Model availability can vary by key; adjust via GEMINI_MODEL if needed.)
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction:
      "You are CalmPath, a wellbeing assistant for students. You do NOT provide medical advice or diagnosis. " +
      "Your job is to generate a practical, empathetic, culturally-neutral plan for stress management. " +
      "Do not mention policy or refusal text. If any self-harm intent is present, instruct immediate help and keep advice minimal (but in this request, unsafeThoughts is false). " +
      "Return ONLY valid JSON that matches the given schema—no markdown, no extra keys.",
  });

  const prompt = {
    checkin: {
      sleepHours: checkin.sleepHours,
      stress: checkin.stress,
      anxiety: checkin.anxiety,
      focus: checkin.focus,
      socialSupport: checkin.socialSupport,
      appetite: checkin.appetite,
      workload: checkin.workload,
      lowMoodDaysLast2Weeks: checkin.lowMoodDaysLast2Weeks,
      notes: checkin.notes ?? "",
    },
    computed: { severity, score, reasons },
    outputSchema: {
      severityReasoning: "string (<=600 chars, 2–4 sentences)",
      immediateActions: "array of 3-5 short strings (<=140 chars each)",
      dailyHabits: "array of 3-5 short strings (<=140 chars each)",
      weeklyGoal: "string (<=200 chars)",
      followUpChecklist: "array of 5-10 short strings (<=140 chars each)",
      messageScripts: { friend: "string", mentor: "string" },
      resources:
        "array of objects {title:string<=80, description:string<=200} (include 3-5 items, generic resources ok)",
    },
  };

  let text = "";
  try {
    const result = await model.generateContent(
      "Generate a personalized stress first-aid plan.\n" +
        "Return only JSON.\n\n" +
        JSON.stringify(prompt),
    );
    text = result.response.text();
  } catch (e) {
    return jsonResponse(
      {
        error:
          e instanceof Error
            ? e.message
            : "Gemini request failed. Check model name and API key permissions.",
      },
      502,
    );
  }

  const maybeJson = safeJsonParse(text);
  const validated = PlanSchema.safeParse(maybeJson);
  if (!validated.success) {
    return jsonResponse(
      {
        error: "Gemini returned non-conforming JSON.",
        raw: text.slice(0, 2000),
        issues: validated.error.issues,
      },
      502,
    );
  }

  return jsonResponse({
    plan: validated.data,
    severity,
    score,
  });
}

