import { z } from "zod";
import { calculateJudgeTotal } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CriterionRecord } from "@/lib/types";
import { scoreDraftSchema } from "@/lib/validation";

export async function saveScoresForJudge(judgeId: string, payload: z.infer<typeof scoreDraftSchema>, submit: boolean) {
  const supabase = createSupabaseAdminClient();

  const { data: assignment } = await supabase
    .from("event_judges")
    .select("id")
    .eq("event_id", payload.event_id)
    .eq("judge_id", judgeId)
    .maybeSingle();

  if (!assignment) {
    throw new Error("You are not assigned to this event.");
  }

  const { data: event } = await supabase.from("events").select("status").eq("id", payload.event_id).single();
  if (event?.status !== "open") {
    throw new Error("Judging is not open for this event.");
  }

  const { data: criteria } = await supabase
    .from("criteria")
    .select("*")
    .eq("event_id", payload.event_id)
    .eq("is_active", true)
    .returns<CriterionRecord[]>();

  if (!criteria?.length) {
    throw new Error("This event has no active criteria.");
  }

  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  payload.scores.forEach((score) => {
    if (!criterionIds.has(score.criterion_id)) {
      throw new Error("Invalid criterion submitted.");
    }
  });

  if (submit && payload.scores.length !== criteria.length) {
    throw new Error("Complete every criterion before submitting final scores.");
  }

  calculateJudgeTotal(payload.scores, criteria);

  const { data: existingSheet } = await supabase
    .from("score_sheets")
    .select("id, status")
    .eq("event_id", payload.event_id)
    .eq("judge_id", judgeId)
    .eq("contestant_id", payload.contestant_id)
    .maybeSingle();

  if (existingSheet?.status === "submitted") {
    throw new Error("Submitted score sheets are locked unless reopened by an administrator.");
  }

  const { data: sheet, error: sheetError } = await supabase
    .from("score_sheets")
    .upsert(
      {
        id: existingSheet?.id,
        event_id: payload.event_id,
        judge_id: judgeId,
        contestant_id: payload.contestant_id,
        status: submit ? "submitted" : "draft",
        submitted_at: submit ? new Date().toISOString() : null
      },
      { onConflict: "event_id,judge_id,contestant_id" }
    )
    .select("id")
    .single();

  if (sheetError || !sheet) {
    throw new Error("Scores could not be saved.");
  }

  const { error: scoreError } = await supabase.from("criterion_scores").upsert(
    payload.scores.map((score) => ({
      score_sheet_id: sheet.id,
      criterion_id: score.criterion_id,
      raw_score: score.raw_score
    })),
    { onConflict: "score_sheet_id,criterion_id" }
  );

  if (scoreError) {
    throw new Error("Scores could not be saved.");
  }
}
