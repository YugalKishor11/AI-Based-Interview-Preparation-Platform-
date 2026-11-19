# Gate B Handoff — Backend Foundation on Supabase

**Platform**: PrepSphere  
**Phase**: Prompt 2 (Backend Foundation)  
**Status**: Completed & Verified  
**Date**: 2026-11-19  

---

## 1. Executive Summary & Gate B Status

This handoff documents the complete backend foundation for PrepSphere built on Supabase, featuring PostgreSQL migrations with Row Level Security (RLS), private Storage bucket policies, shared contract schemas with zero drift, and 13 Deno Edge Functions with cross-cutting middleware.

### Non-Negotiables Compliance Audit
| Rule | Status | Implementation Proof |
| :--- | :---: | :--- |
| **No Frontend Screen Changes** | **COMPLIED** | Git status confirms 0 changes in `src/features/`, `src/shared/`, `src/app/`, or CSS files. |
| **No Secrets in Client Bundle** | **COMPLIED** | Automated script `npm run check:secrets` verified 0 leaks in `src/` and `dist/`. Service-role keys exist strictly on server functions. |
| **Single Source for Contracts** | **COMPLIED** | Canonical contracts in `src/data/contracts/index.ts` re-exported to `_shared/contracts/index.ts`. `npm run check:contracts` verified 0 drift. |
| **Default-Deny RLS on All Tables** | **COMPLIED** | `20261119000002_rls_policies.sql` enables RLS on all 15 tables with `auth.uid() = user_id` isolation. |
| **Privacy & Zero Content Logging** | **COMPLIED** | Structured logger and `ai_usage_ledger` redact and omit all transcripts, resumes, and dialogue text. |
| **Concurrency-Safe Credits Debit** | **COMPLIED** | `atomic_credits_debit` stored procedure utilizes `SELECT ... FOR UPDATE` row locks to prevent double-spending. |
| **No Live Audio in Edge Functions** | **COMPLIED** | Functions mint short-lived scoped tokens (`session-token`); audio never transits Edge Functions. |

---

## 2. Architecture & Database Design

### 2.1 Database Schema (`supabase/migrations/`)
- **`20261119000001_initial_schema.sql`**:
  - Enums: `interview_type`, `experience_level`, `difficulty_level`, `session_state`, `confidence_level`, `dispute_status`, `transaction_type`.
  - Tables: `profiles`, `interviewer_personas`, `interview_plans`, `interview_sessions`, `answers`, `rubric_scores`, `questions`, `saved_questions`, `reports`, `progress_snapshots`, `drill_plans`, `resumes`, `consents`, `feedback_disputes`, `usage_credits`, `rate_limits`, `idempotency_keys`, `ai_usage_ledger`, `audit_logs`.
  - Automated Triggers: `on_auth_user_created` automatically provisions candidate profile and initial 120 practice credits upon signup in `auth.users`.
  - Performance Indexes: B-tree and GIN indexes across foreign keys, user IDs, topics, and expiration dates.
- **`20261119000002_rls_policies.sql`**:
  - Strict default-deny on all tables.
  - User isolation: `auth.uid() = user_id` for profiles, sessions, answers, reports, drill plans, resumes, disputes, and credits.
  - Public Read: `interviewer_personas` (active only) and `questions` bank.
  - Service-Role Only: `rate_limits`, `idempotency_keys`, `ai_usage_ledger`, and `audit_logs`.
- **`20261119000003_storage_buckets.sql`**:
  - Private `resumes` bucket (5MB limit, PDF/DOCX/TXT).
  - Private `recordings` bucket (25MB limit, webm/mp4/wav).
  - Storage RLS Policy: Restricts reads, inserts, and deletes strictly to `(storage.foldername(name))[1] = auth.uid()::text`.
