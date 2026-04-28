import { z } from "zod";

export const PlanSchema = z.object({
  severityReasoning: z.string().min(1).max(600),
  immediateActions: z.array(z.string().min(1).max(140)).min(3).max(5),
  dailyHabits: z.array(z.string().min(1).max(140)).min(3).max(5),
  weeklyGoal: z.string().min(1).max(200),
  followUpChecklist: z.array(z.string().min(1).max(140)).min(5).max(10),
  messageScripts: z.object({
    friend: z.string().min(1).max(400),
    mentor: z.string().min(1).max(400),
  }),
  resources: z.array(
    z.object({
      title: z.string().min(1).max(80),
      description: z.string().min(1).max(200),
    }),
  ),
});

export type Plan = z.infer<typeof PlanSchema>;

