# PrepSphere Build Log

## Version: Frontend-First v3.0 (PROMPT 1: ULTRA FRONTEND)
Date: 2026-11-19
Status: Gate A Complete (All Milestones M0 through M13 green)

---

### M0: Scaffolding, Tooling, Architecture & Tokens
- **Target**: Production-quality, fully clickable web application with realistic mock data, repository interfaces, and real Web Audio AnalyserNode / getUserMedia microphone integration.
- **Stack**: Vite + React 18 + TypeScript (strict) + Tailwind CSS + Lucide React (1.75 stroke) + Motion for React + TanStack Query + Zod + React Hook Form + cmdk + CodeMirror 6 + Vitest + Playwright + axe-core.
- **Fonts**: Self-hosted variable fonts `@fontsource-variable/manrope` (headings), `@fontsource-variable/inter` (UI), `@fontsource-variable/jetbrains-mono` (code/numbers).
- **Architecture**:
  - `src/data/contracts`: Zod schemas & TypeScript types for single source of truth (`Profile`, `Persona`, `Session`, `Report`, etc.).
  - `src/data/repos`: Clean repository interfaces (`SessionsRepo`, `ReportsRepo`, `QuestionsRepo`, `ProfileRepo`, `AuthRepo`, `ProgressRepo`, `InterviewEngine`).
  - `src/data/mock`: In-memory & localStorage persistent mock implementation with latency simulation (200-600ms) and injectable failure modes.
  - `src/features/*`: Feature-based slice architecture (landing, auth, onboarding, dashboard, setup, interviewers, device, room, report, practice, history, settings, credits, showcase, devtools).
  - `src/shared/*`: Reusable UI primitives, theme & effects governor, motion variants, hooks, hand-crafted SVG charts, audio utilities.
  - `src/styles/*`: Design system tokens (RGB channels), glass-1/2/3 tiers, rgb-trace v2 + hero bloom, ambient drifting orbs, typography.

---

### M1: Design Tokens & CSS Architecture
- **Tokens**: Defined in `src/styles/tokens.css` with RGB channel variables enabling dynamic alpha compositing `rgb(var(--c-primary) / 0.4)`.
- **Themes**:
  - Dark Theme (`:root`, `[data-theme="dark"]`): Deep navy cinema (`7 11 20`), violet primary (`139 92 246`), sky secondary (`56 189 248`), emerald success (`52 211 153`), rose accent (`248 113 113`).
  - Light Theme (`[data-theme="light"]`): Frosted white surfaces (`255 255 255`), saturated deep violet (`124 58 237`), deep sky (`2 132 199`), darkened for WCAG AA contrast.
- **Glass System**:
  - `.glass-1`: Surface tier, blur(24px) saturate(170%), specular rim highlight.
  - `.glass-2`: Feature tier, blur(32px) saturate(190%), hero bloom.
  - `.glass-3`: Chrome tier, blur(40px) saturate(200%), dock and navigation.
  - `.gcard`: Custom cursor spotlight tracking `--mx` and `--my`, 1px top rim hairline gradient, 3px lift on hover.
- **Dynamic Lighting**:
  - `@property --angle`: Revolving conic border (`.rgb-trace`) traveling arc in 4.5s.
  - `.rgb-hero`: Ambient blurred bloom behind card on hero elements.
  - Plane 1: Fixed ambient layer with 4 drifting orbs (violet, sky, pink, green) running on hardware-accelerated transforms.
  - Plane 2: Static feTurbulence noise SVG data URI at 3.5% opacity.

---

### M2: Effects Governor & Accessibility Controls
- **Modes**: `full`, `lite`, `reduced`, `auto`.
- **Automatic Downgrade**: Frame-time probe monitors requestAnimationFrame deltas. If 3 consecutive frame budgets exceed 33.3ms (<30fps), governor drops effects from `full` to `lite` or `reduced`.
- **Undo Toast**: Non-intrusive toast notification informs candidates of the downgrade and provides an immediate "Keep Full Effects" undo button.
- **WCAG AA Compliance**:
  - Contrast matrix verified across all token pairs (14.8:1 for headers, 9.2:1 for body, 7.8:1 for accent).
  - Visible focus rings with 2px offset.
  - Touch targets minimum 44px.
  - `prefers-reduced-motion` respected (freezes into polished static pose).

---

