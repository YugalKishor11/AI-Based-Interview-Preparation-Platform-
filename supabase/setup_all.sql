-- ==========================================
-- PREPSPHERE MIGRATION 1: 20261121000001_extensions_enums_helpers.sql
-- Concern: PostgreSQL extensions, custom domain enums, and helper functions
-- ==========================================

-- 1. Extensions
create extension if not exists pgcrypto;

-- pgvector is optional (question similarity, resume-topic match)
do $$
begin
  create extension if not exists vector;
exception
  when others then
    raise notice 'pgvector extension not available in this environment, skipping';
end $$;

-- 2. Custom Domain Enums
create type public.interview_type as enum (
  'technical',
  'hr',
  'behavioral',
  'dsa',
  'system_design',
  'coding',
  'resume'
);

create type public.exp_level as enum (
  'fresher',
  'junior',
  'mid',
  'senior',
  'staff'
);

create type public.difficulty as enum (
  'easy',
  'medium',
  'hard'
);

create type public.session_state as enum (
  'setup',
  'device_check',
  'ready',
  'live',
  'processing',
  'completed',
  'cancelled',
  'failed'
);

create type public.confidence as enum (
  'low',
  'medium',
  'high'
);

-- 3. Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
-- ==========================================
-- PREPSPHERE MIGRATION 2: 20261121000002_core_tables.sql
-- Concern: Core relational tables: profiles, personas, resumes, plans, sessions, questions, answers, rubric scores, reports
-- ==========================================

-- 1. Profiles Table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  career_goal text,
  target_roles text[] not null default '{}',
  locale text not null default 'en',
  theme_pref text not null default 'system' check (theme_pref in ('dark','light','system')),
  effects_pref text not null default 'auto' check (effects_pref in ('auto','full','reduced')),
  ui_sounds boolean not null default false,
  recordings_enabled boolean not null default false,
  retention_transcripts_days int not null default 365 check (retention_transcripts_days between 1 and 365),
  retention_resumes_days int not null default 90 check (retention_resumes_days between 1 and 90),
  retention_recordings_days int not null default 30 check (retention_recordings_days between 1 and 30),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- 2. Interviewer Personas Table
create table public.interviewer_personas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  title text not null,
  presentation text not null check (presentation in ('female','male','neutral')),
  personality text not null,
  difficulty_style text not null,
  languages text[] not null default '{en}',
  sample_line text not null,
  palette jsonb not null default '{}',
  voice_ref text,           -- provider voice id, server-side only
  is_demo boolean not null default true,
  active boolean not null default true
);

-- 3. Resumes Table
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_name text,
  mime text,
  size_bytes int check (size_bytes <= 5242880),
  summary jsonb,
  parsed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.resumes (user_id, created_at desc);

-- 4. Interview Plans Table
create table public.interview_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.interview_type not null,
  role text not null,
  level public.exp_level not null,
  difficulty public.difficulty not null,
  duration_min int not null check (duration_min between 10 and 60),
  question_count int not null check (question_count between 3 and 15),
  language text not null default 'en',
  persona_id uuid references public.interviewer_personas(id),
  resume_id uuid references public.resumes(id) on delete set null,
  plan jsonb not null,                       -- validated by the P1 Zod schema
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.interview_plans (user_id, created_at desc);

-- 5. Interview Sessions Table
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.interview_plans(id) on delete cascade,
  state public.session_state not null default 'setup',
  provider text,
  demo_mode boolean not null default true,
  resumable_state jsonb,
  credits_charged int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.interview_sessions (user_id, created_at desc);
create trigger sessions_updated before update on public.interview_sessions for each row execute function public.set_updated_at();

-- 6. Session Questions Table
create table public.session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position int not null,
  plan_question_id text not null,
  topic text not null,
  text text not null,
  asked_at timestamptz,
  unique (session_id, position)
);
create index on public.session_questions (user_id);
create index on public.session_questions (session_id, position);

-- 7. Answers Table
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_id uuid not null references public.session_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript text not null default '',
  duration_ms int check (duration_ms >= 0),
  typed boolean not null default false,
  delivery_metrics jsonb,                    -- pace, fillers, pauses: reported separately from content scores
  audio_path text,                           -- null unless the user opted in to recordings
  created_at timestamptz not null default now()
);
create index on public.answers (user_id, created_at desc);
create index on public.answers (session_id);

-- 8. Rubric Scores Table
create table public.rubric_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  answer_id uuid not null references public.answers(id) on delete cascade,
  dimension text not null check (dimension in ('technical_accuracy','reasoning','problem_solving','communication','answer_structure','role_relevance')),
  score numeric(2,1) not null check (score between 0 and 5),
  confidence public.confidence not null,
  evidence jsonb not null default '[]',      -- [{quote, reason}] quotes verified verbatim server-side
  insufficient_evidence boolean not null default false,
  missing_points text[] not null default '{}',
  suggestion text,
  created_at timestamptz not null default now(),
  constraint evidence_or_flagged check (insufficient_evidence or jsonb_array_length(evidence) >= 1),
  constraint insufficient_means_low check (not insufficient_evidence or confidence = 'low')
);
create index on public.rubric_scores (user_id, dimension, created_at desc);
create index on public.rubric_scores (session_id);
create index on public.rubric_scores (answer_id);

-- 9. Reports Table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score int not null check (overall_score between 0 and 100),
  label text not null default 'AI estimate' check (label = 'AI estimate'),
  summary text not null,
  weights jsonb not null default '{}',
  strengths jsonb not null default '[]',
  improvements jsonb not null default '[]',
  model_answers jsonb not null default '[]',
  topics text[] not null default '{}',
  delivery jsonb,
  limitations jsonb not null default '[]',
  low_confidence_share numeric(4,3) not null default 0,
  disclaimer_version text not null,
  created_at timestamptz not null default now()
);
create index on public.reports (user_id, created_at desc);
create index on public.reports using gin (topics);
-- ==========================================
-- PREPSPHERE MIGRATION 3: 20261121000003_remaining_tables.sql
-- Concern: Remaining schema tables: questions, saved questions, progress snapshots, drill plans, consents, disputes, credits ledger, AI ledger, rate limits, idempotency, audit
-- ==========================================

-- 1. Practice Questions Bank
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  title text not null,
  body text not null default '',
  level public.exp_level not null,
  difficulty public.difficulty not null,
  tags text[] not null default '{}',
  hint1 text,
  hint2 text,
  explanation text,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.questions (topic, level, difficulty);
create index on public.questions using gin (tags);

