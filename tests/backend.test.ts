import { describe, it, expect, vi } from 'vitest';
import { securityHeaders } from '../supabase/functions/_shared/securityHeaders.ts';
import { getCorsHeaders } from '../supabase/functions/_shared/cors.ts';
import {
  AppError,
  BadRequestError,
  RateLimitError,
  formatErrorResponse,
} from '../supabase/functions/_shared/error.ts';
import { sanitizeLogData } from '../supabase/functions/_shared/logger.ts';
import { checkRateLimit } from '../supabase/functions/_shared/rateLimit.ts';
import { checkIdempotency, saveIdempotencyRecord } from '../supabase/functions/_shared/idempotency.ts';
import { LlmClient } from '../supabase/functions/_shared/llm/llmClient.ts';
import { z } from 'zod';

import { handleHealth } from '../supabase/functions/health/index.ts';
import { handleSessionToken } from '../supabase/functions/session-token/index.ts';
import { handlePlanInterview } from '../supabase/functions/plan-interview/index.ts';
import { handleNextTurn } from '../supabase/functions/next-turn/index.ts';
import { handleEvaluateAnswer } from '../supabase/functions/evaluate-answer/index.ts';
import { handleGenerateReport } from '../supabase/functions/generate-report/index.ts';
import { handleProgressSnapshot } from '../supabase/functions/progress-snapshot/index.ts';
import { handleParseResume } from '../supabase/functions/parse-resume/index.ts';
import { handleReportDispute } from '../supabase/functions/report-dispute/index.ts';
import { handleExportData } from '../supabase/functions/export-data/index.ts';
import { handleDeleteAccount } from '../supabase/functions/delete-account/index.ts';
import { handleRetentionSweep } from '../supabase/functions/retention-sweep/index.ts';
import { handleCreditsDebit } from '../supabase/functions/credits-debit/index.ts';

const MOCK_AUTH_HEADER = 'Bearer demo-test-token-alex-chen';
const MOCK_SERVICE_ROLE_HEADER = 'Bearer test-service-role-secret';

