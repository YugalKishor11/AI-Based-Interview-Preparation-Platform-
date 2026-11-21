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
