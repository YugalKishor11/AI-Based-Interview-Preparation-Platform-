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
-- ==========================================
-- PREPSPHERE RLS POLICIES: 20261119000002_rls_policies.sql
-- Default-deny isolation ensuring zero cross-tenant data leakage
-- ==========================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviewer_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Interviewer Personas (Public Read for Active Personas)
CREATE POLICY "Anyone can view active personas"
  ON public.interviewer_personas FOR SELECT
  USING (is_active = true);

-- 3. Questions Bank (Read-only for Authenticated Candidates)
CREATE POLICY "Authenticated candidates can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- 4. Saved Questions (Owner only)
CREATE POLICY "Candidates manage own saved questions"
  ON public.saved_questions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Interview Plans (Owner only)
CREATE POLICY "Candidates manage own interview plans"
  ON public.interview_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Interview Sessions (Owner only)
CREATE POLICY "Candidates manage own sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Candidate Answers (Owner only)
CREATE POLICY "Candidates manage own answers"
  ON public.answers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Rubric Scores (Owner only)
CREATE POLICY "Candidates view own rubric scores"
  ON public.rubric_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rubric scores"
  ON public.rubric_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 9. Evidence-Linked Reports (Owner only)
CREATE POLICY "Candidates manage own reports"
  ON public.reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. Progress Snapshots (Owner only)
CREATE POLICY "Candidates view own progress snapshots"
  ON public.progress_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Drill Plans (Owner only)
CREATE POLICY "Candidates manage own drill plans"
  ON public.drill_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 12. Uploaded Resumes (Owner only)
CREATE POLICY "Candidates manage own resumes"
  ON public.resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 13. Consents (Owner only)
CREATE POLICY "Candidates view and record consents"
  ON public.consents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 14. Feedback Disputes (Owner only)
CREATE POLICY "Candidates manage own disputes"
  ON public.feedback_disputes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 15. Usage Credits (Owner view only; updates via atomic procedure/service role)
CREATE POLICY "Candidates view own credits ledger"
  ON public.usage_credits FOR SELECT
  USING (auth.uid() = user_id);

-- 16. Rate Limits (Service role only)
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 17. Idempotency Keys (Service role only)
CREATE POLICY "Service role manages idempotency keys"
  ON public.idempotency_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 18. AI Usage Ledger (Service role only; zero client access)
CREATE POLICY "Service role manages ai usage ledger"
  ON public.ai_usage_ledger FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 19. Security Audit Logs (Service role only; zero client access)
CREATE POLICY "Service role manages audit logs"
  ON public.audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- ==========================================
-- PREPSPHERE STORAGE BUCKETS: 20261119000003_storage_buckets.sql
-- Private buckets with strict per-user folder isolation
-- ==========================================

