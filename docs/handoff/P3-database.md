# Gate B Handoff — Database Foundation (Schema, Security, Storage, Jobs, Tests)

**Platform**: PrepSphere  
**Phase**: Prompt 3 (Database Foundation)  
**Status**: Completed & Verified for Gate B  
**Date**: 2026-11-21  

---

## 1. Executive Summary & Gate B Status

This document records the complete, production-grade PostgreSQL database foundation for PrepSphere built on Supabase. It implements 20 relational tables, default-deny Row Level Security (RLS) policies on every table, column-level update privilege restrictions, private Supabase Storage buckets, concurrency-safe advisory locks for credits debit, automated lifecycle retention sweeps, and an automated verification test suite.

### Non-Negotiables Compliance Audit
| Rule / Principle | Status | Implementation Details & Proof |
| :--- | :---: | :--- |
| **Default Deny on All Tables** | **COMPLIED** | RLS enabled on all 20 tables in `20261121000005_row_level_security.sql`. Zero policies declared for `anon` role anywhere. |
| **Strict User Isolation** | **COMPLIED** | Every user-owned table has `user_id` referencing `auth.users(id) ON DELETE CASCADE`. Policies enforce `user_id = (select auth.uid())`. |
| **No Client Forgery of Scores/Credits** | **COMPLIED** | Client has zero insert/update access to `reports`, `rubric_scores`, `usage_credits`, `progress_snapshots`, and `drill_plans`. Writes occur exclusively through Edge Functions using `service_role`. |
| **Column-Level Profile Security** | **COMPLIED** | `REVOKE UPDATE ON public.profiles FROM authenticated;` accompanied by an explicit column grant restricted to user preferences. |
| **Append-Only Consents** | **COMPLIED** | `consents` table permits only `SELECT` and `INSERT` for authenticated users; `UPDATE` and `DELETE` policies are omitted. |
| **Product Constraints in Schema** | **COMPLIED** | Check constraints enforce score ranges (0–5), evidence requirement (`evidence_or_flagged`), low confidence on insufficient evidence, fixed label (`'AI estimate'`), and session timestamps (`ended_at >= started_at`). |
| **Atomic Concurrency-Safe Debits** | **COMPLIED** | Stored procedure `debit_credits()` executes within `pg_advisory_xact_lock(hashtext(p_user::text))`, preventing double-spending and balance overdrafts. |
| **Private Storage & Consent Check** | **COMPLIED** | Private buckets `resumes` (5MB) and `recordings` (50MB). Recordings upload policy strictly requires `profiles.recordings_enabled = true` and active `recording` consent. |
| **PII-Free Retention Sweep & Audit** | **COMPLIED** | `retention_sweep_db()` purges expired transcripts, resumes, and recordings per user retention preferences, logging aggregated counts to `deletion_audit` without user PII. |
| **Automated Gate B Test Suite** | **COMPLIED** | `tests/db-security-rls.test.ts` (26 tests) and total test suite (92 tests across 8 files) pass with 100% success, 0 contract drift, 0 secret leaks. |

---

## 2. Versioned Migrations Inventory (`supabase/migrations/`)

All migrations are modular, one concern per file, and timestamp-prefixed to apply cleanly from scratch with the Supabase CLI (`supabase db reset`):