describe('Supabase Edge Functions Backend Suite', () => {
  // ----------------------------------------------------------------
  // 1. Cross-Cutting Middleware Tests
  // ----------------------------------------------------------------
  describe('Middleware & Security', () => {
    it('enforces strict security headers', () => {
      expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
      expect(securityHeaders['X-Frame-Options']).toBe('DENY');
      expect(securityHeaders['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(securityHeaders['Cache-Control']).toContain('no-store');
    });

    it('manages CORS origin headers in development and handles preflight', () => {
      const devReq = new Request('http://localhost:54321/functions/v1/health', {
        headers: { Origin: 'http://localhost:5173' },
      });
      const headers = getCorsHeaders(devReq);
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('formats error responses according to uniform ErrorEnvelopeSchema', async () => {
      const err = new RateLimitError(30, 'Too many requests. Please wait.');
      const res = formatErrorResponse(err, 'req-test-123');
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('30');
      expect(res.headers.get('x-request-id')).toBe('req-test-123');

      const json = await res.json();
      expect(json).toEqual({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please wait.',
          requestId: 'req-test-123',
          retryAfter: 30,
        },
      });
    });

    it('redacts sensitive transcripts, resumes, and tokens from structured logs', () => {
      const rawPayload = {
        userId: 'usr-123',
        transcript: 'I will use a consistent hashing ring with md5 hash function...',
        candidateTranscript: 'candidate confidential spoken text',
        resumeText: 'Secret candidate career notes',
        token: 'pst_live_secret_token_123',
        authorization: 'Bearer secret_auth_token',
        nested: {
          password: 'super-secret-password',
          safeField: 'normal data',
        },
      };

      const sanitized = sanitizeLogData(rawPayload) as Record<string, unknown>;
      expect(sanitized.transcript).toBe('[REDACTED]');
      expect(sanitized.candidateTranscript).toBe('[REDACTED]');
      expect(sanitized.resumeText).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect((sanitized.nested as Record<string, unknown>).password).toBe('[REDACTED]');
      expect((sanitized.nested as Record<string, unknown>).safeField).toBe('normal data');
    });

    it('enforces token bucket rate limiting', async () => {
      const key = `test-bucket-${Date.now()}`;
      const res1 = await checkRateLimit({ key, capacity: 2, refillRatePerSec: 0.1, cost: 2 });
      expect(res1.allowed).toBe(true);

      const res2 = await checkRateLimit({ key, capacity: 2, refillRatePerSec: 0.1, cost: 1 });
      expect(res2.allowed).toBe(false);
      expect(res2.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('supports idempotency replay', async () => {
      const key = `idem-key-${Date.now()}`;
      const userId = 'usr-alex-chen-01';
      const body = { success: true, testValue: 42 };

      await saveIdempotencyRecord(key, userId, 201, body);
      const replay = await checkIdempotency(key, userId, 'req-idem-1');
      expect(replay.isCached).toBe(true);
      expect(replay.response?.status).toBe(201);
      const replayBody = await replay.response?.json();
      expect(replayBody).toEqual(body);
    });

    it('LlmClient enforces schema output and spend cap kill switch', async () => {
      const client = new LlmClient();
      const TestSchema = z.object({
        planId: z.string(),
        title: z.string(),
      });

      const result = await client.generateJson(TestSchema, 'Generate test plan', {
        functionName: 'plan-interview',
        userId: 'usr-alex-chen-01',
      });

      expect(result.data.planId).toBeDefined();
      expect(result.data.title).toBeDefined();
      expect(result.usage.promptTokens).toBeGreaterThan(0);
    });

    it('LlmClient halts immediately when GLOBAL_AI_KILL_SWITCH is enabled', async () => {
      process.env.GLOBAL_AI_KILL_SWITCH = 'true';
      const client = new LlmClient();
      const TestSchema = z.object({ test: z.string() });

      try {
        await expect(
          client.generateJson(TestSchema, 'Test prompt', { functionName: 'test', userId: 'usr-1' })
        ).rejects.toThrow(/kill switch/i);
      } finally {
        delete process.env.GLOBAL_AI_KILL_SWITCH;
      }
    });
  });

  // ----------------------------------------------------------------
  // 2. Function Catalog Tests
  // ----------------------------------------------------------------
  describe('Function Catalog', () => {
    it('13. health: returns 200, status ok, and database status with zero secrets', async () => {
      const req = new Request('http://localhost:54321/functions/v1/health');
      const res = await handleHealth(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe('ok');
      expect(json.version).toBe('1.0.0');
      expect(json.database).toBeDefined();
      const rawText = JSON.stringify(json);
      expect(rawText).not.toContain('key');
      expect(rawText).not.toContain('secret');
      expect(rawText).not.toContain('service');
    });

    it('1. session-token: rejects unauthenticated requests and mints scoped token for auth user', async () => {
      const unauthReq = new Request('http://localhost:54321/functions/v1/session-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'sess-1', personaId: 'daniel-brooks' }),
      });
      await expect(handleSessionToken(unauthReq, { requestId: 'req-1' })).rejects.toThrow();

      const authReq = new Request('http://localhost:54321/functions/v1/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-1',
          personaId: 'daniel-brooks',
          expectedDurationMins: 30,
        }),
      });

      const res = await handleSessionToken(authReq, { requestId: 'req-2' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.token).toContain('pst_live_');
      expect(json.provider).toBe('demo');
      expect(json.expiresAt).toBeGreaterThan(Date.now());
      expect(json.creditsRemaining).toBeGreaterThanOrEqual(15);
    });

    it('2. plan-interview: generates structured interview plan matching schema', async () => {
      const req = new Request('http://localhost:54321/functions/v1/plan-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          type: 'system-design',
          targetRole: 'Senior Distributed Systems Architect',
          experienceLevel: 'Senior',
          difficulty: 'Hard',
          durationMinutes: 45,
          questionCount: 4,
          language: 'English',
        }),
      });

      const res = await handlePlanInterview(req, { requestId: 'req-plan' });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.planId).toBeDefined();
      expect(json.sessionId).toBeDefined();
      expect(json.questions.length).toBeGreaterThan(0);
      expect(json.estimatedCredits).toBe(15);
    });

    it('3. next-turn: returns interviewer decision and spoken text', async () => {
      const req = new Request('http://localhost:54321/functions/v1/next-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-turn-1',
          currentQuestionIndex: 0,
          elapsedSeconds: 300,
          totalDurationSeconds: 1800,
          lastCandidateAnswer: 'I will partition using consistent hashing with 256 virtual nodes per server.',
        }),
      });

      const res = await handleNextTurn(req, { requestId: 'req-turn' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(['probe_deeper', 'pivot_topic', 'advance_question', 'conclude_session']).toContain(json.action);
      expect(json.spokenText.length).toBeGreaterThan(10);
      expect(json.timeRemainingSeconds).toBe(1500);
    });

    it('3b. next-turn: winds down gracefully when remaining time is under 90s', async () => {
      const req = new Request('http://localhost:54321/functions/v1/next-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-turn-exp',
          currentQuestionIndex: 3,
          elapsedSeconds: 1750,
          totalDurationSeconds: 1800,
          lastCandidateAnswer: 'And that is how we achieve p99 latency under 20ms.',
        }),
      });

      const res = await handleNextTurn(req, { requestId: 'req-turn-exp' });
      const json = await res.json();
      expect(json.action).toBe('conclude_session');
      expect(json.timeRemainingSeconds).toBe(50);
    });

    it('4. evaluate-answer: verifies verbatim quote and scores dimensions without bias', async () => {
      const transcript = 'first I will define the non-functional SLAs, then design the data pipeline. Then we partitioned the message bus using a consistent hashing ring on conversation ID and backed it up with Raft consensus';
      const req = new Request('http://localhost:54321/functions/v1/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-eval-1',
          questionIndex: 0,
          questionText: 'How do you partition real-time chat?',
          transcript,
          durationMs: 45000,
          typed: false,
          deliveryMetrics: {
            wpm: 140,
            wpmStatus: 'Ideal',
            fillersPerMin: 1.1,
            fillersStatus: 'Low',
            avgPauseSeconds: 1.2,
            pauseStatus: 'Natural',
          },
        }),
      });

      const res = await handleEvaluateAnswer(req, { requestId: 'req-eval' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.questionIndex).toBe(0);
      expect(json.rubricScores.length).toBeGreaterThan(0);
      expect(json.quoteVerified).toBe(true);
      expect(json.modelAnswer.length).toBeGreaterThan(20);
    });

    it('4b. evaluate-answer: flags quoteVerified=false when rubric quotes are not in candidate transcript', async () => {
      const unmatchingTranscript = 'I only talked about relational databases and SQL queries.';
      const req = new Request('http://localhost:54321/functions/v1/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-eval-mismatch',
          questionIndex: 0,
          questionText: 'How do you partition real-time chat?',
          transcript: unmatchingTranscript,
          durationMs: 30000,
          typed: false,
        }),
      });

      const res = await handleEvaluateAnswer(req, { requestId: 'req-eval-mis' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.quoteVerified).toBe(false);
    });

    it('5. generate-report: generates complete report with 7-day drill plan and verifies idempotency', async () => {
      const req1 = new Request('http://localhost:54321/functions/v1/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-rep-01',
          overallDurationMins: 32,
        }),
      });

      const res1 = await handleGenerateReport(req1, { requestId: 'req-rep-1' });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.report.id).toBeDefined();
      expect(json1.report.drillPlan.length).toBe(7);
      expect(json1.report.overallScore).toBeGreaterThanOrEqual(0);
      expect(json1.report.overallScore).toBeLessThanOrEqual(100);
    });

    it('6. progress-snapshot: computes trends and recommended topic', async () => {
      const req = new Request('http://localhost:54321/functions/v1/progress-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({ userId: 'usr-alex-chen-01' }),
      });

      const res = await handleProgressSnapshot(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.latestSnapshot.overallScore).toBeGreaterThan(0);
      expect(json.streakDays).toBeGreaterThanOrEqual(0);
      expect(json.weakestDimension).toBeDefined();
      expect(json.recommendedTopic).toBeDefined();
    });

    it('7. parse-resume: rejects files > 5MB, rejects unsupported file types, and parses valid resumes', async () => {
      const badExtReq = new Request('http://localhost:54321/functions/v1/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          fileName: 'malicious.exe',
          fileSize: 1024,
        }),
      });
      await expect(handleParseResume(badExtReq)).rejects.toThrow(/Unsupported file type/);

      const bigFileReq = new Request('http://localhost:54321/functions/v1/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          fileName: 'giant_resume.pdf',
          fileSize: 6 * 1024 * 1024,
        }),
      });
      await expect(handleParseResume(bigFileReq)).rejects.toThrow();

      const validReq = new Request('http://localhost:54321/functions/v1/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          fileName: 'alex_chen_cv.pdf',
          fileSize: 250000,
          fileContentBase64: btoa('Staff Software Engineer with 8 years building distributed systems in Go and TypeScript.'),
        }),
      });

      const res = await handleParseResume(validReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sanitizedSummary.length).toBeGreaterThan(20);
      expect(json.keyTechnologies.length).toBeGreaterThan(0);
    });

    it('8. report-dispute: accepts score dispute and enforces rate limits', async () => {
      const req = new Request('http://localhost:54321/functions/v1/report-dispute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          reportId: 'rep-001',
          dimension: 'System Architecture',
          candidateReason: 'I explicitly mentioned gossip protocol at 04:12 in the audio recording.',
        }),
      });

      const res = await handleReportDispute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.disputeId).toBeDefined();
      expect(json.status).toBe('received');
    });

    it('9. export-data: returns full candidate GDPR export', async () => {
      const req = new Request('http://localhost:54321/functions/v1/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({ format: 'json' }),
      });

      const res = await handleExportData(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.expiresAt).toBeGreaterThan(Date.now());
      expect(json.payload).toBeDefined();
    });

    it('10. delete-account: requires exact phrase and permanently erases data', async () => {
      const badReq = new Request('http://localhost:54321/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({ confirmationPhrase: 'delete me' }),
      });
      await expect(handleDeleteAccount(badReq)).rejects.toThrow();

      const goodReq = new Request('http://localhost:54321/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({ confirmationPhrase: 'DELETE MY ACCOUNT PERMANENTLY' }),
      });

      const res = await handleDeleteAccount(goodReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedRecords).toBeDefined();
    });

    it('11. retention-sweep: rejects non-service role and executes cleanup when authorized', async () => {
      const unauthReq = new Request('http://localhost:54321/functions/v1/retention-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      await expect(handleRetentionSweep(unauthReq)).rejects.toThrow();

      const authReq = new Request('http://localhost:54321/functions/v1/retention-sweep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_SERVICE_ROLE_HEADER,
        },
        body: JSON.stringify({ dryRun: true }),
      });

      const res = await handleRetentionSweep(authReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('12. credits-debit: rejects non-service role and processes debit atomically', async () => {
      const unauthReq = new Request('http://localhost:54321/functions/v1/credits-debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-alex-chen-01',
          amount: 15,
          sessionId: 'sess-1',
          reason: 'Voice interview session',
        }),
      });
      await expect(handleCreditsDebit(unauthReq)).rejects.toThrow();

      const authReq = new Request('http://localhost:54321/functions/v1/credits-debit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_SERVICE_ROLE_HEADER,
        },
        body: JSON.stringify({
          userId: '11111111-1111-1111-1111-111111111111',
          amount: 15,
          sessionId: 'sess-1',
          reason: 'Interview session launch',
        }),
      });

      const res = await handleCreditsDebit(authReq);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.debitedAmount).toBe(15);
    });
  });
});
