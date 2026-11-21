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
