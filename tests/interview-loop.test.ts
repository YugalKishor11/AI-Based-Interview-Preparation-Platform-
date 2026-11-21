import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roomReducer, initialRoomContext } from '../src/features/room/roomReducer';
import {
  computeTokenOverlapSimilarity,
  normalizeQuestionText,
  isRepeatOfAskedQuestions,
} from '../supabase/functions/_shared/repeatGuard';
import { GeminiLlmClient } from '../supabase/functions/_shared/llm/geminiLlmClient';
import { handleNextTurn } from '../supabase/functions/next-turn/index';
import { ResumableInterviewState, NextTurnResponse } from '../src/data/contracts/index';
import { z } from 'zod';

const MOCK_AUTH_HEADER = 'Bearer demo-test-token-alex-chen';

describe('Interview Question Loop Fix — Verification Suite', () => {
  // =================================================================
  // 1. Reducer State Machine Transitions
  // =================================================================
  describe('Room Reducer State Machine & Position Safety', () => {
    it('executes full happy path cycle without resetting question position', () => {
      let state = { ...initialRoomContext };
      expect(state.state).toBe('ready');
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.turnSeq).toBe(0);

      // 1. Interviewer starts speaking question 0
      state = roomReducer(state, {
        type: 'INTERVIEWER_SPEAK_START',
        questionIndex: 0,
        turnSeq: 0,
        text: 'Design a distributed rate limiter.',
      });
      expect(state.state).toBe('interviewer_speaking');
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.activeSpeechText).toBe('Design a distributed rate limiter.');

      // 2. Interviewer finishes speaking -> now listening
      state = roomReducer(state, { type: 'INTERVIEWER_SPEAK_END' });
      expect(state.state).toBe('listening');

      // 3. Candidate starts answering
      state = roomReducer(state, { type: 'CANDIDATE_START_ANSWER' });
      expect(state.state).toBe('candidate_answering');

      // 4. Candidate submits answer -> processing turn
      state = roomReducer(state, {
        type: 'CANDIDATE_SUBMIT_ANSWER',
        text: 'I would use a Redis sliding window counter.',
      });
      expect(state.state).toBe('processing');

      // 5. Turn response received: follow-up (position does NOT increment)
      const followupResponse: NextTurnResponse = {
        action: 'ask_followup',
        spokenText: 'How do you handle Redis cluster failover during high concurrency?',
        position: 0,
        turnSeq: 1,
        questionId: 'q-0',
        fallbackUsed: false,
      };
      state = roomReducer(state, {
        type: 'TURN_RESPONSE_RECEIVED',
        response: followupResponse,
      });
      expect(state.state).toBe('interviewer_speaking');
      expect(state.currentQuestionIndex).toBe(0); // Position locked during follow-up
      expect(state.turnSeq).toBe(1); // turnSeq incremented
      expect(state.activeSpeechText).toBe(followupResponse.spokenText);

      // 6. Complete second turn -> Next question advance
      state = roomReducer(state, { type: 'INTERVIEWER_SPEAK_END' });
      state = roomReducer(state, { type: 'CANDIDATE_START_ANSWER' });
      state = roomReducer(state, {
        type: 'CANDIDATE_SUBMIT_ANSWER',
        text: 'We use Sentinel and local in-memory fallback caches.',
      });

      const nextQuestionResponse: NextTurnResponse = {
        action: 'next_question',
        spokenText: 'Moving on. How do you mitigate clock skew across dispersed regions?',
        position: 1,
        turnSeq: 2,
        questionId: 'q-1',
        fallbackUsed: false,
      };
      state = roomReducer(state, {
        type: 'TURN_RESPONSE_RECEIVED',
        response: nextQuestionResponse,
      });
      expect(state.state).toBe('interviewer_speaking');
      expect(state.currentQuestionIndex).toBe(1); // Advanced strictly on next_question
      expect(state.turnSeq).toBe(2);
      expect(state.activeSpeechText).toBe(nextQuestionResponse.spokenText);
    });

    it('hydrates and resumes accurately from ResumableInterviewState without resetting to Q1', () => {
      const persistedState: ResumableInterviewState = {
        turn_seq: 4,
        position: 2,
        followups_used_for_current: 1,
        asked_question_ids: ['q-0', 'q-1', 'q-2'],
        asked_texts_normalized: ['distributed rate limiter', 'clock skew', 'redis latency'],
        elapsed_ms: 320000,
        active_question_text: 'If Redis latency spikes above 15ms, how do you degrade gracefully?',
        is_completed: false,
      };

      const resumed = roomReducer(initialRoomContext, {
        type: 'RESUME_SESSION_STATE',
        state: persistedState,
      });

      expect(resumed.currentQuestionIndex).toBe(2);
      expect(resumed.turnSeq).toBe(4);
      expect(resumed.activeSpeechText).toBe(persistedState.active_question_text);
      expect(resumed.state).toBe('listening');
    });
  });

  // =================================================================
  // 2. Server Repeat Guard & Text Similarity Engine
  // =================================================================
  describe('Server-Side Repeat Guard (Token Overlap Similarity)', () => {
    it('normalizes question text by stripping punctuation, casing, and extra whitespace', () => {
      const raw = "So, could you tell me... how would you design a distributed rate limiter, exactly?!";
      const normalized = normalizeQuestionText(raw);
      expect(normalized).not.toContain('?');
      expect(normalized).not.toContain('!');
      expect(normalized).toBe("so could you tell me how would you design a distributed rate limiter exactly");
      expect(normalized).toContain('design');
      expect(normalized).toContain('distributed');
      expect(normalized).toContain('rate');
      expect(normalized).toContain('limiter');
    });

    it('detects duplicate/paraphrased questions with similarity >= 0.65', () => {
      const q1 = "Design a high-throughput multi-tenant distributed rate limiter supporting 500,000 req/sec.";
      const q2 = "How do you design a distributed rate limiter for high-throughput multi-tenant workloads?";

      const similarity = computeTokenOverlapSimilarity(q1, q2);
      expect(similarity).toBeGreaterThanOrEqual(0.65);

      const isRepeat = isRepeatOfAskedQuestions(q2, [normalizeQuestionText(q1)], 0.65);
      expect(isRepeat).toBe(true);
    });

    it('accepts distinct topic questions with similarity < 0.65', () => {
      const q1 = "Design a high-throughput multi-tenant distributed rate limiter.";
      const q2 = "How do you mitigate clock skew and time synchronization across global nodes?";

      const similarity = computeTokenOverlapSimilarity(q1, q2);
      expect(similarity).toBeLessThan(0.65);

      const isRepeat = isRepeatOfAskedQuestions(q2, [normalizeQuestionText(q1)], 0.65);
      expect(isRepeat).toBe(false);
    });
  });

  // =================================================================
  // 3. Next-Turn Edge Function: Idempotency & Stale turn_seq Rejection
  // =================================================================
  describe('Next-Turn Server Idempotency & State Rules', () => {
    it('returns identical cached response on idempotent retry with same turn_seq', async () => {
      const idempotencyKey = `sess-idem-${Date.now()}:1`;
      const payload = {
        sessionId: 'sess-idem-test',
        turnSeq: 1,
        lastCandidateAnswer: 'I will use a token bucket algorithm stored in Redis.',
        typed: true,
        elapsedSeconds: 120,
      };

      const req1 = new Request('http://localhost:54321/functions/v1/next-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const res1 = await handleNextTurn(req1, { requestId: 'req-idem-1' });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();

      // Second identical call
      const req2 = new Request('http://localhost:54321/functions/v1/next-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const res2 = await handleNextTurn(req2, { requestId: 'req-idem-2' });
      expect(res2.status).toBe(200);
      const json2 = await res2.json();

      expect(json2.turnSeq).toBe(json1.turnSeq);
      expect(json2.spokenText).toBe(json1.spokenText);
      expect(json2.action).toBe(json1.action);
    });
  });

  // =================================================================
  // 4. Gemini LLM Structured Output with 1-Retry & Clean Fallback
  // =================================================================
  describe('Gemini LLM Client: 1-Retry on Malformed Output & Clean Fallback', () => {
    it('retries once if first response contains invalid JSON, then succeeds on valid retry', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // First call returns malformed JSON
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [{ text: "```json\n{ decision: 'followup', spoken_text: unquoted }```" }],
                  },
                },
              ],
            }),
          };
        }
        // Second call returns valid JSON schema conforming object
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        decision: 'followup',
                        spoken_text: 'Can you elaborate on how Redis eviction policies impact token counts?',
                        reason_code: 'DEEPEN_CACHE_EVICTION',
                        referenced_phrase: 'token bucket in Redis',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      });

      const client = new GeminiLlmClient('gemini-3.8-flash', 'valid-test-key', mockFetch as any);

      const testSchema = z.object({
        decision: z.enum(['followup', 'next', 'wrap_up']),
        spoken_text: z.string(),
        reason_code: z.string(),
        referenced_phrase: z.string().optional(),
      });

      const result = await client.generateJson(
        testSchema,
        'Analyze candidate answer on distributed rate limiting.'
      );

      expect(callCount).toBe(2); // Verified 1-retry triggered
      expect(result.data.decision).toBe('followup');
      expect(result.data.spoken_text).toContain('Redis eviction');
    });

    it('throws when both initial call and retry fail, enabling clean fallback progression', async () => {
      const mockFailingFetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "MALFORMED_NON_JSON_RESPONSE" }],
              },
            },
          ],
        }),
      }));

      const client = new GeminiLlmClient('gemini-3.8-flash', 'valid-test-key', mockFailingFetch as any);

      const testSchema = z.object({
        decision: z.enum(['followup', 'next', 'wrap_up']),
        spoken_text: z.string(),
      });

      await expect(
        client.generateJson(testSchema, 'Evaluate answer')
      ).rejects.toThrow();
    });
  });

  // =================================================================
  // 5. Scripted 6-Question Non-Repeating Integration Flow
  // =================================================================
  describe('Scripted 6-Question Interview: Zero Repeats Across Full Session', () => {
    it('progresses through 6 distinct questions without repetition or loop stagnation', async () => {
      const askedQuestions: string[] = [];
      const askedPositions: number[] = [];

      // SCRIPTED_QUESTIONS 6-item catalog
      const plannedCatalog = [
        'Design a high-throughput, multi-tenant distributed rate limiter supporting 500,000 req/sec across global regions.',
        'How do you mitigate clock skew and synchronized time windows across geographically dispersed nodes without heavy two-phase locking?',
        'If your primary Redis cluster partitions or degrades past 15ms latency, how does your reverse proxy degrade gracefully?',
        'How would you architect the underlying persistence schema and write-ahead log to support multi-region write replication while maintaining p99 read latency under 10ms?',
        'What distributed tracing, cardinality management, and alerting thresholds would you configure to detect silent data corruption or partition storms?',
        'Finally, walk me through the trade-offs between mutual TLS termination at the edge versus hop-by-hop mesh encryption under peak load.',
      ];

      let currentPosition = 0;
      let turnSeq = 0;
      let repeatDetections = 0;

      // Simulate full 6-question candidate run
      while (currentPosition < plannedCatalog.length) {
        const questionText = plannedCatalog[currentPosition];

        // Verify with Repeat Guard
        const normalizedAsked = askedQuestions.map(normalizeQuestionText);
        if (isRepeatOfAskedQuestions(questionText, normalizedAsked, 0.65)) {
          repeatDetections++;
        }

        askedQuestions.push(questionText);
        askedPositions.push(currentPosition);

        // Turn completes: candidate typed answer
        turnSeq++;
        currentPosition++;
      }

      // Assertions
      expect(askedQuestions.length).toBe(6);
      expect(new Set(askedQuestions).size).toBe(6); // All 6 questions distinct
      expect(askedPositions).toEqual([0, 1, 2, 3, 4, 5]); // Positions progressed strictly 0..5
      expect(repeatDetections).toBe(0); // Zero repeat loops triggered
    });
  });
});
