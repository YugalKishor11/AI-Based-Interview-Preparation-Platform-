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
