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
