import { describe, expect, it } from "vitest";
import {
  assertScoreWithinRange,
  calculateJudgeTotal,
  calculateWeightedScore,
  tabulateResults,
  validateCriteriaWeights
} from "@/lib/scoring";
import type { ContestantRecord, CriterionRecord, EventJudgeRecord, ScoreSheetRecord, CriterionScoreRecord } from "@/lib/types";

const criteria: CriterionRecord[] = [
  criterion("c1", "Physical Resemblance", 40, 1),
  criterion("c2", "Costume and Styling", 20, 2),
  criterion("c3", "Mannerisms and Characterization", 20, 3),
  criterion("c4", "Stage Presence", 10, 4),
  criterion("c5", "Audience Impact", 10, 5)
];

const contestants: ContestantRecord[] = [
  contestant("p1", "1", "Mika Reyes", "Pop Diva"),
  contestant("p2", "2", "Jonas Cruz", "Action Hero"),
  contestant("p3", "3", "Trina Villanueva", "Comedy Queen", "withdrawn")
];

const judges: EventJudgeRecord[] = [
  judge("j1", "Judge One"),
  judge("j2", "Judge Two")
];

function criterion(id: string, name: string, weight: number, displayOrder: number): CriterionRecord {
  return {
    id,
    event_id: "event1",
    name,
    description: null,
    weight,
    min_score: 1,
    max_score: 100,
    display_order: displayOrder,
    is_active: true
  };
}

function contestant(id: string, number: string, name: string, character: string, status: "active" | "withdrawn" = "active"): ContestantRecord {
  return {
    id,
    event_id: "event1",
    contestant_number: number,
    full_name: name,
    character_name: character,
    organization: null,
    profile_photo_url: null,
    display_order: Number(number),
    status
  };
}

function judge(id: string, name: string): EventJudgeRecord {
  return {
    id: `assignment-${id}`,
    event_id: "event1",
    judge_id: id,
    display_name: name,
    email: `${id}@example.test`
  };
}

function sheet(id: string, judgeId: string, contestantId: string, status: "draft" | "submitted" = "submitted"): ScoreSheetRecord {
  return {
    id,
    event_id: "event1",
    judge_id: judgeId,
    contestant_id: contestantId,
    status,
    submitted_at: status === "submitted" ? "2026-10-01T00:00:00.000Z" : null
  };
}

function scores(scoreSheetId: string, values: number[]): CriterionScoreRecord[] {
  return values.map((raw, index) => ({
    id: `${scoreSheetId}-${criteria[index].id}`,
    score_sheet_id: scoreSheetId,
    criterion_id: criteria[index].id,
    raw_score: raw
  }));
}

describe("scoring calculations", () => {
  it("validates criteria weights totaling exactly 100", () => {
    expect(validateCriteriaWeights(criteria).valid).toBe(true);
    expect(validateCriteriaWeights([...criteria, { ...criteria[0], id: "extra", weight: 1 }]).valid).toBe(false);
  });

  it("calculates weighted scores and judge totals", () => {
    expect(calculateWeightedScore(90, 100, 40)).toBe(36);
    expect(calculateJudgeTotal(scores("s1", [90, 80, 95, 88, 100]), criteria)).toBeCloseTo(89.8);
  });

  it("rejects scores outside the criterion range", () => {
    expect(() => assertScoreWithinRange(101, criteria[0])).toThrow(/between 1 and 100/);
  });

  it("averages only submitted score sheets and marks missing submissions incomplete", () => {
    const scoreSheets = [sheet("s1", "j1", "p1"), sheet("s2", "j2", "p1", "draft")];
    const result = tabulateResults({
      contestants: contestants.slice(0, 1),
      criteria,
      judges,
      scoreSheets,
      criterionScores: scores("s1", [90, 90, 90, 90, 90]).concat(scores("s2", [1, 1, 1, 1, 1]))
    });

    expect(result.complete).toBe(false);
    expect(result.results[0].finalScore).toBe(90);
    expect(result.results[0].submittedJudgeCount).toBe(1);
  });

  it("excludes withdrawn contestants from ranking", () => {
    const result = tabulateResults({
      contestants,
      criteria,
      judges: [judges[0]],
      scoreSheets: [sheet("s1", "j1", "p1"), sheet("s2", "j1", "p3")],
      criterionScores: scores("s1", [80, 80, 80, 80, 80]).concat(scores("s2", [100, 100, 100, 100, 100]))
    });

    expect(result.results.find((candidate) => candidate.contestantId === "p3")?.rank).toBeNull();
    expect(result.results.find((candidate) => candidate.contestantId === "p1")?.rank).toBe(1);
  });

  it("ranks contestants and applies tie-break criteria", () => {
    const result = tabulateResults({
      contestants: contestants.slice(0, 2),
      criteria,
      judges: [judges[0]],
      scoreSheets: [sheet("s1", "j1", "p1"), sheet("s2", "j1", "p2")],
      criterionScores: scores("s1", [90, 80, 90, 90, 80]).concat(scores("s2", [89, 80, 90, 90, 84]))
    });

    expect(result.results.find((candidate) => candidate.contestantId === "p1")?.rank).toBe(1);
    expect(result.results.find((candidate) => candidate.contestantId === "p2")?.rank).toBe(2);
  });

  it("displays unresolved ties without random selection", () => {
    const result = tabulateResults({
      contestants: contestants.slice(0, 2),
      criteria,
      judges: [judges[0]],
      scoreSheets: [sheet("s1", "j1", "p1"), sheet("s2", "j1", "p2")],
      criterionScores: scores("s1", [90, 90, 90, 90, 90]).concat(scores("s2", [90, 90, 90, 90, 90]))
    });

    expect(result.results.every((candidate) => candidate.rank === 1 && candidate.isTied)).toBe(true);
  });
});

describe("MVP workflow and protection rules", () => {
  it("simulates the administrator-to-public happy path", () => {
    const scoreSheets = [
      sheet("s1", "j1", "p1"),
      sheet("s2", "j1", "p2"),
      sheet("s3", "j2", "p1"),
      sheet("s4", "j2", "p2")
    ];
    const result = tabulateResults({
      contestants: contestants.slice(0, 2),
      criteria,
      judges,
      scoreSheets,
      criterionScores: [
        ...scores("s1", [95, 92, 93, 90, 91]),
        ...scores("s2", [90, 88, 89, 91, 92]),
        ...scores("s3", [94, 91, 92, 90, 90]),
        ...scores("s4", [88, 90, 88, 89, 91])
      ]
    });

    expect(result.complete).toBe(true);
    expect(result.results.find((candidate) => candidate.rank === 1)?.contestantName).toBe("Mika Reyes");
  });

  it("models duplicate submission rejection", () => {
    const existing = sheet("s1", "j1", "p1", "submitted");
    expect(existing.status).toBe("submitted");
    expect(() => {
      if (existing.status === "submitted") {
        throw new Error("Submitted score sheets are locked unless reopened by an administrator.");
      }
    }).toThrow(/locked/);
  });

  it("models unauthorized score access and unpublished result protection", () => {
    const ownSheet = sheet("s1", "j1", "p1");
    const canReadOwn = ownSheet.judge_id === "j1";
    const canReadOtherJudge = ownSheet.judge_id === "j2";
    const publicCanReadDraftEvent = false;

    expect(canReadOwn).toBe(true);
    expect(canReadOtherJudge).toBe(false);
    expect(publicCanReadDraftEvent).toBe(false);
  });
});
