import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCheckIn, samplePlan } from "@/test/fixtures";
import { resetRateLimit } from "@/lib/rateLimit";
import { clearPlanCache } from "@/lib/planCache";

const generateContent = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent };
    }
  },
}));

function request(body: unknown, ip = "203.0.113.10") {
  return new Request("http://localhost/api/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate-plan", () => {
  beforeEach(() => {
    resetRateLimit();
    clearPlanCache();
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("skips Gemini on the high-risk safety path", async () => {
    const { POST } = await import("@/app/api/generate-plan/route");
    const res = await POST(request(sampleCheckIn({ unsafeThoughts: true }), "198.51.100.1"));
    const json = (await res.json()) as { source?: string; plan?: { immediateActions?: string[] } };

    expect(res.status).toBe(200);
    expect(json.source).toBe("safety");
    expect(json.plan?.immediateActions?.length).toBeGreaterThanOrEqual(3);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("validates Gemini JSON on the normal path", async () => {
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(samplePlan) },
    });
    const { POST } = await import("@/app/api/generate-plan/route");
    const res = await POST(request(sampleCheckIn(), "198.51.100.2"));
    const json = (await res.json()) as { source?: string; cached?: boolean };

    expect(res.status).toBe(200);
    expect(json.source).toBe("gemini");
    expect(json.cached).toBe(false);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("returns a cached plan on a repeated identical check-in", async () => {
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(samplePlan) },
    });
    const { POST } = await import("@/app/api/generate-plan/route");
    const payload = sampleCheckIn({ notes: "exams" });
    await POST(request(payload, "198.51.100.3"));
    const res = await POST(request(payload, "198.51.100.3"));
    const json = (await res.json()) as { cached?: boolean; source?: string };

    expect(res.status).toBe(200);
    expect(json.cached).toBe(true);
    expect(json.source).toBe("gemini");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
