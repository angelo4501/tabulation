-- DEMONSTRATION DATA ONLY.
-- Fictional Kalook-Alike event, contestants, judges, and criteria.
-- No real passwords are included; use Supabase Auth invites or password resets for access.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin.demo@kalook.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Administrator","role":"administrator"}', now(), now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'judge.one@kalook.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Judge Marilou Santos","role":"judge"}', now(), now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'judge.two@kalook.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Judge Renato Cruz","role":"judge"}', now(), now()),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'judge.three@kalook.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Judge Liza Mercado","role":"judge"}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Demo Administrator', 'admin.demo@kalook.test', 'administrator'),
  ('00000000-0000-0000-0000-000000000011', 'Judge Marilou Santos', 'judge.one@kalook.test', 'judge'),
  ('00000000-0000-0000-0000-000000000012', 'Judge Renato Cruz', 'judge.two@kalook.test', 'judge'),
  ('00000000-0000-0000-0000-000000000013', 'Judge Liza Mercado', 'judge.three@kalook.test', 'judge')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role;

insert into public.events (
  id,
  name,
  description,
  venue,
  event_date,
  organizer,
  status,
  created_by
) values (
  '10000000-0000-0000-0000-000000000001',
  'Demo Kalook-Alike Night',
  'Demonstration data for KALOOK! Simple Pageant Tabulation App.',
  'Barangay Demo Covered Court',
  '2026-10-15 19:00:00+08',
  'Demo Events Committee',
  'draft',
  '00000000-0000-0000-0000-000000000001'
) on conflict (id) do nothing;

insert into public.contestants (
  id,
  event_id,
  contestant_number,
  full_name,
  character_name,
  organization,
  display_order
) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '1', 'Mika Reyes', 'Pop Diva Alina Star', 'Barangay Mabuhay', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '2', 'Jonas Delos Santos', 'Action Hero Ramon Blaze', 'Barangay Pag-asa', 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '3', 'Trina Villanueva', 'Comedy Queen Bella Bright', 'Barangay Silangan', 3),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '4', 'Paolo Garcia', 'Rock Icon Marco Flame', 'Barangay Maligaya', 4),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '5', 'Sofia Navarro', 'Screen Legend Celeste Moon', 'Barangay Liwanag', 5)
on conflict (id) do nothing;

insert into public.criteria (
  event_id,
  name,
  description,
  weight,
  min_score,
  max_score,
  display_order
) values
  ('10000000-0000-0000-0000-000000000001', 'Physical Resemblance', 'How closely the contestant looks like the portrayed character or celebrity.', 40, 1, 100, 1),
  ('10000000-0000-0000-0000-000000000001', 'Costume and Styling', 'Accuracy and polish of costume, makeup, hair, and styling.', 20, 1, 100, 2),
  ('10000000-0000-0000-0000-000000000001', 'Mannerisms and Characterization', 'Gestures, expressions, voice, and overall character portrayal.', 20, 1, 100, 3),
  ('10000000-0000-0000-0000-000000000001', 'Stage Presence', 'Confidence, projection, and audience-facing performance.', 10, 1, 100, 4),
  ('10000000-0000-0000-0000-000000000001', 'Audience Impact', 'Entertainment value and audience response.', 10, 1, 100, 5)
on conflict do nothing;

insert into public.event_judges (event_id, judge_id, display_name, email) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Judge Marilou Santos', 'judge.one@kalook.test'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Judge Renato Cruz', 'judge.two@kalook.test'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'Judge Liza Mercado', 'judge.three@kalook.test')
on conflict (event_id, judge_id) do nothing;
