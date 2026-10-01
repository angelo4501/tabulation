"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { ContestantRecord, CriterionRecord, CriterionScoreRecord, EventRecord, ProfileRecord, ScoreSheetRecord } from "@/lib/types";

type FormValues = {
  scores: Record<string, number>;
};

export function JudgeScoringForm({
  event,
  judge,
  contestants,
  criteria,
  scoreSheets,
  criterionScores
}: {
  event: EventRecord;
  judge: ProfileRecord;
  contestants: ContestantRecord[];
  criteria: CriterionRecord[];
  scoreSheets: ScoreSheetRecord[];
  criterionScores: CriterionScoreRecord[];
}) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const contestant = contestants[index];
  const sheet = scoreSheets.find((candidate) => candidate.contestant_id === contestant?.id);
  const locked = sheet?.status === "submitted" || event.status !== "open";
  const savedScores = useMemo(() => {
    const scores: Record<string, number> = {};
    if (!sheet) return scores;
    criterionScores
      .filter((score) => score.score_sheet_id === sheet.id)
      .forEach((score) => {
        scores[score.criterion_id] = score.raw_score;
      });
    return scores;
  }, [criterionScores, sheet]);
  const { control, register, handleSubmit, reset, formState } = useForm<FormValues>({
    values: { scores: savedScores }
  });
  const watchedScores = useWatch({ control, name: "scores" });
  const completeContestants = scoreSheets.filter((candidate) => candidate.status === "submitted").length;

  if (!contestant) {
    return <div className="card p-6">No active contestants are available for scoring.</div>;
  }

  const persist = (submit: boolean) => (values: FormValues) => {
    if (submit && !window.confirm("Submit final scores for this contestant? Submitted scores are locked unless reopened by the administrator.")) {
      return;
    }

    setMessage("");
    startTransition(async () => {
      try {
        const payload = {
          event_id: event.id,
          contestant_id: contestant.id,
          scores: criteria.map((criterion) => ({
            criterion_id: criterion.id,
            raw_score: values.scores[criterion.id]
          }))
        };
        const response = await fetch("/api/judge/scores", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ submit, payload })
        });
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Scores could not be saved.");
        }
        setMessage(submit ? "Final scores submitted." : "Draft saved.");
        reset(values);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Scores could not be saved.");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="card h-fit p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8b6a18]">Judge</p>
        <h2 className="text-2xl font-black text-[#34124d]">{judge.full_name}</h2>
        <p className="mt-2 text-slate-600">{completeContestants} of {contestants.length} contestants submitted</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-[#d6a738]" style={{ width: `${contestants.length ? (completeContestants / contestants.length) * 100 : 0}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {contestants.map((candidate, candidateIndex) => {
            const candidateSheet = scoreSheets.find((item) => item.contestant_id === candidate.id);
            return (
              <button
                className={`rounded-xl border p-3 text-sm font-black ${candidateIndex === index ? "border-[#34124d] bg-[#34124d] text-white" : candidateSheet?.status === "submitted" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white"}`}
                key={candidate.id}
                onClick={() => setIndex(candidateIndex)}
                type="button"
              >
                {candidate.contestant_number}
              </button>
            );
          })}
        </div>
      </aside>
      <form className="card p-5" onSubmit={handleSubmit(persist(false))}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8b6a18]">Contestant {contestant.contestant_number}</p>
            <h2 className="elegant-heading text-4xl font-black text-[#34124d]">{contestant.full_name}</h2>
            <p className="text-lg text-slate-700">{contestant.character_name}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${locked ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"}`}>
            {locked ? "Locked" : "Draft editable"}
          </span>
        </div>
        {contestant.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={contestant.full_name} className="mb-5 max-h-72 w-full rounded-3xl object-cover" src={contestant.profile_photo_url} />
        ) : null}
        <div className="space-y-5">
          {criteria.map((criterion) => {
            const raw = Number(watchedScores?.[criterion.id] ?? 0);
            const preview = raw ? ((raw / criterion.max_score) * criterion.weight).toFixed(2) : "0.00";
            const inputId = `score-${criterion.id}`;
            return (
              <div className="block rounded-2xl border border-purple-950/10 bg-white p-4" key={criterion.id}>
                <label className="flex flex-wrap items-center justify-between gap-2 font-black text-[#34124d]" htmlFor={inputId}>
                  {criterion.name}
                  <span className="text-sm text-[#8b6a18]">{criterion.weight}% · weighted {preview}</span>
                </label>
                <input
                  className="input mt-3 text-2xl font-black"
                  disabled={locked || isPending}
                  id={inputId}
                  max={criterion.max_score}
                  min={criterion.min_score}
                  step="0.01"
                  type="number"
                  {...register(`scores.${criterion.id}`, {
                    required: true,
                    min: criterion.min_score,
                    max: criterion.max_score
                  })}
                />
                <input
                  className="mt-3 w-full accent-[#34124d]"
                  disabled={locked || isPending}
                  aria-label={`${criterion.name} slider`}
                  max={criterion.max_score}
                  min={criterion.min_score}
                  step="1"
                  type="range"
                  {...register(`scores.${criterion.id}`)}
                />
              </div>
            );
          })}
        </div>
        {formState.errors.scores ? <p className="mt-4 text-sm font-bold text-red-700">Every score must be inside the configured range.</p> : null}
        {message ? <p className="mt-4 text-sm font-bold text-[#34124d]">{message}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-secondary" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} type="button">Previous</button>
          <button className="btn btn-secondary" disabled={index === contestants.length - 1} onClick={() => setIndex((value) => Math.min(contestants.length - 1, value + 1))} type="button">Next</button>
          <button className="btn btn-primary" disabled={locked || isPending} type="submit">Save draft</button>
          <button className="btn btn-gold" disabled={locked || isPending} onClick={handleSubmit(persist(true))} type="button">Submit final</button>
        </div>
      </form>
    </div>
  );
}
