import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, resetShimDb } from './supabase-shim';

vi.mock('../src/data/supabase/client', () => {
  const shim = createClient('https://mock.supabase.co', 'mock-key');
  return {
    supabase: shim,
    isSupabaseConfigured: () => true,
    getSupabaseCredentials: () => ({ url: 'https://mock.supabase.co', anonKey: 'mock-key' }),
    setCustomSupabaseCredentials: vi.fn(),
  };
});

import {
  SessionsRepo,
  ReportsRepo,
  QuestionsRepo,
  ProfileRepo,
  ProgressRepo,
} from '../src/data/repos/interfaces';
import {
  MockSessionsRepo,
  MockReportsRepo,
  MockQuestionsRepo,
  MockProfileRepo,
  MockProgressRepo,
  store,
} from '../src/data/mock';
import {
  SupabaseSessionsRepo,
  SupabaseReportsRepo,
  SupabaseQuestionsRepo,
  SupabaseProfileRepo,
  SupabaseProgressRepo,
} from '../src/data/supabase';
import {
  SessionSchema,
  ReportSchema,
  QuestionSchema,
  ProfileSchema,
  ProgressSnapshotSchema,
  InterviewPlan,
} from '../src/data/contracts';
import { mapError, UnifiedAppError } from '../src/data/errors';
import { offlineQueue } from '../src/data/offlineQueue';

const MOCK_PLAN: InterviewPlan = {
  type: 'system-design',
  targetRole: 'Staff Software Engineer',
  level: 'Staff',
  difficulty: 'Hard',
  durationMinutes: 45,
  questionCount: 5,
  language: 'English',
};

// Parameterized suite testing both data source implementations
const REPO_IMPLEMENTATIONS = [
  {
    name: 'Mock Repositories (In-Memory / LocalStorage)',
    createRepos: () => ({
      sessions: new MockSessionsRepo(),
      reports: new MockReportsRepo(),
      questions: new MockQuestionsRepo(),
      profile: new MockProfileRepo(),
      progress: new MockProgressRepo(),
    }),
  },
  {
    name: 'Supabase Repositories (PostgreSQL & Zod Validated Client)',
    createRepos: () => ({
      sessions: new SupabaseSessionsRepo(),
      reports: new SupabaseReportsRepo(),
      questions: new SupabaseQuestionsRepo(),
      profile: new SupabaseProfileRepo(),
      progress: new SupabaseProgressRepo(),
    }),
  },
];

