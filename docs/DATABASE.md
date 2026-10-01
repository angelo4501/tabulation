# Database

Supabase migrations live in `supabase/migrations/`.

## Tables

- `profiles`: Supabase Auth profile, role, name, email.
- `events`: event information and status (`draft`, `open`, `closed`, `published`).
- `contestants`: contestant number, name, character, organization, photo URL, display order, status.
- `criteria`: scoring criteria, weights, score range, display order.
- `event_judges`: judge assignments.
- `score_sheets`: one judge score sheet per event/contestant.
- `criterion_scores`: raw score per score sheet and criterion.
- `score_reopen_logs`: administrator audit trail for reopened submissions.

## Key constraints

- Contestant number is unique per event.
- Judge assignment is unique per event and judge.
- Score sheet is unique per event, judge, and contestant.
- Criterion score is unique per score sheet and criterion.
- Criterion max score must be greater than min score.
- Submitted score sheets require `submitted_at`.
- Raw scores are checked against criterion ranges by trigger.

## RLS overview

Row-Level Security is enabled for every application table.

- Administrators can manage event setup, judging, and results.
- Judges can read assigned events, criteria, active contestants, and only their own score sheets/scores.
- Public users can read event, contestant, and criteria rows only when the event is `published`.
- Public users never receive individual judge scores.
- Supabase Storage bucket `contestant-photos` allows public reads and administrator writes.

Server actions additionally perform role checks before using the service-role client. The service-role key is only read in server modules.

## Seed data

`supabase/seed.sql` contains fictional demonstration data:

- One Kalook-Alike event.
- Five fictional contestants.
- Three fictional judges.
- Five default criteria.

No real passwords are included. Use Supabase Auth password reset or invitation flows for local sign-in.