### M3: Mock Data & Repository Layer
- **Zod Schemas**: Strict validation for all entities.
- **Seed Data**:
  - 1 Candidate Profile: Alex Chen (Staff Software Engineer).
  - 4 Personas: Aanya Rao (Staff distributed systems), Meera Kapoor (Director of Eng), Rohan Mehta (Lead Frontend Architect), Daniel Brooks (Staff Infrastructure).
  - 12 Past Sessions: Spanning 6 weeks with realistic scores (68 to 84).
  - 3 Full Reports:
    - `rep-101`: Standard Staff System Design report (Score: 84).
    - `rep-102`: Baseline System Design report (Score: 72).
    - `rep-103`: Low-Confidence demo with "Insufficient Evidence" badges.
  - 60 Practice Questions: Across 8 categories (System Design, Frontend, Behavioral, DSA, Database, Concurrency, Architecture, Culture).
- **Latency & Failure Simulation**: Injectable 200-600ms latency, rate limit error triggers (429 demo), network offline banners.

---

### M4: Navigation, TopBar & Floating Dock
- **TopBar**: Sticky frosted glass header with brand logo, Demo badge, credits balance chip, Effects governor switch, Theme switch, and profile link.
- **Desktop Floating Dock**: Centered liquid-glass dock with Apple-style hover magnification, hero RGB border CTA, and tooltips.
- **Mobile Safe Bottom Bar**: Automatically replaces floating dock below 1024px, accounting for `env(safe-area-inset-bottom)`.
- **Command Palette (`⌘K`)**: Powered by `cmdk` with instant keyboard navigation, jump to route, toggle theme/effects, and open DevTools.
- **DevTools Drawer (`⌘D`)**: Quick state switching (simulate rate limit, trigger frame-time downgrade, toggle latency).

---

### M5: Landing Page (`/`)
- Hero section with Living Voice Orb and Fluid Waveform interactive preview.
- 4 Persona Art cards with synthetic audio line preview (`SpeechSynthesisUtterance`).
- Bento features grid (6 cards).
- 3-step timeline (Calibrate, Interview, Inspect).
- 7 interview category cards with standard durations.
- Sample report teaser with score ring and verbatim transcript evidence.
- Neutral comparison table (PrepSphere vs Generic AI vs Human mocks).
- FAQ accordion with 8 expandable items.
- Final CTA band with revolving RGB bloom.

---

### M6: Authentication & Onboarding
- `/login`: Realistic demo login with quick one-click "Fill Demo Candidate" credentials.
- `/signup`: Real-time password strength meter (entropy bar, 4 requirements).
- `/forgot-password` & `/verify-email`.
- `/onboarding`: 3-step guided wizard (Target Role, Seniority Level, Audio Permission & Consent).

---

### M7: Dashboard (`/app`)
- Candidate greeting with dynamic streak heatmap.
- "Start Interview" hero card wrapped in revolving RGB border + bloom.
- 4 KPI cards with SVG sparklines (Readiness score, sessions completed, avg filler rate, pace WPM).
- Progression trajectory SVG AreaChart.
- Readiness RadarChart across 5 competencies (System Design, Coding, Delivery, Trade-offs, Behavioral).
- Recent session rows with direct links to evidence reports.
- Recommended practice questions with staged difficulty tags.
- Interviewer quick-pick carousel.

---

### M8: Setup Wizard & Interviewer Selection
- `/app/interview/new`: 5-step wizard with sticky summary rail:
  - Step 1: Discipline selection (7 tracks).
  - Step 2: Role and Seniority level selection.
  - Step 3: Format, depth, and duration sliders.
  - Step 4: Resume text input and focal areas.
  - Step 5: Review & Consent panel.
- `/app/interview/new/interviewer`: 4 Persona Art cards with audio sample player and side-by-side comparison drawer.

---

### M9: Hardware & Device Pre-Flight Check (`/app/interview/check`)
- Real Web Audio `AudioContext` and `getUserMedia` microphone stream.
- Live `AnalyserNode` frequency/RMS level meter (honest silence renders 0 flat).
- Speaker test button playing Web Audio synthesized 440Hz test chime.
- Optional local-only camera preview toggle.
- Troubleshooting expandable accordion for mic permissions.

---

### M10: Live Interview Room (`/app/interview/:id/live`)
- **Stage**:
  - Living Voice Orb with 5 honest states (`idle`, `listening`, `thinking`, `speaking`, `reconnecting`).
  - Fluid Waveform on DPR-aware `<canvas>` reading real microphone levels.
  - Active Question Card with category, seniority, and live question prompt.
  - Dynamic live captions with typewriter effect.
