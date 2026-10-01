import type { ContestantResult, CriterionRecord, CriterionScoreRecord, EventJudgeRecord, ScoreSheetRecord } from "@/lib/types";

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function buildRankingsCsv(results: ContestantResult[]) {
  const rows = [["Rank", "Contestant Number", "Contestant Name", "Character", "Average Score", "Status"]];
  for (const result of results) {
    rows.push([
      result.rank ? String(result.rank) : "",
      result.contestantNumber,
      result.contestantName,
      result.characterName,
      result.finalScore === null ? "Incomplete" : result.finalScore.toFixed(2),
      result.status
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function buildDetailedScoresCsv(input: {
  judges: EventJudgeRecord[];
  criteria: CriterionRecord[];
  scoreSheets: ScoreSheetRecord[];
  criterionScores: CriterionScoreRecord[];
}) {
  const rows = [["Judge", "Contestant ID", "Criterion", "Raw Score", "Submitted At"]];
  const judgesById = new Map(input.judges.map((judge) => [judge.judge_id, judge.display_name]));
  const criteriaById = new Map(input.criteria.map((criterion) => [criterion.id, criterion.name]));
  const sheetsById = new Map(input.scoreSheets.map((sheet) => [sheet.id, sheet]));

  for (const score of input.criterionScores) {
    const sheet = sheetsById.get(score.score_sheet_id);
    if (!sheet) {
      continue;
    }

    rows.push([
      judgesById.get(sheet.judge_id) ?? "Unknown judge",
      sheet.contestant_id,
      criteriaById.get(score.criterion_id) ?? "Unknown criterion",
      String(score.raw_score),
      sheet.submitted_at ?? ""
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}
