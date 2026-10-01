import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().trim().min(2, "Event name is required.").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  venue: z.string().trim().max(200).optional().or(z.literal("")),
  event_date: z.string().trim().optional().or(z.literal("")),
  organizer: z.string().trim().max(160).optional().or(z.literal(""))
});

export const contestantSchema = z.object({
  event_id: z.string().uuid(),
  contestant_number: z.string().trim().min(1).max(20),
  full_name: z.string().trim().min(2).max(160),
  character_name: z.string().trim().min(2).max(160),
  organization: z.string().trim().max(160).optional().or(z.literal("")),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).default(0)
});

export const criterionSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  weight: z.coerce.number().min(0).max(100),
  min_score: z.coerce.number().min(0).default(1),
  max_score: z.coerce.number().min(1).default(100),
  display_order: z.coerce.number().int().min(0).default(0)
}).refine((value) => value.max_score > value.min_score, {
  message: "Maximum score must be greater than minimum score.",
  path: ["max_score"]
});

export const judgeSchema = z.object({
  event_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255)
});

export const eventStatusSchema = z.object({
  event_id: z.string().uuid(),
  status: z.enum(["draft", "open", "closed", "published"])
});

export const scoreDraftSchema = z.object({
  event_id: z.string().uuid(),
  contestant_id: z.string().uuid(),
  scores: z.array(z.object({
    criterion_id: z.string().uuid(),
    raw_score: z.coerce.number()
  })).min(1)
});

export const reopenSchema = z.object({
  score_sheet_id: z.string().uuid(),
  reason: z.string().trim().min(8, "A reopening reason is required.").max(1000)
});

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});
