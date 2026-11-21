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