-- Conditional vector column if pgvector is enabled
do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
    execute 'alter table public.questions add column if not exists embedding vector(1536)';
  end if;
end $$;

-- 2. Saved Questions Table
create table public.saved_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  saved_at timestamptz not null default now(),
  done_at timestamptz,
  primary key (user_id, question_id)
);
create index on public.saved_questions (user_id, saved_at desc);

-- 3. Progress Snapshots Table
create table public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  dimension text not null check (dimension in ('technical_accuracy','reasoning','problem_solving','communication','answer_structure','role_relevance')),
  avg_score numeric(3,2) not null check (avg_score between 0 and 5),
  delta_wow numeric(3,2) not null default 0,
  sessions_n int not null default 0,
  streak_days int not null default 0,
  weakest boolean not null default false,
  recommendation jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_start, dimension)
);
create index on public.progress_snapshots (user_id, week_start desc);

-- 4. Drill Plans Table
create table public.drill_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  days jsonb not null default '[]',
  recheck jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.drill_plans (user_id, created_at desc);
create index on public.drill_plans (report_id);

-- 5. Consents Table (Append-only)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('terms','privacy','recording','resume_processing','analytics')),
  version text not null,
  granted boolean not null default true,
  granted_at timestamptz not null default now(),
  user_agent_hash text
);
create index on public.consents (user_id, kind, granted_at desc);

-- 6. Feedback Disputes Table
create table public.feedback_disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rubric_score_id uuid not null references public.rubric_scores(id) on delete cascade,
  reason text not null check (char_length(reason) <= 1000),
  status text not null default 'open' check (status in ('open','reviewed','resolved')),
  created_at timestamptz not null default now()
);
create index on public.feedback_disputes (user_id, created_at desc);
create index on public.feedback_disputes (rubric_score_id);

-- 7. Usage Credits Ledger (Append-only: Balance is sum(delta))
create table public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  session_id uuid references public.interview_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.usage_credits (user_id, created_at desc);
create index on public.usage_credits (session_id);

-- 8. AI Usage Ledger (Zero raw prompt or completion content recorded)
create table public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  function text not null,
  vendor text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_micros bigint not null default 0,
  created_at timestamptz not null default now()
);
create index on public.ai_usage_ledger (user_id, created_at desc);
create index on public.ai_usage_ledger (function, created_at desc);

-- 9. Rate Limits Table
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);
create index on public.rate_limits (window_start);

-- 10. Idempotency Keys Table
create table public.idempotency_keys (
  key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  function text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, function, key)
);
create index on public.idempotency_keys (created_at desc);

-- 11. Deletion Audit Table (No user_id FK, survives account deletion)
create table public.deletion_audit (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('data','account')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  counts jsonb not null default '{}'
);
create index on public.deletion_audit (requested_at desc);
-- ==========================================
-- PREPSPHERE MIGRATION 4: 20261121000004_functions_triggers_views.sql
-- Concern: System triggers, debit_credits stored procedure, views, and timestamp constraints
-- ==========================================

-- 1. Automatic Profile & Welcome Credits Grant on Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));

  insert into public.usage_credits (user_id, delta, reason)
  values (new.id, 120, 'welcome_grant');  -- initial demo credits grant

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Concurrency-Safe Atomic Credit Debit
create or replace function public.debit_credits(
  p_user uuid,
  p_amount int,
  p_reason text,
  p_session uuid default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  bal int;
begin
  -- Transaction-scoped advisory lock prevents race conditions on user balance
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  select coalesce(sum(delta), 0) into bal
  from public.usage_credits
  where user_id = p_user;

  if bal < p_amount then
    raise exception 'insufficient_credits';
  end if;

  insert into public.usage_credits (user_id, delta, reason, session_id)
  values (p_user, -p_amount, p_reason, p_session);

  return bal - p_amount;
end $$;

revoke all on function public.debit_credits(uuid,int,text,uuid) from public, anon, authenticated;
grant execute on function public.debit_credits(uuid,int,text,uuid) to service_role;

-- 3. Caller's Credit Balance (Security Invoker)
create or replace function public.my_credit_balance()
returns int
language sql
security invoker
stable
as $$
  select coalesce(sum(delta), 0)::int
  from public.usage_credits
  where user_id = (select auth.uid());
$$;

revoke all on function public.my_credit_balance() from public, anon;
grant execute on function public.my_credit_balance() to authenticated;

-- 4. Reject Inverted Session Timestamps
create or replace function public.check_session_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.ended_at is not null and new.started_at is not null and new.ended_at < new.started_at then
    raise exception 'ended_at cannot be earlier than started_at';
  end if;
  return new;
end $$;

drop trigger if exists trg_check_session_timestamps on public.interview_sessions;
create trigger trg_check_session_timestamps
  before insert or update on public.interview_sessions
  for each row execute function public.check_session_timestamps();

-- 5. Weekly Dimension Scores View (Security Invoker)
create or replace view public.v_dimension_weekly with (security_invoker = true) as
select
  rs.user_id,
  date_trunc('week', s.ended_at) as week_start,
  rs.dimension,
  avg(rs.score) as avg_score,
  count(*) as n
from public.rubric_scores rs
join public.interview_sessions s on s.id = rs.session_id
where s.state = 'completed' and not rs.insufficient_evidence
group by 1, 2, 3;
-- ==========================================
-- PREPSPHERE MIGRATION 5: 20261121000005_row_level_security.sql
-- Concern: Row Level Security (RLS) policies, default-deny, column-level update grants, and policy indexes
-- ==========================================

-- Enable RLS across every single table
alter table public.profiles enable row level security;
alter table public.interviewer_personas enable row level security;
alter table public.resumes enable row level security;
alter table public.interview_plans enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.answers enable row level security;
alter table public.rubric_scores enable row level security;
alter table public.reports enable row level security;
alter table public.questions enable row level security;
alter table public.saved_questions enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.drill_plans enable row level security;
alter table public.consents enable row level security;
alter table public.feedback_disputes enable row level security;
alter table public.usage_credits enable row level security;
alter table public.ai_usage_ledger enable row level security;
alter table public.rate_limits enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.deletion_audit enable row level security;

-- ----------------------------------------------------
-- 1. Profiles Table Policies & Column Privileges
-- ----------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Enforce strict column-level update grants (cannot forge id, created_at, etc.)
revoke update on public.profiles from authenticated;
grant update (
  display_name,
  career_goal,
  target_roles,
  locale,
  theme_pref,
  effects_pref,
  ui_sounds,
  recordings_enabled,
  retention_transcripts_days,
  retention_resumes_days,
  retention_recordings_days,
  onboarding_completed_at
) on public.profiles to authenticated;

-- ----------------------------------------------------
-- 2. Interviewer Personas & Question Bank (Read-only for authenticated)
-- ----------------------------------------------------
create policy personas_select_authenticated on public.interviewer_personas
  for select to authenticated
  using (active = true);

create policy questions_select_authenticated on public.questions
  for select to authenticated
  using (true);

-- ----------------------------------------------------
-- 3. Resumes & Interview Plans (Select own; inserts via server Edge Functions)
-- ----------------------------------------------------
create policy resumes_select_own on public.resumes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy resumes_delete_own on public.resumes
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy plans_select_own on public.interview_plans
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------
-- 4. Sessions, Transcripts, Scores, Reports, Snapshots, Credits
-- (Select own only. Writes strictly by Service-Role to prevent forgery)
-- ----------------------------------------------------
create policy sessions_select_own on public.interview_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy sq_select_own on public.session_questions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy answers_select_own on public.answers
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy rubric_scores_select_own on public.rubric_scores
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy reports_select_own on public.reports
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy snapshots_select_own on public.progress_snapshots
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy drill_plans_select_own on public.drill_plans
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy credits_select_own on public.usage_credits
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------
-- 5. Saved Questions (Select, insert, delete own)
-- ----------------------------------------------------
create policy saved_q_select_own on public.saved_questions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy saved_q_insert_own on public.saved_questions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy saved_q_delete_own on public.saved_questions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------
-- 6. Consents (Append-only: select and insert own; NO update or delete)
-- ----------------------------------------------------
create policy consents_select_own on public.consents
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------
-- 7. Feedback Disputes (Select and insert own)
-- ----------------------------------------------------
create policy disputes_select_own on public.feedback_disputes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy disputes_insert_own on public.feedback_disputes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------
-- 8. Service-Role Only Tables (No client access)
-- ai_usage_ledger, rate_limits, idempotency_keys, deletion_audit
-- Default deny is active: Zero policies declared for authenticated or anon
-- ----------------------------------------------------
-- ==========================================
-- PREPSPHERE MIGRATION 6: 20261121000006_storage_buckets_policies.sql
-- Concern: Private Supabase Storage buckets (resumes & recordings) and object RLS policies
-- ==========================================

-- 1. Create Private Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'resumes',
    'resumes',
    false,
    5242880, -- 5 MB limit
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  ),
  (
    'recordings',
    'recordings',
    false,
    52428800, -- 50 MB limit
    array[
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/wav'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Resumes Storage Policies (Path convention: <user_id>/<file_uuid>.<ext>)
create policy resumes_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy resumes_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy resumes_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 3. Recordings Storage Policies (Requires user recordings_enabled AND active consent)
create policy recordings_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy recordings_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
      and p.recordings_enabled = true
    )
    and exists (
      select 1 from public.consents c
      where c.user_id = (select auth.uid())
      and c.kind = 'recording'
      and c.granted = true
    )
  );

