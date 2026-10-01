import { notFound } from "next/navigation";
import { requireAdmin, requireJudge } from "@/lib/auth";
import { tabulateResults } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ContestantRecord,
  CriterionRecord,
  CriterionScoreRecord,
  EventJudgeRecord,
  EventRecord,
  JudgeProgress,
  ScoreSheetRecord
} from "@/lib/types";

export async function getAdminEvents() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<EventRecord[]>();

  return data ?? [];
}

export async function getAdminEventBundle(eventId: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const [eventResult, contestantsResult, criteriaResult, judgesResult, sheetsResult, scoresResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single<EventRecord>(),
    supabase.from("contestants").select("*").eq("event_id", eventId).order("display_order").returns<ContestantRecord[]>(),
    supabase.from("criteria").select("*").eq("event_id", eventId).order("display_order").returns<CriterionRecord[]>(),
    supabase.from("event_judges").select("*").eq("event_id", eventId).order("display_name").returns<EventJudgeRecord[]>(),
    supabase.from("score_sheets").select("*").eq("event_id", eventId).returns<ScoreSheetRecord[]>(),
    supabase
      .from("criterion_scores")
      .select("*, score_sheets!inner(event_id)")
      .eq("score_sheets.event_id", eventId)
      .returns<(CriterionScoreRecord & { score_sheets: { event_id: string } })[]>()
  ]);

  if (!eventResult.data) {
    notFound();
  }

  const contestants = contestantsResult.data ?? [];
  const criteria = criteriaResult.data ?? [];
  const judges = judgesResult.data ?? [];
  const scoreSheets = sheetsResult.data ?? [];
  const criterionScores = (scoresResult.data ?? []).map((score) => ({
    id: score.id,
    score_sheet_id: score.score_sheet_id,
    criterion_id: score.criterion_id,
    raw_score: score.raw_score
  }));
  const activeContestants = contestants.filter((contestant) => contestant.status === "active");
  const progress: JudgeProgress[] = judges.map((judge) => {
    const judgeSheets = scoreSheets.filter((sheet) => sheet.judge_id === judge.judge_id);
    const submittedSheets = judgeSheets.filter((sheet) => sheet.status === "submitted");

    return {
      judgeId: judge.judge_id,
      judgeName: judge.display_name,
      completedContestants: submittedSheets.length,
      totalContestants: activeContestants.length,
      submitted: activeContestants.length > 0 && submittedSheets.length === activeContestants.length,
      submittedAt: submittedSheets
        .map((sheet) => sheet.submitted_at)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null
    };
  });

  return {
    event: eventResult.data,
    contestants,
    criteria,
    judges,
    scoreSheets,
    criterionScores,
    progress,
    tabulation: tabulateResults({
      contestants,
      criteria,
      judges,
      scoreSheets,
      criterionScores
    })
  };
}

export async function getJudgeEvents() {
  const judge = await requireJudge();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("event_judges")
    .select("id, event_id, events(*)")
    .eq("judge_id", judge.id)
    .returns<{ id: string; event_id: string; events: EventRecord }[]>();

  return (data ?? []).map((assignment) => assignment.events);
}

export async function getJudgeScoringBundle(eventId: string) {
  const judge = await requireJudge();
  const supabase = createSupabaseAdminClient();
  const { data: assignment } = await supabase
    .from("event_judges")
    .select("id")
    .eq("event_id", eventId)
    .eq("judge_id", judge.id)
    .maybeSingle();

  if (!assignment) {
    notFound();
  }

  const [eventResult, contestantsResult, criteriaResult, sheetsResult, scoresResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single<EventRecord>(),
    supabase
      .from("contestants")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("display_order")
      .returns<ContestantRecord[]>(),
    supabase
      .from("criteria")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("display_order")
      .returns<CriterionRecord[]>(),
    supabase
      .from("score_sheets")
      .select("*")
      .eq("event_id", eventId)
      .eq("judge_id", judge.id)
      .returns<ScoreSheetRecord[]>(),
    supabase
      .from("criterion_scores")
      .select("*, score_sheets!inner(event_id, judge_id)")
      .eq("score_sheets.event_id", eventId)
      .eq("score_sheets.judge_id", judge.id)
      .returns<(CriterionScoreRecord & { score_sheets: { event_id: string; judge_id: string } })[]>()
  ]);

  if (!eventResult.data) {
    notFound();
  }

  return {
    judge,
    event: eventResult.data,
    contestants: contestantsResult.data ?? [],
    criteria: criteriaResult.data ?? [],
    scoreSheets: sheetsResult.data ?? [],
    criterionScores: (scoresResult.data ?? []).map((score) => ({
      id: score.id,
      score_sheet_id: score.score_sheet_id,
      criterion_id: score.criterion_id,
      raw_score: score.raw_score
    }))
  };
}

export async function getPublishedResults(eventId: string) {
  const bundle = await getPublicEventBundle(eventId);
  if (bundle.event.status !== "published") {
    notFound();
  }

  return bundle;
}

async function getPublicEventBundle(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const [eventResult, contestantsResult, criteriaResult, judgesResult, sheetsResult, scoresResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).single<EventRecord>(),
    supabase.from("contestants").select("*").eq("event_id", eventId).order("display_order").returns<ContestantRecord[]>(),
    supabase.from("criteria").select("*").eq("event_id", eventId).order("display_order").returns<CriterionRecord[]>(),
    supabase.from("event_judges").select("*").eq("event_id", eventId).returns<EventJudgeRecord[]>(),
    supabase.from("score_sheets").select("*").eq("event_id", eventId).eq("status", "submitted").returns<ScoreSheetRecord[]>(),
    supabase
      .from("criterion_scores")
      .select("*, score_sheets!inner(event_id, status)")
      .eq("score_sheets.event_id", eventId)
      .eq("score_sheets.status", "submitted")
      .returns<(CriterionScoreRecord & { score_sheets: { event_id: string; status: string } })[]>()
  ]);

  if (!eventResult.data) {
    notFound();
  }

  const contestants = contestantsResult.data ?? [];
  const criteria = criteriaResult.data ?? [];
  const judges = judgesResult.data ?? [];
  const scoreSheets = sheetsResult.data ?? [];
  const criterionScores = (scoresResult.data ?? []).map((score) => ({
    id: score.id,
    score_sheet_id: score.score_sheet_id,
    criterion_id: score.criterion_id,
    raw_score: score.raw_score
  }));

  return {
    event: eventResult.data,
    contestants,
    criteria,
    judges,
    scoreSheets,
    criterionScores,
    tabulation: tabulateResults({
      contestants,
      criteria,
      judges,
      scoreSheets,
      criterionScores
    })
  };
}
