import type {
  ContestantRecord,
  ContestantResult,
  CriterionRecord,
  CriterionScoreRecord,
  EventJudgeRecord,
  ScoreSheetRecord
} from "@/lib/types";

export type ScoreInput = Pick<CriterionScoreRecord, "criterion_id" | "raw_score">;

export function validateCriteriaWeights(criteria: Pick<CriterionRecord, "weight" | "is_active">[]) {
  const total = criteria
    .filter((criterion) => criterion.is_active)
    .reduce((sum, criterion) => sum + Number(criterion.weight), 0);

  return {
    total,
    valid: Number(total.toFixed(6)) === 100
  };
}

export function calculateWeightedScore(rawScore: number, maxScore: number, weight: number) {
  if (maxScore <= 0) {
    throw new Error("Maximum score must be greater than zero.");
  }

  return (rawScore / maxScore) * weight;
}

export function assertScoreWithinRange(rawScore: number, criterion: Pick<CriterionRecord, "min_score" | "max_score" | "name">) {
  if (rawScore < criterion.min_score || rawScore > criterion.max_score) {
    throw new Error(`${criterion.name} must be between ${criterion.min_score} and ${criterion.max_score}.`);
  }
}

export function calculateJudgeTotal(scores: ScoreInput[], criteria: CriterionRecord[]) {
  const criteriaById = new Map(criteria.filter((criterion) => criterion.is_active).map((criterion) => [criterion.id, criterion]));

  return scores.reduce((total, score) => {
    const criterion = criteriaById.get(score.criterion_id);
    if (!criterion) {
      return total;
    }

    assertScoreWithinRange(score.raw_score, criterion);
    return total + calculateWeightedScore(score.raw_score, criterion.max_score, criterion.weight);
  }, 0);
}

function compareTieBreakers(
  left: ContestantResult,
  right: ContestantResult,
  tieBreakCriteria: string[]
) {
  for (const criterionName of tieBreakCriteria) {
    const leftScore = left.criterionAverages[criterionName] ?? 0;
    const rightScore = right.criterionAverages[criterionName] ?? 0;
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
  }

  return 0;
}

export function tabulateResults(input: {
  contestants: ContestantRecord[];
  criteria: CriterionRecord[];
  judges: EventJudgeRecord[];
  scoreSheets: ScoreSheetRecord[];
  criterionScores: CriterionScoreRecord[];
}) {
  const activeCriteria = input.criteria
    .filter((criterion) => criterion.is_active)
    .sort((left, right) => left.display_order - right.display_order);
  const scoresBySheet = new Map<string, CriterionScoreRecord[]>();

  for (const score of input.criterionScores) {
    const scores = scoresBySheet.get(score.score_sheet_id) ?? [];
    scores.push(score);
    scoresBySheet.set(score.score_sheet_id, scores);
  }

  const submittedSheets = input.scoreSheets.filter((sheet) => sheet.status === "submitted");
  const sheetsByContestant = new Map<string, ScoreSheetRecord[]>();

  for (const sheet of submittedSheets) {
    const sheets = sheetsByContestant.get(sheet.contestant_id) ?? [];
    sheets.push(sheet);
    sheetsByContestant.set(sheet.contestant_id, sheets);
  }

  const requiredJudgeCount = input.judges.length;
  const results: ContestantResult[] = input.contestants.map((contestant) => {
    const sheets = sheetsByContestant.get(contestant.id) ?? [];
    const judgeTotals = sheets.map((sheet) => calculateJudgeTotal(scoresBySheet.get(sheet.id) ?? [], activeCriteria));
    const criterionAverages: Record<string, number> = {};

    for (const criterion of activeCriteria) {
      const weightedScores = sheets
        .map((sheet) => {
          const score = (scoresBySheet.get(sheet.id) ?? []).find((candidate) => candidate.criterion_id === criterion.id);
          return score ? calculateWeightedScore(score.raw_score, criterion.max_score, criterion.weight) : null;
        })
        .filter((score): score is number => score !== null);

      criterionAverages[criterion.name] = weightedScores.length
        ? weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length
        : 0;
    }

    return {
      contestantId: contestant.id,
      contestantNumber: contestant.contestant_number,
      contestantName: contestant.full_name,
      characterName: contestant.character_name,
      status: contestant.status,
      rank: null,
      isTied: false,
      submittedJudgeCount: sheets.length,
      requiredJudgeCount,
      finalScore: judgeTotals.length
        ? judgeTotals.reduce((sum, score) => sum + score, 0) / judgeTotals.length
        : null,
      criterionAverages
    };
  });

  const ranked = results
    .filter((result) => result.status === "active" && result.finalScore !== null)
    .sort((left, right) => {
      const scoreDifference = (right.finalScore ?? 0) - (left.finalScore ?? 0);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return compareTieBreakers(left, right, [
        "Physical Resemblance",
        "Mannerisms and Characterization",
        "Stage Presence"
      ]);
    });

  let currentRank = 0;
  let previous: ContestantResult | null = null;

  ranked.forEach((result, index) => {
    const unresolvedTie =
      previous &&
      previous.finalScore === result.finalScore &&
      compareTieBreakers(previous, result, [
        "Physical Resemblance",
        "Mannerisms and Characterization",
        "Stage Presence"
      ]) === 0;

    if (!unresolvedTie) {
      currentRank = index + 1;
    }

    result.rank = currentRank;
    result.isTied = Boolean(unresolvedTie);
    if (unresolvedTie && previous) {
      previous.isTied = true;
    }
    previous = result;
  });

  return {
    complete: requiredJudgeCount > 0 && results.every((result) => result.status === "withdrawn" || result.submittedJudgeCount === requiredJudgeCount),
    results
  };
}

export function formatScore(score: number | null) {
  return score === null ? "Incomplete" : score.toFixed(2);
}