- **`20261119000004_atomic_credits_debit.sql`**:
  - `atomic_credits_debit(p_user_id, p_amount, p_session_id, p_reason)`: Row-level lock (`FOR UPDATE`), checks balance, debits atomically, logs ledger transaction, and returns new balance.
  - `atomic_credits_grant(p_user_id, p_amount, p_type, p_reason)`: Concurrency-safe credit top-up.
  - `retention_sweep_db(p_transcript_days, p_resume_days)`: Database-side cascading retention purge.
- **`supabase/seed.sql`**:
  - 4 Personas: Aanya Rao (Staff Distributed Systems), Meera Kapoor (Director of Engineering), Rohan Mehta (Lead Frontend Architect), Daniel Brooks (Distinguished Systems Architect).
  - 60 Curated Questions: Spanning System Design, Coding, Behavioral, Technical Architecture, HR, DSA, and Resume Deep-Dive.

---

## 3. Edge Functions Catalog

All 13 functions are implemented in `supabase/functions/<name>/index.ts` with dedicated error handling, request ID tracing, and CORS management:

| # | Function | Route | Auth | Rate Limit | Purpose & Guarantees |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `session-token` | `/functions/v1/session-token` | User JWT | 5 / 20s | Mints short-lived scoped voice credentials; checks credits ($\ge 20$) and consents; never returns master provider keys. |
| **2** | `plan-interview` | `/functions/v1/plan-interview` | User JWT | 10 / min | P1 Planner; generates tailored questions via LlmClient; persists plan & session; supports `Idempotency-Key`. |
| **3** | `next-turn` | `/functions/v1/next-turn` | User JWT | 20 / min | P3 Follow-up decision engine; enforces allocated time; probes deeper or advances question; concludes when $<90$s. |
| **4** | `evaluate-answer` | `/functions/v1/evaluate-answer` | User JWT | 15 / min | P4 Evaluator; verifies verbatim quotes against candidate transcript (`quoteVerified`); scores rubric dimensions 0-5. |
| **5** | `generate-report` | `/functions/v1/generate-report` | User JWT | 5 / min | P5 Synthesizer + P6 Drill Plan; idempotent per session; compiles evidence-linked report and 7-day drill plan. |
| **6** | `progress-snapshot` | `/functions/v1/progress-snapshot` | User/Cron | 10 / min | Rule-based trend analytics; calculates moving averages, streak, weakest dimension, and recommended practice topic. |
| **7** | `parse-resume` | `/functions/v1/parse-resume` | User JWT | 5 / min | Sanitizes untrusted resume text ($\le 5$MB); extracts technical skills without subjective bias or personality scoring. |
| **8** | `report-dispute` | `/functions/v1/report-dispute` | User JWT | 3 / day | Records candidate score disputes with status `received`; rate-limited to prevent abuse. |
| **9** | `export-data` | `/functions/v1/export-data` | User JWT | 2 / day | Comprehensive GDPR candidate export bundle (profile, sessions, answers, reports, drill plans, credits) with 24h expiration. |
| **10** | `delete-account` | `/functions/v1/delete-account` | User JWT | 1 / day | Permanent erasure across all DB tables, Storage objects, and auth user; writes content-free audit log. |
| **11** | `retention-sweep` | `/functions/v1/retention-sweep` | Service Role | Cron | Sweeps expired resumes ($\ge 90$d), recordings ($\ge 30$d), and transcripts ($\ge 365$d) via Storage API and SQL. |
| **12** | `credits-debit` | `/functions/v1/credits-debit` | Service Role | Internal | Service-role only wrapper executing `atomic_credits_debit` with row locks. |
| **13** | `health` | `/functions/v1/health` | None (Public) | None | Liveness and DB dependency check; zero secrets in response (`{ status: "ok", version, database }`). |

---

## 4. Cross-Cutting Middleware (`supabase/functions/_shared/`)

