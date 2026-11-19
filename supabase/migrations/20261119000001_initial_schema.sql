-- ==========================================
-- PREPSPHERE SCHEMA: 20261119000001_initial_schema.sql
-- Complete relational foundation for voice interview practice
-- ==========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
CREATE TYPE interview_type AS ENUM (
  'system-design',
  'coding',
  'behavioral',
  'technical',
  'hr',
  'dsa',
  'resume'
);

CREATE TYPE experience_level AS ENUM (
  'Fresher',
  'Junior',
  'Mid',
  'Senior',
  'Staff'
);

CREATE TYPE difficulty_level AS ENUM (
  'Easy',
  'Medium',
  'Hard'
);

CREATE TYPE session_state AS ENUM (
  'created',
  'active',
  'completed',
  'abandoned'
);

CREATE TYPE confidence_level AS ENUM (
  'Low',
  'Medium',
  'High'
);

CREATE TYPE dispute_status AS ENUM (
  'received',
  'under_review',
  'resolved'
);

CREATE TYPE transaction_type AS ENUM (
  'signup_grant',
  'session_debit',
  'refund'
);

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'Staff Software Engineer',
  target_level TEXT NOT NULL DEFAULT 'Staff',
  streak_days INT NOT NULL DEFAULT 0,
  credits INT NOT NULL DEFAULT 120,
  avatar_url TEXT,
  joined_date TEXT NOT NULL DEFAULT to_char(now(), 'Month YYYY'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to create profile automatically on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, target_role, target_level, streak_days, credits)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'target_role', 'Staff Software Engineer'),
    COALESCE(new.raw_user_meta_data->>'target_level', 'Staff'),
    0,
    120
  );

  INSERT INTO public.usage_credits (user_id, amount, balance_after, transaction_type, reason)
  VALUES (
    new.id,
    120,
    120,
    'signup_grant',
    'Welcome demo practice credits grant'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Interviewer Personas Table
CREATE TABLE IF NOT EXISTS public.interviewer_personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  style TEXT NOT NULL,
  description TEXT NOT NULL,
  languages TEXT NOT NULL DEFAULT 'English',
  voice_gender TEXT NOT NULL,
  sample_line TEXT NOT NULL,
  p1_color TEXT NOT NULL,
  p2_color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Interview Plans Table
CREATE TABLE IF NOT EXISTS public.interview_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type interview_type NOT NULL,
  role TEXT NOT NULL,
  level experience_level NOT NULL,
  difficulty difficulty_level NOT NULL,
  duration_minutes INT NOT NULL,
  question_count INT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  resume_text TEXT,
  focus_areas TEXT[] DEFAULT '{}',
  questions JSONB NOT NULL DEFAULT '[]',
  estimated_credits INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.interview_plans(id) ON DELETE SET NULL,
  persona_id TEXT NOT NULL REFERENCES public.interviewer_personas(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  score INT,
  duration_mins INT NOT NULL,
  session_date TEXT NOT NULL,
  state session_state NOT NULL DEFAULT 'created',
  resumable_state JSONB NOT NULL DEFAULT '{}',
  provider TEXT NOT NULL DEFAULT 'demo',
  demo_mode BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Curated Questions Bank
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  level difficulty_level NOT NULL,
  title TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  hint1 TEXT NOT NULL,
  hint2 TEXT NOT NULL,
  explanation TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Saved Questions Junction
CREATE TABLE IF NOT EXISTS public.saved_questions (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- 7. Candidate Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  q_index INT NOT NULL,
  q_text TEXT NOT NULL,
  transcript TEXT NOT NULL,
  duration_ms INT NOT NULL,
  typed BOOLEAN NOT NULL DEFAULT false,
  delivery_metrics JSONB,
  audio_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Rubric Scores Table
CREATE TABLE IF NOT EXISTS public.rubric_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  score NUMERIC(3,1) NOT NULL,
  max_score NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  confidence confidence_level NOT NULL,
  quote TEXT NOT NULL,
  why TEXT NOT NULL,
  missing_points TEXT,
  suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Evidence-Linked Evaluation Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  persona_id TEXT NOT NULL REFERENCES public.interviewer_personas(id),
  report_date TEXT NOT NULL,
  duration TEXT NOT NULL,
  overall_score INT NOT NULL,
  label TEXT NOT NULL DEFAULT 'AI estimate',
  confidence TEXT NOT NULL,
  score_delta TEXT NOT NULL,
  summary TEXT NOT NULL,
  delivery JSONB NOT NULL,
  questions_feedback JSONB NOT NULL DEFAULT '[]',
  drill_plan JSONB NOT NULL DEFAULT '[]',
  disclaimer TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Progress Snapshots Table
CREATE TABLE IF NOT EXISTS public.progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  overall_score INT NOT NULL,
  technical_score NUMERIC(3,1) NOT NULL,
  reasoning_score NUMERIC(3,1) NOT NULL,
  communication_score NUMERIC(3,1) NOT NULL,
  problem_solving_score NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Targeted Drill Plans Table
CREATE TABLE IF NOT EXISTS public.drill_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_range TEXT NOT NULL,
  focus TEXT NOT NULL,
  minutes INT NOT NULL,
  task TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Uploaded Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT NOT NULL,
  parsed_summary TEXT,
  technologies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days')
);

-- 13. Candidate Consents Table
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- 14. Feedback Disputes Table
CREATE TABLE IF NOT EXISTS public.feedback_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  candidate_reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Usage Credits Ledger Table
CREATE TABLE IF NOT EXISTS public.usage_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  transaction_type transaction_type NOT NULL,
  session_id TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Rate Limits Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  tokens NUMERIC NOT NULL,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Idempotency Keys Table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_status INT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- 18. AI Usage Ledger (Zero transcripts / content logged)
CREATE TABLE IF NOT EXISTS public.ai_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  cost_cents NUMERIC(8,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Security Audit Logs (Zero transcripts / resumes logged)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.interview_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_session ON public.answers(session_id, q_index);
CREATE INDEX IF NOT EXISTS idx_rubric_session ON public.rubric_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_usage_credits_user ON public.usage_credits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_resumes_expires ON public.resumes(expires_at);