create policy recordings_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- ==========================================
-- PREPSPHERE MIGRATION 7: 20261121000007_retention_and_jobs.sql
-- Concern: Database-level retention purge, deletion audit logging, and pg_cron schedule
-- ==========================================

create or replace function public.retention_sweep_db(
  p_transcripts_days int default null,
  p_resumes_days int default null,
  p_recordings_days int default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  t_count int := 0;
  r_count int := 0;
  rec_count int := 0;
  audit_id uuid;
begin
  -- 1. Purge expired answers and transcripts
  with expired_transcripts as (
    delete from public.answers a
    using public.profiles p
    where a.user_id = p.id
    and a.created_at < now() - make_interval(days => coalesce(p_transcripts_days, p.retention_transcripts_days))
    returning a.id
  )
  select count(*) into t_count from expired_transcripts;

  -- 2. Purge expired resumes
  with expired_resumes as (
    delete from public.resumes r
    using public.profiles p
    where r.user_id = p.id
    and r.created_at < now() - make_interval(days => coalesce(p_resumes_days, p.retention_resumes_days))
    returning r.id
  )
  select count(*) into r_count from expired_resumes;

  -- 3. Clear audio recordings where retention period exceeded
  with expired_recordings as (
    update public.answers a
    set audio_path = null
    from public.profiles p
    where a.user_id = p.id
    and a.audio_path is not null
    and a.created_at < now() - make_interval(days => coalesce(p_recordings_days, p.retention_recordings_days))
    returning a.id
  )
  select count(*) into rec_count from expired_recordings;

  -- 4. Record audit entry without PII or user_id FK
  insert into public.deletion_audit (kind, requested_at, completed_at, counts)
  values (
    'data',
    now(),
    now(),
    jsonb_build_object(
      'purged_transcripts', t_count,
      'purged_resumes', r_count,
      'purged_recordings', rec_count
    )
  )
  returning id into audit_id;

  return jsonb_build_object(
    'audit_id', audit_id,
    'purged_transcripts', t_count,
    'purged_resumes', r_count,
    'purged_recordings', rec_count
  );
end $$;

revoke all on function public.retention_sweep_db(int,int,int) from public, anon, authenticated;
grant execute on function public.retention_sweep_db(int,int,int) to service_role;

-- 5. pg_cron Scheduled Nightly Retention Sweep (03:00 UTC)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'nightly-retention-sweep',
      '0 3 * * *',
      'select public.retention_sweep_db();'
    );
  end if;
exception
  when others then
    raise notice 'pg_cron extension not active in this environment, skipping cron.schedule';
end $$;
-- ==========================================
-- PREPSPHERE SEED DATA: supabase/seed.sql
-- Inserts 4 Personas and 60 Curated Practice Questions (marked DEMO)
-- ==========================================

