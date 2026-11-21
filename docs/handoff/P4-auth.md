# Gate C Handoff — Authentication & Security System

**Platform**: PrepSphere  
**Phase**: Prompt 4 (Authentication)  
**Status**: Completed & Verified for Gate C  
**Date**: 2026-11-21  

---

## 1. Executive Summary & Gate C Status

This document records the complete, production-grade authentication implementation for PrepSphere. `MockAuthRepo` has been paired with `SupabaseAuthRepo` behind the unified `AuthRepo` interface, selectable via `VITE_DATA_SOURCE=supabase` or the Settings backend switcher, while preserving 100% of Prompt 1 screens, typography, tokens, and components.

### Non-Negotiables & Security Compliance Audit
| Rule / Principle | Status | Implementation Details & Proof |
| :--- | :---: | :--- |
| **Unified Auth Interface** | **COMPLIED** | Both `MockAuthRepo` and `SupabaseAuthRepo` implement `AuthRepo` (`src/data/repos/interfaces.ts`). Dynamically bound in `src/data/index.ts`. |
| **PKCE Flow & Safe Tokens** | **COMPLIED** | Supabase client configured with `flowType: 'pkce'`. Only default `supabase-js` token storage is used. No tokens are logged or custom-stored. |
| **Zero Service-Role Leaks** | **COMPLIED** | `npm run check:secrets` scans all client bundles, source code, and env files. Zero leaks verified. |
| **User Enumeration Defense** | **COMPLIED** | `authErrorMapper.ts` and `LoginPage.tsx` provide identical candidate messaging and timing for wrong passwords vs non-existent accounts. |
| **Password Policy (10+ Chars)** | **COMPLIED** | Minimum length of 10 characters enforced across frontend forms and backend validation. No composition theatrics; strength feedback provided. |
| **Rate Limit Countdown UI** | **COMPLIED** | Supabase 429 and `over_email_send_rate_limit` errors parse retry cooldown seconds and render an active countdown timer on the submit button. |
| **Scoped Sign Out** | **COMPLIED** | Supports `signOut({ scope: 'others' })` to revoke all other active candidate sessions while keeping the current session alive. |
| **Typed Account Erasure** | **COMPLIED** | Account and data deletion requires candidate to explicitly type `"DELETE"` before triggering the irreversible purge. |
| **Age Declaration & Consents** | **COMPLIED** | Signup mandates 18+ age declaration and records versioned consents (`terms`, `privacy`, `recording`, `resume_processing`, `analytics`) into `public.consents`. |
| **Route Protection & Drafts** | **COMPLIED** | `<ProtectedRoute>` preserves intended destination via `?redirectTo=...`. `<SessionExpiredDialog>` preserves interview drafts to `localStorage`. |
| **Onboarding Gate** | **COMPLIED** | Authenticated new users with pending onboarding are gated and redirected to `/onboarding`. |
| **Test Suite Verification** | **COMPLIED** | 10 test suites (113 tests) pass at 100%. Contract check (39 schemas) and secret scan pass cleanly. |

---

## 2. Authentication Architecture & Flow Matrix

### 2.1 Repository Architecture
All authentication operations pass through `src/data/repos/interfaces.ts`:

```typescript
export interface AuthRepo {
  getUser(): Promise<Profile | null>;
  signIn(email: string, password?: string): Promise<Profile>;
  signUp(name: string, email: string, password?: string): Promise<Profile>;
  signOut(options?: { scope?: 'global' | 'local' | 'others' }): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signInWithOAuth?(provider: 'google' | 'github'): Promise<void>;
  updatePassword?(newPassword: string): Promise<void>;
  updateEmail?(newEmail: string): Promise<void>;
  deleteAccount?(confirmation: string): Promise<void>;
  recordConsent?(kind: 'terms' | 'privacy' | 'recording' | 'resume_processing' | 'analytics', granted: boolean): Promise<void>;
}
```

- In **Demo Mode** (`VITE_DATA_SOURCE=mock`), `MockAuthRepo` operates in-memory with local storage persistence and simulation delays.
- In **Supabase Mode** (`VITE_DATA_SOURCE=supabase`), `SupabaseAuthRepo` delegates to `supabase.auth` and PostgreSQL tables.

### 2.2 Auth Flows Matrix
| Flow | Endpoint / Method | Behavior & Security Handling |
| :--- | :--- | :--- |
| **Email + Password Sign In** | `supabase.auth.signInWithPassword` | Validates credentials; errors mapped through `mapAuthError` to suppress account existence details. |
| **Magic Link Sign In** | `supabase.auth.signInWithOtp` | PKCE flow with single-use magic link. Redirects to `/app` upon email link tap. |
| **Google OAuth** | `supabase.auth.signInWithOAuth` | Native OAuth redirect with PKCE; supports web origin and deep link redirects. |
| **Email Verification** | `supabase.auth.signUp` | Sends branded verification email. Unverified logins trigger friendly prompt. |
| **Password Reset** | `supabase.auth.resetPasswordForEmail` | Uniform response: always confirms link dispatched regardless of whether email exists. |
| **Sign Out (Scoped)** | `supabase.auth.signOut({ scope })` | Supports `'global'`, `'local'`, and `'others'` (revokes other active sessions in Settings). |
| **Change Password** | `supabase.auth.updateUser` | Requires minimum 10 characters. Re-authenticates session. |
| **Change Email** | `supabase.auth.updateUser` | Sends verification link to new email address before updating. |
| **Account Deletion** | `deleteAccount('DELETE')` | Hard check for `"DELETE"`. Deletes candidate `profiles` row; PostgreSQL foreign key cascades wipe sessions, recordings, transcripts, and drill plans. |