| Migration File | Concern | Summary of DDL / Procedures |
| :--- | :--- | :--- |
| **`20261121000001_extensions_enums_helpers.sql`** | Extensions, Enums & Helpers | `pgcrypto`, optional `vector`; enums: `interview_type`, `exp_level`, `difficulty`, `session_state`, `confidence`; helper `set_updated_at()`. |
| **`20261121000002_core_tables.sql`** | Core Relational Tables | `profiles`, `interviewer_personas`, `resumes`, `interview_plans`, `interview_sessions`, `session_questions`, `answers`, `rubric_scores`, `reports`. Indexes and updated_at triggers. |
| **`20261121000003_remaining_tables.sql`** | Extended Relational Tables | `questions`, `saved_questions`, `progress_snapshots`, `drill_plans`, `consents`, `feedback_disputes`, `usage_credits`, `ai_usage_ledger`, `rate_limits`, `idempotency_keys`, `deletion_audit`. |
| **`20261121000004_functions_triggers_views.sql`** | Procedures, Triggers & Views | `handle_new_user()` trigger on `auth.users`, atomic `debit_credits()` with advisory locks, `my_credit_balance()`, `check_session_timestamps()` trigger, `v_dimension_weekly` view. |
| **`20261121000005_row_level_security.sql`** | Row Level Security & Grants | Enables RLS on all 20 tables; default deny; authenticated user policies; column privilege revocation and grant on `profiles`; index on all policy foreign keys. |
| **`20261121000006_storage_buckets_policies.sql`** | Storage Buckets & Policies | Configures private `resumes` and `recordings` buckets; RLS policies on `storage.objects` enforcing user folder paths and consent checks. |
| **`20261121000007_retention_and_jobs.sql`** | Retention Sweep & Cron Jobs | `retention_sweep_db()` cascade procedure; audit logger; `pg_cron` schedule at 03:00 UTC. |
| **`supabase/seed.sql`** | Seed Data | 4 Interviewer Personas (Aanya Rao, Meera Kapoor, Rohan Mehta, Daniel Brooks) and 60 Curated Practice Questions across 8 disciplines (marked `[DEMO]`). |
| **`supabase/setup_all.sql`** | Consolidated Deploy Script | 1,013 lines of unified DDL and seed for direct execution in Supabase Dashboard SQL Editor. |

---

## 3. Complete Row Level Security (RLS) Policy Table

Every table in `public` has RLS enabled with a default-deny posture. The `anon` role has **zero** policies across all tables.

| Table Name | Operation | Permitted Roles | Policy Name | Policy Clause / Check Constraint |
| :--- | :---: | :---: | :--- | :--- |
| **`public.profiles`** | `SELECT` | `authenticated` | `profiles_select_own` | `USING (id = (select auth.uid()))` |
| | `UPDATE` | `authenticated` | `profiles_update_own` | `USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))` *(Restricted by column grant)* |
| **`public.interviewer_personas`** | `SELECT` | `authenticated` | `personas_select_authenticated` | `USING (active = true)` |
| **`public.resumes`** | `SELECT` | `authenticated` | `resumes_select_own` | `USING (user_id = (select auth.uid()))` |
| | `DELETE` | `authenticated` | `resumes_delete_own` | `USING (user_id = (select auth.uid()))` |
| **`public.interview_plans`** | `SELECT` | `authenticated` | `plans_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.interview_sessions`** | `SELECT` | `authenticated` | `sessions_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.session_questions`** | `SELECT` | `authenticated` | `sq_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.answers`** | `SELECT` | `authenticated` | `answers_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.rubric_scores`** | `SELECT` | `authenticated` | `rubric_scores_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.reports`** | `SELECT` | `authenticated` | `reports_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.questions`** | `SELECT` | `authenticated` | `questions_select_authenticated` | `USING (true)` |
| **`public.saved_questions`** | `SELECT` | `authenticated` | `saved_q_select_own` | `USING (user_id = (select auth.uid()))` |
| | `INSERT` | `authenticated` | `saved_q_insert_own` | `WITH CHECK (user_id = (select auth.uid()))` |
| | `DELETE` | `authenticated` | `saved_q_delete_own` | `USING (user_id = (select auth.uid()))` |
| **`public.progress_snapshots`** | `SELECT` | `authenticated` | `snapshots_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.drill_plans`** | `SELECT` | `authenticated` | `drill_plans_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.consents`** | `SELECT` | `authenticated` | `consents_select_own` | `USING (user_id = (select auth.uid()))` |
| | `INSERT` | `authenticated` | `consents_insert_own` | `WITH CHECK (user_id = (select auth.uid()))` *(No UPDATE / DELETE)* |
| **`public.feedback_disputes`** | `SELECT` | `authenticated` | `disputes_select_own` | `USING (user_id = (select auth.uid()))` |
| | `INSERT` | `authenticated` | `disputes_insert_own` | `WITH CHECK (user_id = (select auth.uid()))` |
| **`public.usage_credits`** | `SELECT` | `authenticated` | `credits_select_own` | `USING (user_id = (select auth.uid()))` |
| **`public.ai_usage_ledger`** | None | `service_role` | *(None: Default Deny)* | Internal telemetry only |
| **`public.rate_limits`** | None | `service_role` | *(None: Default Deny)* | Edge Function rate limiter only |
| **`public.idempotency_keys`** | None | `service_role` | *(None: Default Deny)* | Edge Function idempotency engine only |
| **`public.deletion_audit`** | None | `service_role` | *(None: Default Deny)* | Retention sweep logger only |
| **`storage.objects` (`resumes`)** | `SELECT` | `authenticated` | `resumes_select_own` | `USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (select auth.uid())::text)` |
| | `INSERT` | `authenticated` | `resumes_insert_own` | `WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (select auth.uid())::text)` |
| | `DELETE` | `authenticated` | `resumes_delete_own` | `USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = (select auth.uid())::text)` |
| **`storage.objects` (`recordings`)** | `SELECT` | `authenticated` | `recordings_select_own` | `USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = (select auth.uid())::text)` |
| | `INSERT` | `authenticated` | `recordings_insert_own` | `WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = (select auth.uid())::text AND EXISTS profiles.recordings_enabled AND EXISTS consents)` |
| | `DELETE` | `authenticated` | `recordings_delete_own` | `USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = (select auth.uid())::text)` |

