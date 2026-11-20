import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  geminiService,
  isGeminiConfigured,
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
} from '../src/shared/ai/geminiService';
import { SEED_PERSONAS } from '../src/data/mock/seed';

describe('Gemini AI Service & Voice Agent Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Configuration & Key Management', () => {
    it('detects when Gemini API key is missing or placeholder', () => {
      setGeminiApiKey('');
      expect(isGeminiConfigured()).toBe(false);
    });

    it('stores and retrieves custom Gemini API key safely', () => {
      setGeminiApiKey('AIzaSyTestValidFakeKeyForTesting123456');
      expect(isGeminiConfigured()).toBe(true);
      expect(getGeminiApiKey()).toBe('AIzaSyTestValidFakeKeyForTesting123456');
    });

    it('testConnection reports clear error when key is omitted', async () => {
      setGeminiApiKey('');
      const res = await geminiService.testConnection();
      expect(res.success).toBe(false);
      expect(res.message).toContain('No Gemini API key');
    });

    it('defaults to Gemini 3.8 Flash model and allows custom model configuration', () => {
      expect(getGeminiModel()).toBe('gemini-3.8-flash');
      expect(geminiService.getModel()).toBe('gemini-3.8-flash');

      setGeminiModel('gemini-3.8-pro');
      expect(getGeminiModel()).toBe('gemini-3.8-pro');

      setGeminiModel('');
      expect(getGeminiModel()).toBe('gemini-3.8-flash');
    });
  });

  describe('Adaptive Interviewer Persona Turns (All 4 Voices)', () => {
    it('generates distinct persona-styled response for Aanya (p1)', async () => {
      setGeminiApiKey(''); // triggers adaptive persona engine
      const turn = await geminiService.generateInterviewerTurn({
        persona: SEED_PERSONAS[0], // Aanya - Supportive EM
        questionText: 'Design a distributed rate limiter.',
        candidateAnswer: 'I would use Redis with a sliding window log.',
      });

      expect(typeof turn).toBe('string');
      expect(turn.length).toBeGreaterThan(20);
      // Aanya focuses on team alignment / long-term maintainability
      expect(turn).toMatch(/team|alignment|maintainability|resilient/i);
    });

    it('generates distinct persona-styled response for Meera (p2)', async () => {
      setGeminiApiKey('');
      const turn = await geminiService.generateInterviewerTurn({
        persona: SEED_PERSONAS[1], // Meera - Balanced HRBP
        questionText: 'Tell me about a time you handled disagreement.',
        candidateAnswer: 'I talked to the team lead and found a compromise.',
      });

      expect(turn).toMatch(/stakeholders|structure|friction|priorities/i);
    });

    it('generates distinct persona-styled response for Rohan (p3)', async () => {
      setGeminiApiKey('');
      const turn = await geminiService.generateInterviewerTurn({
        persona: SEED_PERSONAS[2], // Rohan - Challenging Staff
        questionText: 'How do you handle Redis cache stampedes?',
        candidateAnswer: 'We use mutex locks.',
      });

      expect(turn).toMatch(/concurrency|race conditions|herd|timeouts/i);
    });

    it('generates distinct persona-styled response for Daniel (p4)', async () => {
      setGeminiApiKey('');
      const turn = await geminiService.generateInterviewerTurn({
        persona: SEED_PERSONAS[3], // Daniel - Architect
        questionText: 'Design a global multi-region document editor.',
        candidateAnswer: 'We deploy CRDT nodes across AWS regions.',
      });

      expect(turn).toMatch(/CAP|partitions|throughput|architecture|tier/i);
    });
  });

  describe('Practice Drill Evaluation & Feedback', () => {
    it('evaluates candidate practice answer with structured rubric', async () => {
      const evaluation = await geminiService.evaluatePracticeDrill({
        questionTitle: 'Design a Global Distributed Rate Limiter',
        questionTopic: 'System Design',
        questionLevel: 'Hard',
        hints: ['Token bucket', 'Redis Lua', 'Sliding window'],
        candidateAnswer: 'We use Redis with a sliding window log and fall back to in-memory tokens on 15ms latency.',
      });

      expect(evaluation.score).toBeGreaterThan(0);
      expect(evaluation.score).toBeLessThanOrEqual(100);
      expect(evaluation.strengths.length).toBeGreaterThan(0);
      expect(evaluation.missingPoints.length).toBeGreaterThan(0);
      expect(evaluation.coachingTip).toBeDefined();
      expect(evaluation.spokenCritique).toBeDefined();
    });
  });
});