---

## 3. Security Rules & Error Handling

### 3.1 User Enumeration Defense (`src/shared/auth/authErrorMapper.ts`)
Standardizes all responses from authentication endpoints:
- `"Invalid login credentials"` and `"User not found"` both resolve to:
  > *"Invalid email or password. Please verify your credentials or sign in with a magic link."*
- Password reset attempts always display:
  > *"If an account matching this email exists, instructions to set a new password have been sent. Check your inbox and spam folder."*

### 3.2 Password Policy & Strength
- **Minimum Length**: 10 characters enforced across frontend forms and validation schemas.
- **No Composition Theatrics**: No arbitrary uppercase/lowercase/punctuation requirements that degrade UX without improving entropy.
- **Strength Feedback**: Dynamic visual indicator with length feedback and compromised passphrase detection warnings.

### 3.3 Rate Limiting with Countdown Timer
When Supabase returns a 429 status or `over_email_send_rate_limit`:
- The error mapper parses the cooldown duration (e.g., 60 seconds).
- `LoginPage.tsx` starts a live interval timer, disabling submit buttons and presenting a friendly countdown: `Wait 45s`.

### 3.4 Email & Domain Authentication (SPF, DKIM, DMARC)
Full reference documented in [`docs/reference/email-templates.md`](file:///d:/platform/docs/reference/email-templates.md):
- Branded dark-mode responsive HTML templates + plain-text alternates for Verification, Magic Link, and Password Reset.
- SPF: `v=spf1 include:resend.net include:amazonses.com ~all`
- DKIM: Dual 2048-bit CNAME key rotation (`resend1._domainkey.prepsphere.io`).
- DMARC: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@prepsphere.io`.

---

## 4. User Experience & Route Protection

### 4.1 Route Guard (`<ProtectedRoute>`)
- Gated routes: `/app`, `/app/interview/*`, `/app/practice`, `/app/history`, `/app/reports/*`, `/app/settings`, `/app/credits`.
- If unauthenticated in Supabase mode: redirects to `/login?redirectTo=${encodeURIComponent(target)}`.
- Upon successful sign-in: `LoginPage.tsx` reads `redirectTo` and restores candidate's original destination.

### 4.2 Onboarding Gate
- Checks `profile.onboardingCompleted`. If `false` for an authenticated user, automatically redirects to `/onboarding` to customize target role, seniority, and initial drill calibration.

### 4.3 Session Expiration & Draft Preservation (`<SessionExpiredDialog>`)
- Injected at `AppLayout` root.
- Listens for auth state expiration (`SIGNED_OUT` or token refresh failures).
- Automatically saves candidate's in-progress interview configuration from wizard state to `localStorage.setItem('prepsphere_draft_setup', ...)`.
- Prompts candidate with "Sign In to Resume" action.

---

## 5. Verification Test Suite Results

### 5.1 Automated Test Execution Summary
```
 RUN  v2.1.9 D:/platform

 ✓ tests/db-security-rls.test.ts (26 tests)
 ✓ src/features/room/roomReducer.test.ts (4 tests)
 ✓ tests/auth-error-mapper.test.ts (11 tests)
 ✓ src/data/contracts/contracts.test.ts (5 tests)
 ✓ tests/gemini-service.test.ts (9 tests)
 ✓ tests/backend.test.ts (23 tests)
 ✓ tests/voice-system.test.ts (12 tests)
 ✓ tests/supabase-auth.test.ts (9 tests)
 ✓ tests/auth-flows.test.ts (10 tests)
 ✓ src/data/mock/repos.test.ts (4 tests)

 Test Files  10 passed (10)
      Tests  113 passed (113)
```

### 5.2 Contract Drift & Secrets Audit
- **`npm run check:contracts`**: 39 of 39 entity and edge function schemas verified with zero drift.
- **`npm run check:secrets`**: Zero leaks detected across client source files, configurations, and build artifacts.
- **`npm run typecheck`**: Clean TypeScript compilation with 0 errors.

---

## 6. Gate C Sign-Off & Verification Evidence

### Gate C Operational Checklist
- [x] Create real candidate account (Email + password with 10+ characters, 18+ age declaration, versioned consents).
- [x] Sign out (Global, local, and revocation of other sessions).
- [x] Sign back in (Password and Magic Link verification).
- [x] Reset password flow preserves user enumeration defense.
- [x] Account deletion guarded by explicit `"DELETE"` typed confirmation; cascades removal of all associated rows.
- [x] Automated test suites covering mapper, flows, client configuration, and contracts pass 100%.

**Prompt 4 Gate C Status**: **PASSED & COMPLETE**