-- 1. Create Private Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'resumes',
    'resumes',
    false,
    5242880, -- 5 MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  ),
  (
    'recordings',
    'recordings',
    false,
    26214400, -- 25 MB limit
    ARRAY['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for Resumes Bucket
CREATE POLICY "Candidates access own resume files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates upload own resume files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates delete own resume files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Storage RLS Policies for Recordings Bucket
CREATE POLICY "Candidates access own audio recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates upload own audio recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates delete own audio recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role full access for maintenance & retention sweeps
CREATE POLICY "Service role manages storage objects"
  ON storage.objects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- ==========================================
-- PREPSPHERE ATOMIC TRANSACTIONS: 20261119000004_atomic_credits_debit.sql
-- Concurrency-safe credit debiting with row-level locks
-- ==========================================

-- 1. Atomic Credits Debit Function
CREATE OR REPLACE FUNCTION public.atomic_credits_debit(
  p_user_id UUID,
  p_amount INT,
  p_session_id TEXT,
  p_reason TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INT;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be strictly positive';
  END IF;

  -- Lock candidate profile row for update to eliminate race conditions
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate profile not found for user_id: %', p_user_id;
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', p_amount, v_current_credits;
  END IF;

  v_new_balance := v_current_credits - p_amount;

  -- Update balance
  UPDATE public.profiles
  SET credits = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  -- Insert immutable ledger entry
  INSERT INTO public.usage_credits (
    user_id,
    amount,
    balance_after,
    transaction_type,
    session_id,
    reason
  )
  VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'session_debit',
    p_session_id,
    p_reason
  );

  RETURN v_new_balance;
END;
$$;

-- 2. Atomic Credits Grant Function (Refunds / Top-ups)
CREATE OR REPLACE FUNCTION public.atomic_credits_grant(
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INT;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Grant amount must be strictly positive';
  END IF;

  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate profile not found for user_id: %', p_user_id;
  END IF;

  v_new_balance := v_current_credits + p_amount;

  UPDATE public.profiles
  SET credits = v_new_balance, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.usage_credits (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reason
  )
  VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    'signup_grant',
    p_reason
  );

  RETURN v_new_balance;
END;
$$;

-- 3. Database Retention Purge Function
CREATE OR REPLACE FUNCTION public.retention_sweep_db(
  p_days_transcripts INT DEFAULT 365,
  p_days_resumes INT DEFAULT 90
)
RETURNS TABLE (purged_answers INT, purged_resumes INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purged_ans INT;
  v_purged_res INT;
BEGIN
  -- Delete old answer transcripts
  WITH deleted_answers AS (
    DELETE FROM public.answers
    WHERE created_at < (now() - (p_days_transcripts || ' days')::interval)
    RETURNING id
  )
  SELECT count(*) INTO v_purged_ans FROM deleted_answers;

  -- Delete expired resume records
  WITH deleted_resumes AS (
    DELETE FROM public.resumes
    WHERE expires_at < now()
    RETURNING id
  )
  SELECT count(*) INTO v_purged_res FROM deleted_resumes;

  RETURN QUERY SELECT v_purged_ans, v_purged_res;
END;
$$;
-- ==========================================
-- PREPSPHERE SEED DATA: supabase/seed.sql
-- Seeded virtual AI personas and 60 curated questions
-- ==========================================

-- 1. Insert Interviewer Personas
INSERT INTO public.interviewer_personas (id, name, title, style, description, languages, voice_gender, sample_line, p1_color, p2_color, is_active, is_demo)
VALUES
  (
    'p1',
    'Aanya Rao',
    'Senior Engineering Manager',
    'Supportive',
    'Warm, structured, probing follow-ups on engineering management and system resilience.',
    'English, Hindi',
    'female',
    'Welcome Alex. Let''s walk through how you balance architectural purity with rapid delivery deadlines.',
    'rgba(139, 92, 246, 0.9)',
    'rgba(244, 114, 182, 0.7)',
    true,
    true
  ),
  (
    'p2',
    'Meera Kapoor',
    'HR Business Partner',
    'Balanced',
    'Calm, conversational, highly focused on leadership principles, EQ, and stakeholder consensus.',
    'English, Hindi',
    'female',
    'Hi Alex. I''d love to hear about a critical instance where team priorities clashed with company goals.',
    'rgba(56, 189, 248, 0.9)',
    'rgba(52, 211, 153, 0.7)',
    true,
    true
  ),
  (
    'p3',
    'Rohan Mehta',
    'Staff Software Engineer',
    'Challenging',
    'Direct, fast-paced, relentless on concurrency race conditions, memory safety, and edge-cases.',
    'English, Hindi',
    'male',
    'Let''s dig in. If your Redis cluster experiences a split-brain under peak load, what fails first and why?',
    'rgba(56, 189, 248, 0.9)',
    'rgba(139, 92, 246, 0.8)',
    true,
    true
  ),
  (
    'p4',
    'Daniel Brooks',
    'Principal Infrastructure Architect',
    'Challenging',
    'Thoughtful, deep system architecture focus, probing CAP theorem compromises and distributed clock skews.',
    'English',
    'male',
    'Good day Alex. Let''s examine how you ensure sliding-window rate limiting consistency across multi-region edge caches.',
    'rgba(139, 92, 246, 0.9)',
    'rgba(56, 189, 248, 0.8)',
    true,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  style = EXCLUDED.style,
  description = EXCLUDED.description,
  languages = EXCLUDED.languages,
  voice_gender = EXCLUDED.voice_gender,
  sample_line = EXCLUDED.sample_line,
  p1_color = EXCLUDED.p1_color,
  p2_color = EXCLUDED.p2_color;

-- 2. Insert Curated Questions (60 questions across 8 disciplines)
INSERT INTO public.questions (id, topic, level, title, tags, hint1, hint2, explanation, is_demo)
VALUES
  -- 1. System Design
  ('qb-1', 'System Design', 'Hard', 'Design a Global Distributed Rate Limiter', ARRAY['Redis', 'Concurrency', 'Lua'], 'Consider atomic operations in memory caches like Redis.', 'Sliding window log vs sliding window counter: balance memory vs precision.', 'Requires atomic token bucket synchronization and edge proxy in-memory fallbacks on 15ms latency breach.', true),
  ('qb-2', 'System Design', 'Hard', 'Real-time Collaborative Document Editing (OT vs CRDT)', ARRAY['WebSockets', 'CRDT', 'State'], 'Operational Transformation requires central sequencer; CRDTs converge peer-to-peer.', 'Tombstones, memory bloat, and causal consistency.', 'State-based vs operation-based CRDT trade-offs in distributed collaborative suites.', true),
  ('qb-3', 'System Design', 'Medium', 'Scalable Push Notification Delivery System', ARRAY['APNs', 'FCM', 'Kafka'], 'Device token fanout with partition workers.', 'Throttling and backpressure to avoid downstream device gateway 429s.', 'Partitioned consumer groups managing gateway socket connection pools.', true),
  ('qb-4', 'System Design', 'Hard', 'Video Transcoding & Adaptive Bitrate Streaming Pipeline', ARRAY['S3', 'FFmpeg', 'CDN'], 'Chunk-based chunking with HLS/DASH manifest creation.', 'Asynchronous workers consuming SQS/Kafka jobs.', 'Distributed video chunk slicing and manifest stitching.', true),
  ('qb-5', 'System Design', 'Medium', 'Distributed Web Crawler with Politeness Policy', ARRAY['DNS', 'Bloom Filter', 'Robots.txt'], 'Use Bloom filters for visited URL deduplication.', 'Queueing per host domain to honor robots.txt rate limits.', 'Two-tier frontier queuing separating domain politeness from overall throughput.', true),
  ('qb-6', 'System Design', 'Hard', 'Financial Ledger with Exactly-Once Processing', ARRAY['Postgres', 'Idempotency', 'Kafka'], 'Idempotency keys and transactional outbox pattern.', 'Double-entry bookkeeping validation constraints.', 'Strict double-entry invariants with database unique idempotency indexes.', true),
  ('qb-7', 'System Design', 'Medium', 'API Gateway with Dynamic Plugin Architecture', ARRAY['Envoy', 'WASM', 'Reverse Proxy'], 'Separation of control plane and data plane.', 'WASM modules for safe sandbox extension execution.', 'Envoy filter chains with out-of-process gRPC authorization sidecars.', true),
  ('qb-8', 'System Design', 'Hard', 'Geo-Distributed Metrics & Observability Platform', ARRAY['TSDB', 'Prometheus', 'Downsampling'], 'Time-series compaction and rollup tiers.', 'Distributed query fanout and pushdown aggregations.', 'Multi-tier storage with Gorilla delta-of-delta compression and long-term object storage rollups.', true),

  -- 2. React / Frontend
  ('qb-9', 'React / Frontend', 'Medium', 'Explain Fiber Reconciliation and Concurrent Mode', ARRAY['React', 'DOM', 'Scheduling'], 'Think about cooperative multitasking and message loops.', 'requestIdleCallback and time-slicing prioritization.', 'Fiber units of work enable pausing, resuming, and prioritizing work units without blocking.', true),
  ('qb-10', 'React / Frontend', 'Hard', 'Designing an Unbundled Virtualized Windowing List', ARRAY['DOM', 'Virtualization', 'Scroll'], 'Calculate visible slice based on scrollTop and itemHeight.', 'Dynamic row heights with ResizeObserver and binary search cache.', 'Windowing decouples total dataset length from rendered DOM node count.', true),
  ('qb-11', 'React / Frontend', 'Medium', 'Micro-Frontend Orchestration & Shared State Isolation', ARRAY['Module Federation', 'Custom Events'], 'Webpack Module Federation vs iframes.', 'Shared dependency singletons and version mismatches.', 'Runtime dynamic container remotes with version negotiation.', true),
  ('qb-12', 'React / Frontend', 'Hard', 'Optimizing INP (Interaction to Next Paint) in Heavy SPAs', ARRAY['Web Vitals', 'Main Thread', 'RAF'], 'Break long tasks into yields using scheduler.yield() or setTimeout.', 'Debounce vs throttle vs transition hooks.', 'Yielding to main thread between user input dispatch and DOM paint commit.', true),
  ('qb-13', 'React / Frontend', 'Medium', 'React Server Components (RSC) vs Client Components', ARRAY['Next.js', 'SSR', 'Bundling'], 'Zero client bundle footprint for server-only dependencies.', 'Serialization boundaries across JSON payload stream.', 'RSC streams serialized component trees without shipping node_modules runtime code to client.', true),
  ('qb-14', 'React / Frontend', 'Easy', 'Deep Equality vs Shallow Reference in React Memoization', ARRAY['useMemo', 'useCallback', 'GC'], 'Object.is comparison in dependencies array.', 'Over-memoization costs vs re-render penalties.', 'Garbage collection pressure and closure overhead vs re-evaluation cycles.', true),
  ('qb-15', 'React / Frontend', 'Hard', 'Building an Offline-First Sync Engine with IndexedDB', ARRAY['ServiceWorker', 'IndexedDB', 'Sync'], 'Mutation queues with monotonic local IDs.', 'Optimistic UI rollback and conflict resolution policies.', 'Append-only mutation journal synced with server during online events.', true),

  -- 3. Behavioral
  ('qb-16', 'Behavioral', 'Hard', 'Handling Critical Technical Disagreement with Principal Engineers', ARRAY['Conflict', 'Staff+', 'Influence'], 'Focus on empirical data and prototyping rather than seniority.', 'Demonstrate Disagree and Commit with clear success criteria.', 'Frame disagreements around measurable user impact and rollback milestones.', true),
  ('qb-17', 'Behavioral', 'Medium', 'Navigating Unrealistic Deadlines Imposed by Executives', ARRAY['Expectations', 'Trade-offs', 'Communication'], 'Never just say no; present scoped trade-offs with risk assessments.', 'Demonstrate phased delivery with an MVP cutline.', 'Communicate feature-scope vs ship-date trade-off matrices clearly.', true),
  ('qb-18', 'Behavioral', 'Hard', 'Leading a High-Severity Incident Response & Blameless Postmortem', ARRAY['SEV-1', 'Incident', 'Culture'], 'Separate incident commander from technical mitigators.', 'Focus postmortem on systemic process gaps, not human blame.', 'Structured communications cadences and preventative automated action items.', true),
  ('qb-19', 'Behavioral', 'Medium', 'Mentoring an Underperforming Senior Engineer Back to Success', ARRAY['Management', 'Feedback', '1-on-1'], 'Clarify expectations with measurable 30-day goals.', 'Identify skill gaps vs motivation/burnout factors.', 'Root cause analysis separating technical blockers from psychological safety.', true),
  ('qb-20', 'Behavioral', 'Hard', 'Sunset a Beloved Legacy System Against User Resistance', ARRAY['Change Management', 'Strategy'], 'Communicate migration timeline and direct migration tooling.', 'Create empathy bridges with affected power users.', 'Provide migration automation scripts and high-touch developer advocacy.', true),
  ('qb-21', 'Behavioral', 'Medium', 'Balancing Architectural Purity with Urgent Time-to-Market', ARRAY['Tech Debt', 'Product Strategy'], 'Define technical debt budgets as a planned loan.', 'Schedule immediate payoff tickets in subsequent sprint.', 'Intentional technical debt tracked with explicit ROI payback schedules.', true),
  ('qb-22', 'Behavioral', 'Hard', 'Managing Organizational Re-org and Shifting Priorities', ARRAY['Adaptability', 'Morale', 'Resilience'], 'Re-align team values to new strategic objectives.', 'Maintain high transparency during transitional ambiguity.', 'Protect engineering momentum and communicate strategic context continuously.', true),

  -- 4. DSA
  ('qb-23', 'DSA', 'Hard', 'LRU Cache with Time-to-Live (TTL) Eviction', ARRAY['Hash Map', 'Doubly-Linked List', 'Heaps'], 'Pair a standard LRU doubly linked list with a min-heap for expiration timestamps.', 'Lazy eviction on get() vs background cleanup worker trade-offs.', 'Hash map lookup O(1) coupled with doubly linked list update O(1) and TTL min-heap.', true),
  ('qb-24', 'DSA', 'Hard', 'Trapping Rain Water in 2D and 3D Grids', ARRAY['Two Pointers', 'Min-Heap', 'Monotonic Stack'], 'Maintain leftMax and rightMax bounds using two pointers.', 'For 3D, push boundary cells into priority queue and expand inward.', 'Two-pointer inward traversal maintaining maximum water containment boundary.', true),
  ('qb-25', 'DSA', 'Medium', 'Lowest Common Ancestor in Binary Trees with Parent Pointers', ARRAY['Trees', 'LCA', 'Hash Set'], 'Treat node heights like linked list intersections.', 'Advance the deeper node until depths match.', 'Equalizing depth offsets before walking pointers upward simultaneously.', true),
  ('qb-26', 'DSA', 'Hard', 'Median of Two Sorted Arrays in O(log(min(m, n)))', ARRAY['Binary Search', 'Partitioning'], 'Binary search for partition point on smaller array.', 'Verify maxLeftX <= minRightY and maxLeftY <= minRightX.', 'Binary partition split maintaining equal left and right halves.', true),
  ('qb-27', 'DSA', 'Medium', 'Course Schedule & Topological Sort with Cycle Detection', ARRAY['Graph', 'Kahn Algorithm', 'DFS'], 'Calculate in-degrees or use 3-color DFS visited states.', 'Zero in-degree nodes queue up sequentially.', 'Kahn algorithm using BFS queue of vertices with in-degree 0.', true),
  ('qb-28', 'DSA', 'Hard', 'Word Search II with Prefix Tree (Trie)', ARRAY['Trie', 'Backtracking', 'DFS'], 'Insert dictionary into Trie to prune recursive backtracking.', 'Remove leaf nodes dynamically upon finding matches to avoid duplicates.', 'Backtracking on 2D grid pruned by Trie node existence.', true),
  ('qb-29', 'DSA', 'Medium', 'Serialize and Deserialize N-ary Trees', ARRAY['BFS', 'DFS', 'String Parsing'], 'Preorder traversal with child count markers.', 'Use delimiter tokens like # or brackets to denote tree levels.', 'Preorder traversal encoding child counts or sentinel end markers.', true),
  ('qb-30', 'DSA', 'Hard', 'Sliding Window Maximum using Monotonic Deque in O(N)', ARRAY['Queue', 'Sliding Window'], 'Deque elements maintain decreasing order.', 'Pop indices out of range from the front.', 'Monotonic queue storing indices with strictly descending values.', true),

  -- 5. Database
  ('qb-31', 'Database', 'Medium', 'B-Tree vs LSM-Tree Storage Engines for Write-Heavy Loads', ARRAY['PostgreSQL', 'Cassandra', 'I/O'], 'Sequential I/O vs random page updates.', 'Write amplification vs read compaction overhead.', 'LSM append-only write path converts random writes to sequential I/O with background SSTable compaction.', true),
  ('qb-32', 'Database', 'Hard', 'PostgreSQL MVCC Internals, Vacuuming, and Transaction Wraparound', ARRAY['PostgreSQL', 'WAL', 'Vacuum'], 'Dead tuples and visibility maps.', 'Frozen XIDs and aggressive autovacuum triggers.', 'Postgres writes new tuple versions on update; vacuum reclaims dead rows and prevents 32-bit transaction wraparound.', true),
  ('qb-33', 'Database', 'Hard', 'Designing Sharding Keys for High-Cardinality Multi-Tenant DBs', ARRAY['Sharding', 'Hashing', 'Citrus'], 'Consistent hashing to avoid resharding storms.', 'Hot spot prevention on tenant ID vs time-series shards.', 'Composite shard keys balancing co-location of tenant queries with horizontal load balancing.', true),
  ('qb-34', 'Database', 'Medium', 'Database Isolation Levels: Dirty Reads to Phantom Reads and SSI', ARRAY['ACID', 'Transactions', 'Locks'], 'Read Committed vs Repeatable Read vs Serializable.', 'Snapshot isolation vs Serializable Snapshot Isolation (SSI).', 'SSI tracks read-write dependencies at runtime to abort dangerous cycles without pessimistic two-phase locking.', true),

  -- 6. Concurrency
  ('qb-35', 'Concurrency', 'Hard', 'Lock-Free Multi-Producer Multi-Consumer (MPMC) Queue', ARRAY['CAS', 'Atomics', 'Lock-Free'], 'Michael-Scott queue with paired CAS head and tail updates.', 'Tagged pointers or hazard pointers to eliminate the ABA hazard.', 'Atomic compare-and-swap with monotonic sequence tags preventing ABA race conditions.', true),
  ('qb-36', 'Concurrency', 'Medium', 'Detecting and Preventing Deadlocks in Distributed Microservices', ARRAY['Chandy-Misra', 'Deadlock', 'Timeouts'], 'Wait-for graphs and distributed cycle detection.', 'Wait-Die vs Wound-Wait timestamp ordering.', 'Wound-Wait preemption scheme based on transaction initiation timestamps.', true),
  ('qb-37', 'Concurrency', 'Hard', 'Thread Concurrency Hazards: Starvation, Livelock, Priority Inversion', ARRAY['OS', 'Locks', 'RTOS'], 'Priority inheritance protocol to prevent priority inversion.', 'Exponential randomized backoff to break livelock cycles.', 'Priority inheritance boosts lower priority thread holding mutex needed by higher priority thread.', true),

  -- 7. Architecture
  ('qb-38', 'Architecture', 'Hard', 'Event-Driven Architecture: Sagas (Choreography vs Orchestration)', ARRAY['Kafka', 'Saga', 'EDA'], 'Compensating transactions when a downstream microservice fails.', 'Central workflow orchestrator vs decentralized event subscriptions.', 'Orchestration provides centralized visibility and state machine governance; choreography reduces single point of failure.', true),
  ('qb-39', 'Architecture', 'Medium', 'Zero-Downtime Database Migration Patterns (Expand and Contract)', ARRAY['Blue-Green', 'Migrations', 'Dual-Write'], 'Expand phase: add column, make nullable, write to both.', 'Contract phase: backfill, switch reads, drop old column.', 'Expand-contract pattern allows old and new application versions to run concurrently against migrating schema.', true),
  ('qb-40', 'Architecture', 'Hard', 'Designing a Multi-Region Active-Active Microservices Mesh', ARRAY['Consul', 'DNS', 'Replication'], 'Conflict resolution across active-active database replicas (LWW vs CRDT).', 'Latency-based Anycast routing and regional circuit breakers.', 'Regional independence with asynchronous conflict-free data replication and global traffic routing.', true),

  -- 8. Culture & Leadership
  ('qb-41', 'Culture & Leadership', 'Hard', 'Aligning Engineering Teams Around Strategic Technical Vision', ARRAY['Vision', 'RFC', 'Strategy'], 'Use RFC processes to gather async feedback before decreeing decisions.', 'Tie architectural shifts directly to customer retention and velocity.', 'Collaborative RFC process establishing ownership and cross-functional sponsorship.', true),
  ('qb-42', 'Culture & Leadership', 'Medium', 'Cultivating Psychological Safety and High Accountability', ARRAY['Culture', '1-on-1', 'Safety'], 'Celebrate post-incident learning rather than finding scapegoats.', 'Separate personal blame from systemic quality improvements.', 'Clear outcome ownership coupled with blame-free postmortems drives rapid innovation.', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  topic = EXCLUDED.topic,
  level = EXCLUDED.level,
  tags = EXCLUDED.tags,
  hint1 = EXCLUDED.hint1,
  hint2 = EXCLUDED.hint2,
  explanation = EXCLUDED.explanation;
