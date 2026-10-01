create extension if not exists "pgcrypto";

create type public.profile_role as enum ('administrator', 'judge');
create type public.event_status as enum ('draft', 'open', 'closed', 'published');
create type public.contestant_status as enum ('active', 'withdrawn');
create type public.score_sheet_status as enum ('draft', 'submitted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null unique,
  role public.profile_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  description text,
  venue text,
  event_date timestamptz,
  organizer text,
  timezone text not null default 'Asia/Manila',
  status public.event_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contestants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  contestant_number text not null,
  full_name text not null check (char_length(full_name) between 2 and 160),
  character_name text not null check (char_length(character_name) between 2 and 160),
  organization text,
  profile_photo_url text,
  display_order integer not null default 0 check (display_order >= 0),
  status public.contestant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, contestant_number)
);

create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  weight numeric(6,2) not null check (weight >= 0 and weight <= 100),
  min_score numeric(8,2) not null default 1,
  max_score numeric(8,2) not null default 100,
  display_order integer not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_score > min_score)
);

create table public.event_judges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, judge_id)
);

create table public.score_sheets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  judge_id uuid not null references public.profiles(id) on delete cascade,
  contestant_id uuid not null references public.contestants(id) on delete cascade,
  status public.score_sheet_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, judge_id, contestant_id),
  check ((status = 'submitted' and submitted_at is not null) or (status = 'draft' and submitted_at is null))
);

create table public.criterion_scores (
  id uuid primary key default gen_random_uuid(),
  score_sheet_id uuid not null references public.score_sheets(id) on delete cascade,
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  raw_score numeric(8,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (score_sheet_id, criterion_id)
);

create table public.score_reopen_logs (
  id uuid primary key default gen_random_uuid(),
  score_sheet_id uuid not null references public.score_sheets(id) on delete cascade,
  reopened_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (char_length(reason) >= 8),
  created_at timestamptz not null default now()
);

create index events_status_idx on public.events(status);
create index contestants_event_order_idx on public.contestants(event_id, display_order);
create index criteria_event_order_idx on public.criteria(event_id, display_order);
create index event_judges_judge_idx on public.event_judges(judge_id);
create index score_sheets_event_judge_idx on public.score_sheets(event_id, judge_id);
create index criterion_scores_sheet_idx on public.criterion_scores(score_sheet_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_events_updated_at before update on public.events for each row execute function public.touch_updated_at();
create trigger touch_contestants_updated_at before update on public.contestants for each row execute function public.touch_updated_at();
create trigger touch_criteria_updated_at before update on public.criteria for each row execute function public.touch_updated_at();
create trigger touch_event_judges_updated_at before update on public.event_judges for each row execute function public.touch_updated_at();
create trigger touch_score_sheets_updated_at before update on public.score_sheets for each row execute function public.touch_updated_at();
create trigger touch_criterion_scores_updated_at before update on public.criterion_scores for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrator'
  );
$$;

create or replace function public.is_event_judge(check_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_judges
    where event_id = check_event_id and judge_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.profile_role, 'judge')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.validate_criterion_score()
returns trigger
language plpgsql
as $$
declare
  criterion public.criteria%rowtype;
  sheet public.score_sheets%rowtype;
begin
  select * into criterion from public.criteria where id = new.criterion_id;
  select * into sheet from public.score_sheets where id = new.score_sheet_id;

  if criterion.event_id <> sheet.event_id then
    raise exception 'Criterion does not belong to the score sheet event.';
  end if;

  if new.raw_score < criterion.min_score or new.raw_score > criterion.max_score then
    raise exception 'Raw score is outside the configured criterion range.';
  end if;

  return new;
end;
$$;

create trigger validate_criterion_score before insert or update on public.criterion_scores for each row execute function public.validate_criterion_score();

create or replace function public.prevent_locked_score_changes()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.score_sheets
    where id = coalesce(old.score_sheet_id, new.score_sheet_id)
      and status = 'submitted'
  ) and not public.is_admin() then
    raise exception 'Submitted score sheets are locked.';
  end if;
  return new;