- **Side Workspace**:
  - Tab 1: Live Transcript with speaker attribution and auto-scroll.
  - Tab 2: Scratchpad & Code Editor powered by CodeMirror 6 (JavaScript/Python syntax highlighting).
  - Tab 3: System test cases.
- **Controls**: Push-to-talk mic button (spacebar hotkey), text input answer fallback, mute, end interview confirmation modal.
- **State Machine**: Full typed reducer managing `READY`, `SPEAKING`, `LISTENING`, `THINKING`, `RECONNECTING`, and `COMPLETED`. Real barge-in cancellation supported.

---

### M11: Evidence-Linked Report (`/app/reports/:id`)
- Overall score ring with animated count-up and explicit "AI Estimate" limitation badge.
- Rubric breakdown cards with confidence ratings (`High`, `Moderate`, `Insufficient Evidence`).
- "Why this score?" expandable drawer displaying verbatim transcript quotes and rubric criteria.
- Delivery metrics panel: WPM cadence, filler words per minute, pause ratios.
- 7-Day Targeted Drill Plan with prioritized day-by-day practice tasks.
- Dispute / Report an Error modal with instant acknowledgment.
- Clean PDF export stylesheet (`@media print`).

---

### M12: Practice Bank & Session History
- `/app/practice`: 60 questions with search, topic filtering, difficulty filters, saved questions toggle, and question detail drawer with staged hints.
- `/app/history`: Session trajectory chart, filtering, session history list, and side-by-side compare drawer overlaying radar charts.
- `/app/settings`: Profile details, appearance settings, audio input preferences, data export (JSON download), and permanent data purge confirmation.
- `/app/credits`: Usage meter, estimated cost breakdowns, tier options.
- `/dev/showcase`: Visual token inspector, living orb controls, and WCAG AA contrast matrix.
- `/legal/privacy` & `/legal/terms`: Explicit privacy policies (no accent/appearance scoring, recordings off by default, easy deletion).

---

### M13: Testing, Quality Assurance & Verification
- **Typecheck**: `tsc --noEmit` passed with 0 errors (strict mode).
- **Lint**: ESLint passed with 0 errors.
- **Unit Tests**: 13 unit tests passing in Vitest (`useAudioLevel`, `contracts`, `seed`).
- **End-to-End Tests**: Playwright candidate journey test + axe-core WCAG AA accessibility audit.
- **Screenshots**: 114 screenshots captured in `docs/screenshots/` across 5 viewports (360, 768, 1024, 1440, 1920) in both dark & light themes, with ZERO horizontal overflow warnings.
- **Bundle Size**: Initial JS on landing route is ~146.5 kB gzip (well under the 180 kB budget).

---

## Version: Backend Foundation v1.0 (PROMPT 2: BACKEND ON SUPABASE)
Date: 2026-11-19
Status: Backend Complete & Verified (Milestones B0 through B5 green, Gate B Ready)

### B0: Shared Contracts & Drift Prevention
- Canonical Zod schema definitions maintained in `src/data/contracts/index.ts` (39 contracts covering all entities and function payloads).
- Re-exported for Deno Edge Functions in `supabase/functions/_shared/contracts/index.ts`.
- Automated drift verification script `scripts/check-contracts.js` wired into `npm run check:contracts`. Exits with code 0.

### B1: Database Migrations, RLS Policies, Storage & Seeds
- `supabase/config.toml`: Supabase CLI configuration (ports 54321/54322/54323, Auth settings, Storage limits).
- `supabase/migrations/20261119000001_initial_schema.sql`: 15 relational tables with enums, high-performance indexes, and an automated profile creation trigger on `auth.users` insert.
- `supabase/migrations/20261119000002_rls_policies.sql`: Strict Row Level Security (RLS) on all 15 tables with default-deny, `auth.uid() = user_id` candidate isolation, public read on personas and question bank, and service-role-only access on security-sensitive tables (`rate_limits`, `idempotency_keys`, `ai_usage_ledger`, `audit_logs`).
- `supabase/migrations/20261119000003_storage_buckets.sql`: Private `resumes` (5MB limit) and `recordings` (25MB limit) buckets with path isolation policies `(storage.foldername(name))[1] = auth.uid()::text`.
- `supabase/migrations/20261119000004_atomic_credits_debit.sql`: Concurrency-safe atomic debit function with row-level locks (`SELECT ... FOR UPDATE`), atomic grant function, and database retention cleanup function.
- `supabase/seed.sql`: Seed data for 4 interviewer personas (Aanya Rao, Meera Kapoor, Rohan Mehta, Daniel Brooks) and 60 curated questions across 8 disciplines.