---

## 4. Stored Procedures & Database Functions Catalog

### 4.1 `handle_new_user()`
- **Type**: `TRIGGER` on `auth.users` (`AFTER INSERT`).
- **Security**: `SECURITY DEFINER`, `search_path = ''`.
- **Purpose**: Automatically provisions candidate row in `public.profiles` and grants initial 120 demo practice credits in `public.usage_credits` with reason `'welcome_grant'`.

### 4.2 `debit_credits(p_user uuid, p_amount int, p_reason text, p_session uuid)`
- **Type**: Stored function returning `int` (new balance).
- **Security**: `SECURITY DEFINER`, `search_path = ''`. Revoked from `public`, `anon`, `authenticated`; granted exclusively to `service_role`.
- **Concurrency Safety**: Acquires transaction-scoped lock `pg_advisory_xact_lock(hashtext(p_user::text))`.
- **Logic**: Calculates current balance as `sum(delta)`. If `bal < p_amount`, raises `insufficient_credits` exception. Appends row with `-p_amount`.

### 4.3 `my_credit_balance()`
- **Type**: `STABLE` function returning `int`.
- **Security**: `SECURITY INVOKER`. Granted to `authenticated`.
- **Purpose**: Calculates `sum(delta)` strictly for the calling user `(select auth.uid())`.

### 4.4 `check_session_timestamps()`
- **Type**: `TRIGGER` on `public.interview_sessions` (`BEFORE INSERT OR UPDATE`).
- **Purpose**: Enforces invariant that `ended_at` cannot be earlier than `started_at`.

### 4.5 `retention_sweep_db(p_transcripts_days, p_resumes_days, p_recordings_days)`
- **Type**: Stored procedure returning `jsonb`.
- **Security**: `SECURITY DEFINER`. Granted to `service_role`.
- **Purpose**: Performs cascading purge of expired transcripts, resumes, and recordings based on individual user retention preferences. Records counts to `deletion_audit`.

### 4.6 `v_dimension_weekly`
- **Type**: View with `security_invoker = true`.
- **Purpose**: Aggregates weekly average rubric scores per dimension for completed sessions where `not rs.insufficient_evidence`.

---

## 5. Storage Architecture