-- 1. Insert 4 Interviewer Personas
insert into public.interviewer_personas (
  id,
  slug,
  name,
  title,
  presentation,
  personality,
  difficulty_style,
  languages,
  sample_line,
  palette,
  voice_ref,
  is_demo,
  active
)
values
  (
    'p0000001-0000-0000-0000-000000000001'::uuid,
    'aanya-rao',
    'Aanya Rao',
    'Senior Engineering Manager',
    'female',
    'Warm, structured, empathetic mentor focusing on leadership, architecture, and team velocity.',
    'Supportive',
    array['en', 'hi'],
    'Welcome! Let us examine how you balance architectural purity with rapid delivery deadlines.',
    '{"p1": "rgba(139, 92, 246, 0.9)", "p2": "rgba(244, 114, 182, 0.7)"}'::jsonb,
    'voice-aanya-supportive',
    true,
    true
  ),
  (
    'p0000002-0000-0000-0000-000000000002'::uuid,
    'meera-kapoor',
    'Meera Kapoor',
    'HR Business Partner',
    'female',
    'Calm, conversational, highly focused on leadership principles, EQ, and stakeholder consensus.',
    'Balanced',
    array['en', 'hi'],
    'Hi there! I would love to hear about a critical instance where team priorities clashed with company goals.',
    '{"p1": "rgba(56, 189, 248, 0.9)", "p2": "rgba(52, 211, 153, 0.7)"}'::jsonb,
    'voice-meera-balanced',
    true,
    true
  ),
  (
    'p0000003-0000-0000-0000-000000000003'::uuid,
    'rohan-mehta',
    'Rohan Mehta',
    'Staff Software Engineer',
    'male',
    'Direct, fast-paced, relentless on concurrency race conditions, memory safety, and edge-cases.',
    'Challenging',
    array['en', 'hi'],
    'Let us dig in. If your distributed cache cluster experiences a partition under peak load, what fails first?',
    '{"p1": "rgba(56, 189, 248, 0.9)", "p2": "rgba(139, 92, 246, 0.8)"}'::jsonb,
    'voice-rohan-challenging',
    true,
    true
  ),
  (
    'p0000004-0000-0000-0000-000000000004'::uuid,
    'daniel-brooks',
    'Daniel Brooks',
    'Principal Infrastructure Architect',
    'male',
    'Authoritative, systems architecture focus, probing CAP theorem compromises and distributed invariants.',
    'Challenging',
    array['en'],
    'Good day. Let us analyze how you reconcile multi-region consistency across edge data caches.',
    '{"p1": "rgba(139, 92, 246, 0.9)", "p2": "rgba(56, 189, 248, 0.8)"}'::jsonb,
    'voice-daniel-architect',
    true,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  title = excluded.title,
  presentation = excluded.presentation,
  personality = excluded.personality,
  difficulty_style = excluded.difficulty_style,
  languages = excluded.languages,
  sample_line = excluded.sample_line,
  palette = excluded.palette,
  voice_ref = excluded.voice_ref,
  active = excluded.active;

-- 2. Insert 60 Curated Practice Questions (All tagged is_demo=true and marked [DEMO])
insert into public.questions (
  id, topic, title, body, level, difficulty, tags, hint1, hint2, explanation, is_demo
)
values
  -- 1-10: System Design
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'System Design', '[DEMO] Design a Global Distributed Rate Limiter', 'Design a scalable multi-region rate limiting service that enforces tier-based rate limits with sub-10ms p99 latency.', 'staff', 'hard', array['redis', 'concurrency', 'lua'], 'Consider atomic operations in memory caches like Redis.', 'Sliding window log vs sliding window counter trade-offs.', 'Requires atomic token bucket synchronization and edge proxy in-memory fallbacks.', true),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'System Design', '[DEMO] Real-Time Collaborative Document Editing', 'Design a distributed document editor supporting simultaneous character edits by thousands of concurrent users.', 'staff', 'hard', array['websockets', 'crdt', 'state'], 'Operational Transformation requires central sequencer; CRDTs converge peer-to-peer.', 'Tombstones, memory bloat, and causal consistency.', 'State-based vs operation-based CRDT trade-offs in distributed collaborative suites.', true),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'System Design', '[DEMO] Scalable Push Notification Delivery System', 'Design an infrastructure delivering 100M notifications per hour across mobile APNs and FCM gateways.', 'senior', 'medium', array['apns', 'fcm', 'kafka'], 'Device token fanout with partition workers.', 'Throttling and backpressure to avoid downstream device gateway 429s.', 'Partitioned consumer groups managing gateway socket connection pools.', true),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'System Design', '[DEMO] Video Transcoding & Adaptive Streaming Pipeline', 'Design an ingestion and transcoding pipeline converting raw uploads into multi-bitrate HLS segments.', 'senior', 'hard', array['s3', 'ffmpeg', 'cdn'], 'Chunk-based chunking with HLS/DASH manifest creation.', 'Asynchronous workers consuming SQS/Kafka jobs.', 'Distributed video chunk slicing and manifest stitching.', true),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'System Design', '[DEMO] Distributed Web Crawler with Politeness Policy', 'Architect a distributed web crawler processing 1B pages monthly while respecting robots.txt per host.', 'mid', 'medium', array['dns', 'bloom-filter', 'crawler'], 'Use Bloom filters for visited URL deduplication.', 'Queueing per host domain to honor robots.txt rate limits.', 'Two-tier frontier queuing separating domain politeness from overall throughput.', true),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'System Design', '[DEMO] Financial Ledger with Exactly-Once Processing', 'Design a double-entry accounting ledger system guaranteeing zero double-spending under network partitions.', 'staff', 'hard', array['postgres', 'idempotency', 'ledger'], 'Idempotency keys and transactional outbox pattern.', 'Double-entry bookkeeping validation constraints.', 'Strict double-entry invariants with database unique idempotency indexes.', true),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 'System Design', '[DEMO] API Gateway with Dynamic Plugin Architecture', 'Design an API Gateway routing traffic with hot-reloadable authentication and transformation plugins.', 'senior', 'medium', array['envoy', 'wasm', 'gateway'], 'Separation of control plane and data plane.', 'WASM modules for safe sandbox extension execution.', 'Envoy filter chains with out-of-process gRPC authorization sidecars.', true),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 'System Design', '[DEMO] Geo-Distributed Metrics Observability Platform', 'Design a multi-region time-series ingestion and query platform handling 50M metric samples per second.', 'staff', 'hard', array['tsdb', 'prometheus', 'observability'], 'Time-series compaction and rollup tiers.', 'Distributed query fanout and pushdown aggregations.', 'Multi-tier storage with Gorilla delta-of-delta compression and long-term object storage rollups.', true),
  ('a0000000-0000-0000-0000-000000000009'::uuid, 'System Design', '[DEMO] High-Throughput URL Shortener', 'Design a URL shortener processing 100k writes/sec and 2M reads/sec with custom slug reservation.', 'junior', 'easy', array['base62', 'cache', 'keygen'], 'Base62 encoding with pre-generated range tokens.', 'Cache hot redirects with Redis and write-through DB.', 'Pre-allocated key generator instances eliminate range collisions.', true),
  ('a0000000-0000-0000-0000-000000000010'::uuid, 'System Design', '[DEMO] Proximity Service (Nearby Places / Geo-Search)', 'Design a geolocation query service returning places of interest within 5km radius with dynamic spatial updates.', 'senior', 'medium', array['geohash', 'quadtree', 'gis'], 'Geohash vs Quadtree vs Uber H3 hexagonal indexing.', 'Spatial indexing and boundary edge queries.', 'Quadtree memory indices coupled with GeoHash prefix caching.', true),

  -- 11-20: Frontend & Architecture
  ('a0000000-0000-0000-0000-000000000011'::uuid, 'React / Frontend', '[DEMO] Fiber Reconciliation & Concurrent Rendering', 'Explain the internal architecture of React Fiber, time-slicing work units, and interruption mechanics.', 'senior', 'medium', array['react', 'dom', 'scheduling'], 'Think about cooperative multitasking and message loops.', 'requestIdleCallback and time-slicing prioritization.', 'Fiber units of work enable pausing, resuming, and prioritizing work units without blocking.', true),
  ('a0000000-0000-0000-0000-000000000012'::uuid, 'React / Frontend', '[DEMO] Virtualized Windowing List with Dynamic Heights', 'Design a zero-dependency DOM virtualizer rendering 100,000 variable-height rows at 60fps.', 'staff', 'hard', array['dom', 'virtualization', 'scroll'], 'Calculate visible slice based on scrollTop and itemHeight.', 'Dynamic row heights with ResizeObserver and binary search cache.', 'Windowing decouples total dataset length from rendered DOM node count.', true),
  ('a0000000-0000-0000-0000-000000000013'::uuid, 'React / Frontend', '[DEMO] Micro-Frontend Orchestration & State Isolation', 'Architect a micro-frontend shell hosting independently deployed apps with shared token authentication.', 'senior', 'medium', array['module-federation', 'custom-events'], 'Webpack Module Federation vs iframes.', 'Shared dependency singletons and version mismatches.', 'Runtime dynamic container remotes with version negotiation.', true),
  ('a0000000-0000-0000-0000-000000000014'::uuid, 'React / Frontend', '[DEMO] Optimizing INP (Interaction to Next Paint)', 'Diagnose and remediate long input delays exceeding 200ms in complex interactive data tables.', 'senior', 'hard', array['web-vitals', 'main-thread', 'raf'], 'Break long tasks into yields using scheduler.yield() or setTimeout.', 'Debounce vs throttle vs transition hooks.', 'Yielding to main thread between user input dispatch and DOM paint commit.', true),
  ('a0000000-0000-0000-0000-000000000015'::uuid, 'React / Frontend', '[DEMO] React Server Components vs Client Boundaries', 'Describe serialization protocol, RSC payloads, and trade-offs of server-only modules.', 'mid', 'medium', array['nextjs', 'ssr', 'bundling'], 'Zero client bundle footprint for server-only dependencies.', 'Serialization boundaries across JSON payload stream.', 'RSC streams serialized component trees without shipping node_modules runtime code to client.', true),
  ('a0000000-0000-0000-0000-000000000016'::uuid, 'React / Frontend', '[DEMO] Deep Equality vs Reference Checks in Memoization', 'Explain JavaScript reference identity in hooks dependencies and costs of over-memoization.', 'junior', 'easy', array['usememo', 'usecallback', 'gc'], 'Object.is comparison in dependencies array.', 'Over-memoization costs vs re-render penalties.', 'Garbage collection pressure and closure overhead vs re-evaluation cycles.', true),
  ('a0000000-0000-0000-0000-000000000017'::uuid, 'React / Frontend', '[DEMO] Offline-First Sync Engine with IndexedDB', 'Design an offline persistence client that queues mutations and merges server deltas upon reconnect.', 'staff', 'hard', array['serviceworker', 'indexeddb', 'sync'], 'Mutation queues with monotonic local IDs.', 'Optimistic UI rollback and conflict resolution policies.', 'Append-only mutation journal synced with server during online events.', true),
  ('a0000000-0000-0000-0000-000000000018'::uuid, 'React / Frontend', '[DEMO] Web Worker Audio Analyser Pipeline', 'Implement continuous FFT frequency data extraction in a DedicatedWorker without main-thread jank.', 'senior', 'medium', array['web-audio', 'workers', 'fft'], 'AudioWorklet vs Web Workers for real-time DSP.', 'SharedArrayBuffer and Atomics vs postMessage.', 'AudioWorklet processor feeds ring buffer read by UI visualizer.', true),
  ('a0000000-0000-0000-0000-000000000019'::uuid, 'React / Frontend', '[DEMO] State Machines in Complex Interview Navigation', 'Model an interview session flow using a hierarchical state machine with recovery states.', 'mid', 'medium', array['xstate', 'state-machine', 'reducer'], 'Discriminated union events with exhaustive matchers.', 'Deterministic state transitions prevent illegal screen jumps.', 'Typed state machine guards against network drops and out-of-order events.', true),
  ('a0000000-0000-0000-0000-000000000020'::uuid, 'React / Frontend', '[DEMO] Accessible Modal Dialog and Focus Trapping', 'Implement a fully accessible WCAG AA modal component with keyboard trapping and aria attributes.', 'junior', 'easy', array['a11y', 'dialog', 'aria'], 'Save activeElement before opening; restore focus on close.', 'Trap Tab key within first and last focusable elements.', 'ARIA modal attribute, role="dialog", and Esc key listener.', true),

  -- 21-30: Behavioral & Leadership
  ('a0000000-0000-0000-0000-000000000021'::uuid, 'Behavioral', '[DEMO] Resolving Architectural Disagreements with Principals', 'Describe a situation where you had a sharp technical disagreement with a higher-level engineer.', 'staff', 'hard', array['conflict', 'staff-plus', 'influence'], 'Focus on empirical data and prototyping rather than seniority.', 'Demonstrate Disagree and Commit with clear success criteria.', 'Frame disagreements around measurable user impact and rollback milestones.', true),
  ('a0000000-0000-0000-0000-000000000022'::uuid, 'Behavioral', '[DEMO] Navigating Unrealistic Executive Deadlines', 'How do you negotiate scope when executives mandate a launch date that threatens quality?', 'senior', 'medium', array['expectations', 'trade-offs', 'scope'], 'Never just say no; present scoped trade-offs with risk assessments.', 'Demonstrate phased delivery with an MVP cutline.', 'Communicate feature-scope vs ship-date trade-off matrices clearly.', true),
  ('a0000000-0000-0000-0000-000000000023'::uuid, 'Behavioral', '[DEMO] Leading a High-Severity Outage & Blameless Postmortem', 'Walk through your command during a SEV-1 production failure affecting customer transactions.', 'senior', 'hard', array['sev-1', 'incident', 'culture'], 'Separate incident commander from technical mitigators.', 'Focus postmortem on systemic process gaps, not human blame.', 'Structured communications cadences and preventative automated action items.', true),
  ('a0000000-0000-0000-0000-000000000024'::uuid, 'Behavioral', '[DEMO] Mentoring an Underperforming Colleague', 'How do you diagnose performance issues and establish actionable growth milestones in 1-on-1s?', 'mid', 'medium', array['management', 'feedback', 'coaching'], 'Clarify expectations with measurable 30-day goals.', 'Identify skill gaps vs motivation/burnout factors.', 'Root cause analysis separating technical blockers from psychological safety.', true),
  ('a0000000-0000-0000-0000-000000000025'::uuid, 'Behavioral', '[DEMO] Sunsetting a Beloved Legacy System', 'How do you convince internal users to migrate off an established service with minimal friction?', 'senior', 'hard', array['migration', 'change-management'], 'Communicate migration timeline and direct migration tooling.', 'Create empathy bridges with affected power users.', 'Provide migration automation scripts and high-touch developer advocacy.', true),
  ('a0000000-0000-0000-0000-000000000026'::uuid, 'Behavioral', '[DEMO] Balancing Technical Debt with Feature Delivery', 'When product pressure is overwhelming, how do you safeguard code hygiene and refactoring budgets?', 'mid', 'medium', array['tech-debt', 'product-strategy'], 'Define technical debt budgets as a planned loan.', 'Schedule immediate payoff tickets in subsequent sprint.', 'Intentional technical debt tracked with explicit ROI payback schedules.', true),
  ('a0000000-0000-0000-0000-000000000027'::uuid, 'Behavioral', '[DEMO] Handling Major Organizational Re-Organization', 'Describe guiding your team through strategic shifts, leadership turnover, and restructured goals.', 'senior', 'hard', array['adaptability', 'morale', 'leadership'], 'Re-align team values to new strategic objectives.', 'Maintain high transparency during transitional ambiguity.', 'Protect engineering momentum and communicate strategic context continuously.', true),
  ('a0000000-0000-0000-0000-000000000028'::uuid, 'Behavioral', '[DEMO] Introducing Controversial Best Practices', 'How did you introduce automated integration testing or CI/CD gates to an unmotivated team?', 'junior', 'easy', array['evangelism', 'testing', 'quality'], 'Demonstrate personal pain relief with small pilot projects.', 'Show test metrics preventing weekend regression outages.', 'Incremental voluntary adoption wins hearts over top-down mandates.', true),
  ('a0000000-0000-0000-0000-000000000029'::uuid, 'Behavioral', '[DEMO] Managing Burnout and Toxic Team Dynamics', 'How do you restore psychological safety and constructive communication in a fractured team?', 'staff', 'hard', array['culture', 'retention', 'empathy'], 'Identify individual pain points through confidential active listening.', 'Establish explicit team working norms and boundaries.', 'Rebuild trust through transparent decision-making criteria.', true),
  ('a0000000-0000-0000-0000-000000000030'::uuid, 'Behavioral', '[DEMO] Prioritizing Feature Roadmaps Across Competing Stakeholders', 'How do you arbitrate conflicting priorities between Sales, Engineering, and Compliance?', 'senior', 'medium', array['prioritization', 'stakeholders', 'okrs'], 'Score features using RICE (Reach, Impact, Confidence, Effort).', 'Involve stakeholders in joint evaluation workshops.', 'Alignment against company-level quarterly OKR impact.', true),

  -- 31-40: DSA & Algorithms
  ('a0000000-0000-0000-0000-000000000031'::uuid, 'DSA', '[DEMO] LRU Cache with TTL Expiration', 'Design an in-memory cache supporting O(1) get/put operations and periodic expiration eviction.', 'senior', 'hard', array['hashmap', 'linked-list', 'heaps'], 'Pair a standard LRU doubly linked list with a min-heap for expiration timestamps.', 'Lazy eviction on get() vs background cleanup worker trade-offs.', 'Hash map lookup O(1) coupled with doubly linked list update O(1) and TTL min-heap.', true),
  ('a0000000-0000-0000-0000-000000000032'::uuid, 'DSA', '[DEMO] Trapping Rain Water in 2D and 3D Grids', 'Compute the total volume of water retained after rainfall across elevation elevation profiles.', 'senior', 'hard', array['two-pointers', 'min-heap', 'monotonic-stack'], 'Maintain leftMax and rightMax bounds using two pointers.', 'For 3D, push boundary cells into priority queue and expand inward.', 'Two-pointer inward traversal maintaining maximum water containment boundary.', true),
  ('a0000000-0000-0000-0000-000000000033'::uuid, 'DSA', '[DEMO] Lowest Common Ancestor in Binary Trees', 'Find the lowest common ancestor node of two given nodes in a tree structure.', 'mid', 'medium', array['trees', 'lca', 'recursion'], 'Treat node heights like linked list intersections.', 'Advance the deeper node until depths match.', 'Equalizing depth offsets before walking pointers upward simultaneously.', true),
  ('a0000000-0000-0000-0000-000000000034'::uuid, 'DSA', '[DEMO] Median of Two Sorted Arrays in O(log(min(m, n)))', 'Find the median element of two sorted arrays with sublinear time complexity.', 'staff', 'hard', array['binary-search', 'partitioning'], 'Binary search for partition point on smaller array.', 'Verify maxLeftX <= minRightY and maxLeftY <= minRightX.', 'Binary partition split maintaining equal left and right halves.', true),
  ('a0000000-0000-0000-0000-000000000035'::uuid, 'DSA', '[DEMO] Course Schedule & Cycle Detection in Directed Graphs', 'Determine if all courses can be completed given prerequisites and output topological ordering.', 'mid', 'medium', array['graph', 'kahn-algorithm', 'bfs'], 'Calculate in-degrees or use 3-color DFS visited states.', 'Zero in-degree nodes queue up sequentially.', 'Kahn algorithm using BFS queue of vertices with in-degree 0.', true),
  ('a0000000-0000-0000-0000-000000000036'::uuid, 'DSA', '[DEMO] Word Search II with Trie & Backtracking', 'Given an m x n board of characters and list of words, return all words present on board.', 'senior', 'hard', array['trie', 'backtracking', 'dfs'], 'Insert dictionary into Trie to prune recursive backtracking.', 'Remove leaf nodes dynamically upon finding matches to avoid duplicates.', 'Backtracking on 2D grid pruned by Trie node existence.', true),
  ('a0000000-0000-0000-0000-000000000037'::uuid, 'DSA', '[DEMO] Serialize and Deserialize N-ary Trees', 'Design an algorithm to encode and decode arbitrary N-ary hierarchical structures.', 'mid', 'medium', array['bfs', 'dfs', 'parsing'], 'Preorder traversal with child count markers.', 'Use delimiter tokens like # or brackets to denote tree levels.', 'Preorder traversal encoding child counts or sentinel end markers.', true),
  ('a0000000-0000-0000-0000-000000000038'::uuid, 'DSA', '[DEMO] Sliding Window Maximum in O(N)', 'Return the maximum element in every sliding window of size k using monotonic deques.', 'senior', 'hard', array['queue', 'sliding-window', 'deque'], 'Deque elements maintain decreasing order.', 'Pop indices out of range from the front.', 'Monotonic queue storing indices with strictly descending values.', true),
  ('a0000000-0000-0000-0000-000000000039'::uuid, 'DSA', '[DEMO] Merge K Sorted Linked Lists', 'Merge k sorted linked lists and return the unified sorted list with optimal complexity.', 'junior', 'easy', array['heap', 'linked-list', 'merge'], 'Insert head nodes into a min-heap of size k.', 'Extract min and advance pointer to next list node.', 'Priority queue guarantees O(N log k) total runtime.', true),
  ('a0000000-0000-0000-0000-000000000040'::uuid, 'DSA', '[DEMO] Longest Substring Without Repeating Characters', 'Find the length of the longest substring containing unique characters in a given string.', 'fresher', 'easy', array['sliding-window', 'hashmap', 'strings'], 'Expand right pointer; shrink left pointer when collision occurs.', 'Store last seen index of each character.', 'Two pointers sliding window tracks maximum window length.', true),

  -- 41-50: Databases & Storage Internals
  ('a0000000-0000-0000-0000-000000000041'::uuid, 'Database', '[DEMO] B-Tree vs LSM-Tree Engines in Write-Heavy Systems', 'Compare random page writes vs sequential append log commits across database storage engines.', 'senior', 'medium', array['postgresql', 'cassandra', 'io'], 'Sequential I/O vs random page updates.', 'Write amplification vs read compaction overhead.', 'LSM append-only write path converts random writes to sequential I/O with background SSTable compaction.', true),
  ('a0000000-0000-0000-0000-000000000042'::uuid, 'Database', '[DEMO] Postgres MVCC, Dead Tuples, and Vacuuming', 'Explain multiversion concurrency control, write amplification, and transaction ID wraparound in Postgres.', 'staff', 'hard', array['postgresql', 'wal', 'vacuum'], 'Dead tuples and visibility maps.', 'Frozen XIDs and aggressive autovacuum triggers.', 'Postgres writes new tuple versions on update; vacuum reclaims dead rows and prevents 32-bit transaction wraparound.', true),
  ('a0000000-0000-0000-0000-000000000043'::uuid, 'Database', '[DEMO] Designing Sharding Keys for Multi-Tenant Databases', 'Architect horizontal database sharding keys that prevent hot spots and cross-shard transactions.', 'staff', 'hard', array['sharding', 'hashing', 'citus'], 'Consistent hashing to avoid resharding storms.', 'Hot spot prevention on tenant ID vs time-series shards.', 'Composite shard keys balancing co-location of tenant queries with horizontal load balancing.', true),
  ('a0000000-0000-0000-0000-000000000044'::uuid, 'Database', '[DEMO] Transaction Isolation Anomalies: Dirty to Phantom Reads', 'Walk through ANSI SQL isolation levels and how Snapshot Isolation avoids locking read paths.', 'senior', 'medium', array['acid', 'transactions', 'locks'], 'Read Committed vs Repeatable Read vs Serializable.', 'Snapshot isolation vs Serializable Snapshot Isolation (SSI).', 'SSI tracks read-write dependencies at runtime to abort dangerous cycles without pessimistic two-phase locking.', true),
  ('a0000000-0000-0000-0000-000000000045'::uuid, 'Database', '[DEMO] Write-Ahead Logging (WAL) and Crash Recovery', 'How do databases ensure ACID durability across power loss using WAL flush checkpoints?', 'mid', 'medium', array['wal', 'durability', 'storage'], 'Fsync disk flush boundaries and group commit.', 'ARIES recovery algorithm: Analysis, Redo, Undo.', 'Sequential WAL append with checkpoint dirty page flushing.', true),
  ('a0000000-0000-0000-0000-000000000046'::uuid, 'Database', '[DEMO] Indexing Strategies: B-Tree, Hash, GIN, and GiST', 'When should a data engineer select GIN or GiST indexes over traditional B-Tree structures?', 'junior', 'easy', array['indexes', 'gin', 'btree'], 'B-Tree handles equality and ranges; GIN handles composite elements.', 'GIN index maps individual array/jsonb items to row pointers.', 'GIN enables inverted indexing for arrays, JSONB, and full-text search.', true),
  ('a0000000-0000-0000-0000-000000000047'::uuid, 'Database', '[DEMO] Database Replication: Synchronous vs Semi-Sync vs Async', 'Analyze replication lag, failover split-brain hazards, and read-replica stale data trade-offs.', 'senior', 'medium', array['replication', 'ha', 'consensus'], 'Raft/Paxos consensus vs streaming replication.', 'Read-your-own-writes consistency models.', 'Routing sticky user writes to primary while serving delayed reads from read replicas.', true),
  ('a0000000-0000-0000-0000-000000000048'::uuid, 'Database', '[DEMO] Optimistic vs Pessimistic Concurrency Controls', 'Compare SELECT FOR UPDATE row locks vs version/timestamp checking in high-contention checkouts.', 'junior', 'easy', array['locking', 'concurrency', 'transactions'], 'Pessimistic locks acquire lock upfront; optimistic checks version at commit.', 'High collision rate degrades optimistic retry loops.', 'Optimistic locking minimizes lock wait duration when collision probability is low.', true),
  ('a0000000-0000-0000-0000-000000000049'::uuid, 'Database', '[DEMO] Connection Pooling Mechanics and Thundering Herds', 'Why do direct database connections exhaust memory under traffic spikes, and how does PgBouncer help?', 'mid', 'medium', array['pgbouncer', 'connection-pooling', 'postgres'], 'Process-per-connection overhead in Postgres.', 'Session pooling vs transaction pooling modes.', 'Transaction pooling multiplexes thousands of client connections onto a small worker pool.', true),
  ('a0000000-0000-0000-0000-000000000050'::uuid, 'Database', '[DEMO] Zero-Downtime Schema Migrations (Expand/Contract)', 'Safely rename a high-traffic column without acquiring exclusive table locks or dropping user queries.', 'senior', 'medium', array['migrations', 'blue-green', 'zero-downtime'], 'Expand phase: add new column, trigger dual write.', 'Backfill historical data in chunked background transactions.', 'Contract phase: switch reads, deprecate old column, drop safely.', true),

  -- 51-60: Concurrency, Architecture & Cloud
  ('a0000000-0000-0000-0000-000000000051'::uuid, 'Concurrency', '[DEMO] Lock-Free MPMC Queue with CAS Primitives', 'Design a thread-safe multi-producer multi-consumer queue using atomic compare-and-swap instructions.', 'staff', 'hard', array['cas', 'atomics', 'lock-free'], 'Michael-Scott queue with paired CAS head and tail updates.', 'Tagged pointers or hazard pointers to eliminate the ABA hazard.', 'Atomic compare-and-swap with monotonic sequence tags preventing ABA race conditions.', true),
  ('a0000000-0000-0000-0000-000000000052'::uuid, 'Concurrency', '[DEMO] Distributed Deadlock Detection & Prevention', 'How do distributed lock managers detect cyclic wait dependencies across microservice boundaries?', 'staff', 'hard', array['deadlock', 'chandy-misra', 'distributed-systems'], 'Wait-for graphs and distributed cycle detection.', 'Wait-Die vs Wound-Wait timestamp ordering.', 'Wound-Wait preemption scheme based on transaction initiation timestamps.', true),
  ('a0000000-0000-0000-0000-000000000053'::uuid, 'Concurrency', '[DEMO] Priority Inversion, Starvation, and Livelock', 'Explain how lower priority threads can block critical real-time threads and how priority inheritance fixes it.', 'senior', 'hard', array['rtos', 'locks', 'priority-inversion'], 'Priority inheritance protocol to prevent priority inversion.', 'Exponential randomized backoff to break livelock cycles.', 'Priority inheritance boosts lower priority thread holding mutex needed by higher priority thread.', true),
  ('a0000000-0000-0000-0000-000000000054'::uuid, 'Concurrency', '[DEMO] Actor Model vs Communicating Sequential Processes (CSP)', 'Compare Erlang/Akka mailboxes with Go channels regarding shared memory and message passing.', 'mid', 'medium', array['actor-model', 'csp', 'golang'], 'Actors have addressed identities and mailboxes; CSP uses anonymous channels.', 'Backpressure handling across bounded channel buffers.', 'CSP synchronizes over channels; Actors encapsulate state behind asynchronous addressable queues.', true),
  ('a0000000-0000-0000-0000-000000000055'::uuid, 'Concurrency', '[DEMO] Memory Barriers, Volatile Keywords, and CPU Caches', 'Explain hardware store buffers, cache coherence (MESI), and out-of-order execution in multi-core CPUs.', 'staff', 'hard', array['cpu-caches', 'memory-barriers', 'mesi'], 'Hardware store buffers and memory visibility delays.', 'Acquire and Release memory semantics.', 'Memory fences prevent processor compiler and CPU reordering across thread boundaries.', true),
  ('a0000000-0000-0000-0000-000000000056'::uuid, 'Architecture', '[DEMO] Distributed Sagas: Orchestration vs Choreography', 'Compare central orchestrators against reactive event-driven sagas with compensating transactions.', 'senior', 'hard', array['saga', 'kafka', 'microservices'], 'Compensating transactions when a downstream microservice fails.', 'Central workflow orchestrator vs decentralized event subscriptions.', 'Orchestration provides centralized visibility; choreography reduces single orchestrator bottleneck.', true),
  ('a0000000-0000-0000-0000-000000000057'::uuid, 'Architecture', '[DEMO] Multi-Region Active-Active Replication Invariants', 'How do you prevent data divergence when two independent cloud regions mutate the same record simultaneously?', 'staff', 'hard', array['active-active', 'crdt', 'multi-region'], 'Conflict resolution across active-active database replicas (LWW vs CRDT).', 'Latency-based Anycast routing and regional circuit breakers.', 'Regional independence with asynchronous conflict-free data replication and global traffic routing.', true),
  ('a0000000-0000-0000-0000-000000000058'::uuid, 'Architecture', '[DEMO] Event Sourcing & CQRS (Command Query Responsibility)', 'When is event sourcing superior to mutable relational state, and how do projection workers handle lag?', 'senior', 'medium', array['cqrs', 'event-sourcing', 'kafka'], 'Append-only event log as the source of truth.', 'Eventual consistency on read projections.', 'Command side handles business invariants; query side rebuilds specialized read views.', true),
  ('a0000000-0000-0000-0000-000000000059'::uuid, 'Architecture', '[DEMO] Resilient Circuit Breakers & Fallback Cascades', 'Design client-side circuit breakers with half-open probing to prevent catastrophic cascading failures.', 'mid', 'medium', array['resilience', 'circuit-breaker', 'reliability'], 'Closed, Open, and Half-Open state transitions.', 'Sliding error window rate thresholds and timeout backoffs.', 'Circuit breakers fail fast immediately to allow struggling downstream dependencies to recover.', true),
  ('a0000000-0000-0000-0000-000000000060'::uuid, 'Architecture', '[DEMO] Zero-Trust Service-to-Service mTLS Mesh', 'How do sidecars handle mutual TLS identity verification, short-lived certificates, and SPIFFE IDs?', 'staff', 'hard', array['spiffe', 'mtls', 'envoy'], 'X.509 certificate rotation without connection termination.', 'Cryptographic identity attestation per service workload.', 'mTLS sidecars terminate TLS and validate SAN SPIFFE identities automatically.', true)
on conflict (id) do update set
  topic = excluded.topic,
  title = excluded.title,
  body = excluded.body,
  level = excluded.level,
  difficulty = excluded.difficulty,
  tags = excluded.tags,
  hint1 = excluded.hint1,
  hint2 = excluded.hint2,
  explanation = excluded.explanation,
  is_demo = excluded.is_demo;
