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
