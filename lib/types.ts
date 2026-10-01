export type EventStatus = "draft" | "open" | "closed" | "published";
export type ContestantStatus = "active" | "withdrawn";
export type ProfileRole = "administrator" | "judge";
export type ScoreSheetStatus = "draft" | "submitted";

export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  event_date: string | null;
  organizer: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role: ProfileRole;
};

export type ContestantRecord = {
  id: string;
  event_id: string;
  contestant_number: string;
  full_name: string;
  character_name: string;
  organization: string | null;
  profile_photo_url: string | null;
  display_order: number;
  status: ContestantStatus;
};

export type CriterionRecord = {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  weight: number;
  min_score: number;
  max_score: number;
  display_order: number;
  is_active: boolean;
};

export type EventJudgeRecord = {
  id: string;
  event_id: string;
  judge_id: string;
  display_name: string;
  email: string;
};

export type ScoreSheetRecord = {
  id: string;
  event_id: string;
  judge_id: string;
  contestant_id: string;
  status: ScoreSheetStatus;
  submitted_at: string | null;
};

export type CriterionScoreRecord = {
  id: string;
  score_sheet_id: string;
  criterion_id: string;
  raw_score: number;
};

export type JudgeProgress = {
  judgeId: string;
  judgeName: string;
  completedContestants: number;
  totalContestants: number;
  submitted: boolean;
  submittedAt: string | null;
};

export type ContestantResult = {
  contestantId: string;
  contestantNumber: string;
  contestantName: string;
  characterName: string;
  status: ContestantStatus;
  rank: number | null;
  isTied: boolean;
  submittedJudgeCount: number;
  requiredJudgeCount: number;
  finalScore: number | null;
  criterionAverages: Record<string, number>;
};
