import { describe, it, expect } from 'vitest';
import {
  PersonaSchema,
  InterviewPlanSchema,
  ReportSchema,
  SessionSchema,
  QuestionSchema,
} from './index';
import { SEED_PERSONAS, SEED_REPORTS, SEED_SESSIONS, SEED_QUESTIONS } from '../mock/seed';

describe('Data Contracts (Zod Schemas)', () => {
  it('validates personas matching PersonaSchema', () => {
    SEED_PERSONAS.forEach((p) => {
      const res = PersonaSchema.safeParse(p);
      expect(res.success).toBe(true);
    });
  });

  it('validates sessions matching SessionSchema', () => {
    SEED_SESSIONS.forEach((s) => {
      const res = SessionSchema.safeParse(s);
      expect(res.success).toBe(true);
    });
  });

  it('validates reports matching ReportSchema', () => {
    Object.values(SEED_REPORTS).forEach((r) => {
      const res = ReportSchema.safeParse(r);
      expect(res.success).toBe(true);
    });
  });

  it('validates 60 questions matching QuestionSchema', () => {
    expect(SEED_QUESTIONS.length).toBe(60);
    SEED_QUESTIONS.forEach((q) => {
      const res = QuestionSchema.safeParse(q);
      expect(res.success).toBe(true);
    });
  });

  it('validates interview plan format rules', () => {
    const validPlan = {
      type: 'system-design',
      targetRole: 'Staff Infrastructure Engineer',
      experienceLevel: 'Staff',
      difficulty: 'Hard',
      durationMinutes: 45,
      questionCount: 6,
      language: 'English',
      isDemo: true,
    };
    const res = InterviewPlanSchema.safeParse(validPlan);
    expect(res.success).toBe(true);
  });
});