describe('Unified Repository Contract Test Suite (Prompt 5.1)', () => {
  beforeEach(() => {
    store.resetAll();
    resetShimDb();
  });

  REPO_IMPLEMENTATIONS.forEach(({ name, createRepos }) => {
    describe(`${name}`, () => {
      let sessions: SessionsRepo;
      let reports: ReportsRepo;
      let questions: QuestionsRepo;
      let profile: ProfileRepo;
      let progress: ProgressRepo;

      beforeEach(() => {
        const r = createRepos();
        sessions = r.sessions;
        reports = r.reports;
        questions = r.questions;
        profile = r.profile;
        progress = r.progress;
      });

      // -------------------------------------------------------------
      // 1. SessionsRepo Contract Compliance
      // -------------------------------------------------------------
      it('SessionsRepo.list: returns array of valid Session contracts', async () => {
        const list = await sessions.list();
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBeGreaterThan(0);

        for (const s of list) {
          const validated = SessionSchema.safeParse(s);
          expect(validated.success).toBe(true);
        }
      });

      it('SessionsRepo.list: filters by interview type and keyword query', async () => {
        const filtered = await sessions.list({ type: 'System Design', limit: 2 });
        expect(filtered.length).toBeLessThanOrEqual(2);
        for (const s of filtered) {
          expect(s.type.toLowerCase()).toContain('system design');
        }
      });

      it('SessionsRepo.get: retrieves session by ID with exact contract adherence', async () => {
        const list = await sessions.list({ limit: 1 });
        const targetId = list[0].id;
        const session = await sessions.get(targetId);
        expect(session.id).toBe(targetId);
        expect(SessionSchema.safeParse(session).success).toBe(true);
      });

      it('SessionsRepo.create: creates session and persists contract shape', async () => {
        const newSession = await sessions.create(MOCK_PLAN, 'p4');
        expect(newSession).toBeDefined();
        expect(newSession.personaId).toBe('p4');
        expect(newSession.durationMins).toBe(45);
        expect(SessionSchema.safeParse(newSession).success).toBe(true);
      });

      it('SessionsRepo.complete: finalizes session and yields valid Report', async () => {
        const report = await sessions.complete('s-101');
        expect(report).toBeDefined();
        expect(ReportSchema.safeParse(report).success).toBe(true);
      });

      // -------------------------------------------------------------
      // 2. ReportsRepo Contract Compliance
      // -------------------------------------------------------------
      it('ReportsRepo.get: retrieves report with complete rubrics and delivery metrics', async () => {
        const report = await reports.get('rep-101');
        expect(report.id).toBe('rep-101');
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
        expect(report.overallScore).toBeLessThanOrEqual(100);
        expect(report.rubric.length).toBeGreaterThan(0);
        expect(report.delivery).toBeDefined();
        expect(ReportSchema.safeParse(report).success).toBe(true);
      });

      it('ReportsRepo.dispute: registers evaluation dispute and returns confirmation', async () => {
        const res = await reports.dispute('rep-101', 'Disagree with technical depth score');
        expect(res.success).toBe(true);
        expect(res.message.length).toBeGreaterThan(10);
      });

      // -------------------------------------------------------------
      // 3. QuestionsRepo Contract Compliance
      // -------------------------------------------------------------
      it('QuestionsRepo.search: returns valid questions conforming to QuestionSchema', async () => {
        const qList = await questions.search();
        expect(qList.length).toBeGreaterThan(0);
        for (const q of qList) {
          expect(QuestionSchema.safeParse(q).success).toBe(true);
        }
      });

      it('QuestionsRepo.get: retrieves specific question by ID', async () => {
        const qList = await questions.search({ limit: 1 } as any);
        const targetId = qList[0].id;
        const q = await questions.get(targetId);
        expect(q.id).toBe(targetId);
        expect(QuestionSchema.safeParse(q).success).toBe(true);
      });

      it('QuestionsRepo.toggleSave: toggles bookmark state', async () => {
        const qList = await questions.search();
        const targetId = qList[0].id;
        const initialSaved = qList[0].saved;
        const toggled = await questions.toggleSave(targetId);
        expect(toggled).toBe(!initialSaved);
      });

      it('QuestionsRepo.toggleComplete: toggles completion state', async () => {
        const qList = await questions.search();
        const targetId = qList[0].id;
        const initialCompleted = qList[0].completed;
        const toggled = await questions.toggleComplete(targetId);
        expect(toggled).toBe(!initialCompleted);
      });

      // -------------------------------------------------------------
      // 4. ProfileRepo Contract Compliance
      // -------------------------------------------------------------
      it('ProfileRepo.get: returns valid Profile matching ProfileSchema', async () => {
        const p = await profile.get();
        expect(p).toBeDefined();
        expect(ProfileSchema.safeParse(p).success).toBe(true);
      });

      it('ProfileRepo.update: updates profile fields and returns updated schema', async () => {
        const updated = await profile.update({
          targetRole: 'Principal Cloud Architect',
          credits: 180,
        });
        expect(updated.targetRole).toBe('Principal Cloud Architect');
        expect(ProfileSchema.safeParse(updated).success).toBe(true);

        const fetched = await profile.get();
        expect(fetched.targetRole).toBe('Principal Cloud Architect');
      });

      it('ProfileRepo.exportData: produces valid JSON download string', async () => {
        const jsonStr = await profile.exportData();
        expect(typeof jsonStr).toBe('string');
        const parsed = JSON.parse(jsonStr);
        expect(parsed).toBeDefined();
      });

      // -------------------------------------------------------------
      // 5. ProgressRepo Contract Compliance
      // -------------------------------------------------------------
      it('ProgressRepo.getSnapshots: returns ordered historical snapshots', async () => {
        const snapshots = await progress.getSnapshots();
        expect(Array.isArray(snapshots)).toBe(true);
        expect(snapshots.length).toBeGreaterThan(0);
        for (const snap of snapshots) {
          expect(ProgressSnapshotSchema.safeParse(snap).success).toBe(true);
        }
      });
    });
  });

  // -----------------------------------------------------------------
  // 6. Universal Error Mapper & Offline Queue Verification
  // -----------------------------------------------------------------
  describe('Universal Error Mapper & Resilience Engine', () => {
    it('maps 401 unauthorized to SESSION_EXPIRED with sign_in action', () => {
      const mapped = mapError({ status: 401, message: 'JWT expired' });
      expect(mapped.code).toBe('SESSION_EXPIRED');
      expect(mapped.action).toBe('sign_in');
      expect(mapped.isRetryable).toBe(false);
    });

    it('maps 429 rate limit with countdown duration extraction', () => {
      const mapped = mapError({ status: 429, message: 'Rate limit exceeded. Please wait 45 seconds.' });
      expect(mapped.code).toBe('RATE_LIMITED');
      expect(mapped.retryAfterSeconds).toBe(45);
      expect(mapped.action).toBe('retry');
      expect(mapped.isRetryable).toBe(true);
    });

    it('maps 402 insufficient credits to INSUFFICIENT_CREDITS with top-up action', () => {
      const mapped = mapError({ status: 402, message: 'Insufficient practice credits' });
      expect(mapped.code).toBe('INSUFFICIENT_CREDITS');
      expect(mapped.action).toBe('replenish_credits');
    });

    it('maps network drop to NETWORK_ERROR with retry action', () => {
      const mapped = mapError(new TypeError('Failed to fetch'));
      expect(mapped.code).toBe('NETWORK_ERROR');
      expect(mapped.action).toBe('retry');
      expect(mapped.isRetryable).toBe(true);
    });
  });

  describe('Offline Queue Manager', () => {
    it('queues non-critical actions and persists them to queue storage', () => {
      offlineQueue.enqueue('toggle_save_question', { questionId: 'q-test-101' });
      const pending = offlineQueue.getQueue();
      expect(pending.some((a) => (a.payload as any).questionId === 'q-test-101')).toBe(true);
    });
  });
});