end;
$$;

create trigger prevent_locked_criterion_score_changes before update or delete on public.criterion_scores for each row execute function public.prevent_locked_score_changes();

insert into storage.buckets (id, name, public)
values ('contestant-photos', 'contestant-photos', true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.contestants enable row level security;
alter table public.criteria enable row level security;
alter table public.event_judges enable row level security;
alter table public.score_sheets enable row level security;
alter table public.criterion_scores enable row level security;
alter table public.score_reopen_logs enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "events_select_allowed" on public.events for select using (status = 'published' or public.is_admin() or public.is_event_judge(id));
create policy "events_admin_all" on public.events for all using (public.is_admin()) with check (public.is_admin());

create policy "contestants_select_allowed" on public.contestants for select using (
  public.is_admin()
  or public.is_event_judge(event_id)
  or exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
);
create policy "contestants_admin_all" on public.contestants for all using (public.is_admin()) with check (public.is_admin());

create policy "criteria_select_allowed" on public.criteria for select using (
  public.is_admin()
  or public.is_event_judge(event_id)
  or exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
);
create policy "criteria_admin_all" on public.criteria for all using (public.is_admin()) with check (public.is_admin());

create policy "event_judges_select_allowed" on public.event_judges for select using (public.is_admin() or judge_id = auth.uid());
create policy "event_judges_admin_all" on public.event_judges for all using (public.is_admin()) with check (public.is_admin());

create policy "score_sheets_select_allowed" on public.score_sheets for select using (public.is_admin() or judge_id = auth.uid());
create policy "score_sheets_insert_judge" on public.score_sheets for insert with check (
  judge_id = auth.uid()
  and public.is_event_judge(event_id)
  and exists (select 1 from public.events e where e.id = event_id and e.status = 'open')
);
create policy "score_sheets_update_judge_draft" on public.score_sheets for update using (
  judge_id = auth.uid()
  and status = 'draft'
) with check (
  judge_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_id and e.status = 'open')
);
create policy "score_sheets_admin_all" on public.score_sheets for all using (public.is_admin()) with check (public.is_admin());

create policy "criterion_scores_select_allowed" on public.criterion_scores for select using (
  public.is_admin()
  or exists (select 1 from public.score_sheets s where s.id = score_sheet_id and s.judge_id = auth.uid())
);
create policy "criterion_scores_insert_judge" on public.criterion_scores for insert with check (
  exists (
    select 1 from public.score_sheets s
    join public.events e on e.id = s.event_id
    where s.id = score_sheet_id and s.judge_id = auth.uid() and s.status = 'draft' and e.status = 'open'
  )
);
create policy "criterion_scores_update_judge_draft" on public.criterion_scores for update using (
  exists (select 1 from public.score_sheets s where s.id = score_sheet_id and s.judge_id = auth.uid() and s.status = 'draft')
) with check (
  exists (select 1 from public.score_sheets s where s.id = score_sheet_id and s.judge_id = auth.uid() and s.status = 'draft')
);
create policy "criterion_scores_admin_all" on public.criterion_scores for all using (public.is_admin()) with check (public.is_admin());

create policy "score_reopen_logs_select_admin" on public.score_reopen_logs for select using (public.is_admin());
create policy "score_reopen_logs_insert_admin" on public.score_reopen_logs for insert with check (public.is_admin());

create policy "contestant_photos_public_read" on storage.objects for select using (bucket_id = 'contestant-photos');
create policy "contestant_photos_admin_write" on storage.objects for insert with check (bucket_id = 'contestant-photos' and public.is_admin());
create policy "contestant_photos_admin_update" on storage.objects for update using (bucket_id = 'contestant-photos' and public.is_admin()) with check (bucket_id = 'contestant-photos' and public.is_admin());
create policy "contestant_photos_admin_delete" on storage.objects for delete using (bucket_id = 'contestant-photos' and public.is_admin());