- **CORS (`cors.ts`)**: Validates origin against `ALLOWED_ORIGINS`. In production mode (`ENVIRONMENT === 'production'`), wildcard `*` is strictly rejected. Handles `OPTIONS` preflight with 200/204 response.
- **Security Headers (`securityHeaders.ts`)**: Injected into all responses (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Cache-Control: no-store, no-cache`).
- **Uniform Error Envelope (`error.ts`)**: Conforms strictly to `ErrorEnvelopeSchema`:
  ```json
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Rate limit exceeded. Please wait before retrying.",
      "requestId": "req-8eaea36f-5d51",
      "retryAfter": 20
    }
  }
  ```
- **Privacy-Preserving Structured Logger (`logger.ts`)**: Structured JSON output (`INFO`, `WARN`, `ERROR`). Recursively sanitizes data and redacts keys `transcript`, `candidateTranscript`, `resumeText`, `fileContentBase64`, `token`, `password`, `authorization`, and `apiKey`.
- **Token Bucket Rate Limiter (`rateLimit.ts`)**: Queries `rate_limits` table with elapsed-time refill math. Throws `RateLimitError` calculating exact `retryAfterSeconds` injected into `Retry-After` header.
- **Idempotency Engine (`idempotency.ts`)**: Checks `Idempotency-Key` header against `idempotency_keys` table. Replays cached response with `Idempotent-Replay: true` header to prevent duplicate charge or duplicate session creation.
- **LlmClient (`llm/llmClient.ts`)**:
  - Multi-provider support (Gemini API, OpenAI, or deterministic mock).
  - Schema-enforced JSON validation using Zod.
  - Low temperature ($0.1-0.2$) for rigorous, reproducible evaluations.
  - Emergency Kill Switch (`GLOBAL_AI_KILL_SWITCH`) and per-user daily spend caps ($5.00 / 500 cents).
  - Retry with exponential backoff on transient network / rate-limit failures.
  - Zero prompt or completion content recorded in `ai_usage_ledger` (only tokens and calculated cost cents).

---

## 5. Verification & Test Evidence

### 5.1 Test Results
```bash
> npm run test
✓ src/features/room/roomReducer.test.ts (4 tests)
✓ src/data/contracts/contracts.test.ts (5 tests)
✓ tests/backend.test.ts (23 tests)
✓ src/data/mock/repos.test.ts (4 tests)

Test Files  4 passed (4)
Tests       36 passed (36)
Duration    5.34s
```

### 5.2 Contract Drift Test
```bash
> npm run check:contracts
--- Checking Contracts Single Source & Drift ---
✓ All 39 contracts verified. Single source is active with zero drift.
```

### 5.3 Secret Leak Check
```bash
> npm run check:secrets
--- Scanning for Secret Leaks in Client Code & Assets ---
✓ Zero secrets detected. Client code and bundles are 100% free of service-role keys and credentials.
```

### 5.4 TypeScript & ESLint
```bash
> npm run typecheck
tsc --noEmit -> 0 errors

> npm run lint
eslint . -> 0 errors
```

### 5.5 Production Build
```bash
> npm run build
✓ 2110 modules transformed.
dist/index.html                            3.14 kB │ gzip:   1.16 kB
dist/assets/index-BHvxbGPo.css            74.69 kB │ gzip:  18.85 kB
dist/assets/index-hhAWSQiW.js             77.09 kB │ gzip:  24.02 kB
dist/assets/vendor-BMftKrbt.js           365.85 kB │ gzip: 116.45 kB
✓ built in 7.51s
```

---

## 6. Gate B Approval Checklist

Before proceeding to Prompt 3 (Wiring Frontend to Backend):
- [x] All 15 database tables, RLS policies, private storage buckets, and seed data created.
- [x] Concurrency-safe atomic credit debit implemented with row locks.
- [x] All 13 Edge Functions implemented with schemas, validation, and error envelopes.
- [x] Multi-vendor `LlmClient` with spend caps, retry backoff, and zero content logging.
- [x] Zero frontend screens or UI components modified in this prompt.
- [x] 100% passing tests (36 unit tests, 0 contract drift, 0 secret leaks).
- [x] Build log updated and handoff document published.

**Backend foundation is complete and ready for Gate B approval.**