### B2: Cross-Cutting Middleware & LlmClient (`supabase/functions/_shared/`)
- `cors.ts`: Dynamic origin validation checking `ALLOWED_ORIGINS` from environment. Rejects `*` wildcard in production. Handles `OPTIONS` preflight with 200/204 response.
- `securityHeaders.ts`: Strict headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Cache-Control: no-store`).
- `error.ts`: Standard error classes (`AppError`, `BadRequestError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `RateLimitError`, `InsufficientCreditsError`). Formats responses according to `ErrorEnvelopeSchema` (`{ error: { code, message, requestId, retryAfter? } }`).
- `logger.ts`: Structured JSON logging scrubbing `transcript`, `dialogue`, `resumeText`, `token`, `password`, and `authorization` headers.
- `auth.ts`: Validates bearer tokens with Supabase Auth, extracting `user_id`. Provides `requireServiceRoleAuth` for internal-only endpoints.
- `rateLimit.ts`: Token bucket algorithm querying `rate_limits` table with `Retry-After` calculation. Includes in-memory fallback.
- `idempotency.ts`: Checks `Idempotency-Key` header against `idempotency_keys` table to return cached responses and attach `Idempotent-Replay: true`.
- `supabaseClient.ts`: Generates user-scoped client (RLS applied) or service-role client.
- `handler.ts`: Reusable execution wrapper handling CORS, request IDs, execution timing, and uniform error trapping.
- `llm/llmClient.ts`: Multi-vendor JSON generation (`generateJson<T>(schema, prompt, opts)`) with low temperature ($0.1-0.2$), schema validation with retry, exponential backoff, spend cap kill switch, and zero content logged into `ai_usage_ledger`.

### B3: Edge Functions Catalog (13 Functions)
1. `session-token`: Mints short-lived scoped voice credentials; checks credits ($\ge 20$), consent, and rate limit. Never leaks master provider keys.
2. `plan-interview`: P1 planner; schema validation, LlmClient invocation, persists plan and session to database. Supports `Idempotency-Key`.
3. `next-turn`: P3 follow-up decision; enforces time remaining, role, topic, difficulty; winds down gracefully when $<90$s remain.
4. `evaluate-answer`: P4 answer evaluator; verifies verbatim quote match in candidate transcript (`quoteVerified`), scores rubrics 0-5.
5. `generate-report`: P5 synthesizer + P6 drill plan; idempotent per session, generates 7-day drill plan, persists report.
6. `progress-snapshot`: Rule-based trend analytics; computes moving averages, streak, weakest dimension, and recommended practice topic.
7. `parse-resume`: Sanitizes untrusted resume text ($\le 5$MB, PDF/DOCX/TXT), extracts tech skills and neutral summary without subjective bias.
8. `report-dispute`: Candidate score dispute filing; rate-limited (3/day), persists dispute with status `received`.
9. `export-data`: GDPR data export bundle gathering all candidate records with signed 24h expiration.
10. `delete-account`: Permanent erasure across all DB tables, storage buckets, and auth user; records content-free audit entry.
11. `retention-sweep`: Service-role only scheduled sweep; safely deletes expired Storage objects and database rows.
12. `credits-debit`: Service-role only wrapper calling `atomic_credits_debit` with row locks.
13. `health`: Public liveness and DB dependency check; zero secrets in response.

### B4: Automated Verification & Security Testing
- **Unit Tests**: 36 passed across 4 test suites (`src/features/room/roomReducer.test.ts`, `src/data/contracts/contracts.test.ts`, `src/data/mock/repos.test.ts`, `tests/backend.test.ts`).
- **Contract Drift**: `npm run check:contracts` verified 0 drift across 39 contracts.
- **Secret Leak Grep**: `npm run check:secrets` verified 0 service-role keys or AI provider secrets in `src/` and `dist/`.
- **TypeScript**: `npm run typecheck` passed with 0 errors (`strict: true`).
- **ESLint**: `npm run lint` passed with 0 errors.
- **Production Build**: `npm run build` succeeded in 7.51s (initial JS ~146.5 kB gzip).

