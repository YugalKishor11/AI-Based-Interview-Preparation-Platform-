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