| Bucket | Access | Max File Size | Allowed MIME Types | Retention Default | Path Convention |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **`resumes`** | Private | 5 MB | `application/pdf`, DOCX, `text/plain` | 90 days | `<user_id>/<file_uuid>.<ext>` |
| **`recordings`** | Private | 50 MB | `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/wav` | 30 days (Opt-in only) | `<user_id>/<file_uuid>.<ext>` |

- **Signed URLs**: All client media and resume access is mediated through short-lived signed URLs (expiry $\le 3600$s). No bucket is public.

---

## 6. Local Workflow & CLI Scripts

The project includes three automated database scripts in `package.json`:

```bash
# 1. Reset and reseed the database schema from versioned migrations
npm run db:reset

# 2. Validate all SQL migrations against TypeScript interfaces and check for drift
npm run db:types

# 3. Execute the automated Gate B database security, RLS, and constraints test suite
npm run db:test
```

### Setup Instructions for Fresh Clone (< 10 Minutes)
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/YugalKishor11/AI-Based-Interview-Preparation-Platform-.git
   cd AI-Based-Interview-Preparation-Platform-
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Initialize Supabase Database:
   - For local Supabase CLI:
     ```bash
     npx supabase start
     npm run db:reset
     ```
   - For remote Supabase Cloud:
     Copy and execute `supabase/setup_all.sql` in the [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/_/sql).
4. Run verification suites:
   ```bash
   npm run db:types
   npm run db:test
   npm test
   ```

---

## 7. Gate B Verification Evidence

```bash
> npm run db:types
--- Checking Supabase Schema vs TypeScript Contracts ---
✓ Verified 20 / 20 SQL tables in migrations:
  - public.profiles
  - public.interviewer_personas
  - public.resumes
  - public.interview_plans
  - public.interview_sessions
  - public.session_questions
  - public.answers
  - public.rubric_scores
  - public.reports
  - public.questions
  - public.saved_questions
  - public.progress_snapshots
  - public.drill_plans
  - public.consents
  - public.feedback_disputes
  - public.usage_credits
  - public.ai_usage_ledger
  - public.rate_limits
  - public.idempotency_keys
  - public.deletion_audit
✓ All 20 tables have Default-Deny Row Level Security (RLS) enabled.
✓ TypeScript database row types in src/data/supabase/types.ts verified.
✓ Schema and contract verification complete. Zero unhandled differences.

> npm test
 ✓ src/features/room/roomReducer.test.ts (4 tests)
 ✓ src/data/contracts/contracts.test.ts (5 tests)
 ✓ tests/db-security-rls.test.ts (26 tests)
 ✓ tests/gemini-service.test.ts (9 tests)
 ✓ tests/voice-system.test.ts (12 tests)
 ✓ tests/backend.test.ts (23 tests)
 ✓ src/data/mock/repos.test.ts (4 tests)
 ✓ tests/supabase-auth.test.ts (9 tests)

Test Files  8 passed (8)
     Tests  92 passed (92)
  Duration  26.43s
```

---

## 8. Gate B Approval Sign-Off

- [x] All 7 modular versioned migrations created in `/supabase/migrations`.
- [x] All 20 tables created with check constraints, foreign keys, and indexes.
- [x] Default-deny RLS enabled on all 20 tables with `(select auth.uid())` user isolation.
- [x] Column-level update privileges enforced on `profiles`.
- [x] Append-only ledger enforced on `consents` and `usage_credits`.
- [x] Atomic credit debits implemented with `pg_advisory_xact_lock` and restricted to `service_role`.
- [x] Private Storage buckets configured with user-folder and consent-checking policies.
- [x] Seed data provisions 4 personas and 60 curated questions marked `[DEMO]`.
- [x] Single-file `setup_all.sql` compiled for Dashboard SQL Editor deployment.
- [x] NPM scripts `db:reset`, `db:types`, and `db:test` operational.
- [x] 100% passing tests (92 tests passed across 8 test suites, 0 contract drift, 0 secret leaks).
- [x] Handoff document published at `/docs/handoff/P3-database.md`.

**Database Foundation (Gate B) is complete, verified, and signed off.**
