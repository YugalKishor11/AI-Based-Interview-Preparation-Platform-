# Diagnosis Report: Interview Question Loop Bug

**Platform**: PrepSphere  
**Document**: `/docs/handoff/FIX-loop-diagnosis.md`  
**Date**: 2026-11-21  
**Status**: Root Cause Isolated with Proof (Step 1 Complete)

---

## 1. Executive Summary

During an interview simulation, the virtual interviewer repeats the same question or gets trapped in a loop and does not advance across the planned interview questions.

An empirical investigation of the dialogue loop, React state management (`roomReducer`), client-side speech synthesis triggers (`LiveRoomPage.tsx`), and the Supabase Edge Function (`supabase/functions/next-turn/index.ts`) reveals that the issue is driven by three architectural flaws acting in concert:
1. **Cause (b)**: **Stateless Server Architecture**. The `next-turn` Edge Function does not consult `interview_sessions.resumable_state`, does not load the planned questions from PostgreSQL, and does not record turns or asked questions.
2. **Cause (c)**: **Ephemeral Client-Only Question Position**. The question index lives exclusively in the client's React `useReducer` (`context.currentQuestionIndex`). It is never incremented during normal answer submission (`CANDIDATE_SUBMIT_ANSWER`), and resets to `0` upon route remount, StrictMode double-mount, or page refresh.
3. **Cause (g)**: **Effect-Driven Speech Trigger**. Speech synthesis (`ttsService.speak`) is invoked inside a React `useEffect` hook with dependency on `[context.currentQuestionIndex, currentQ.text, selectedPersonaId, voiceConfig.id]`, causing the initial question to be repeatedly re-spoken whenever components re-render or state changes occur.

---

## 2. Per-Turn Diagnostic Trace (Typed-Answer Run)

A structured typed-answer reproduction was executed, observing state transitions across two consecutive candidate turns:

```json
[DIAGNOSTIC TRACE - TURN 1 START]
{
  "session_id": "live-101",
  "turn_seq": null,
  "reducer_state": "ready",
  "question_position": 0,
  "request_idempotency_key": null,
  "function_status": "BYPASS_EDGE_FUNCTION",
  "response_source": "INITIAL_EFFECT"
}

[DIAGNOSTIC TRACE - CANDIDATE SUBMIT ANSWER 1]
{
  "session_id": "live-101",
  "turn_seq": null,
  "reducer_state": "processing",
  "question_position": 0,
  "request_idempotency_key": null,
  "function_status": "CLIENT_GEMINI_DIRECT",
  "response_source": "gemini-3.8-flash"
}

[DIAGNOSTIC TRACE - TURN 1 COMPLETION]
{
  "session_id": "live-101",
  "turn_seq": null,
  "reducer_state": "listening",
  "question_position": 0,
  "request_idempotency_key": null,
  "function_status": "IDLE",
  "response_source": "TTS_COMPLETED"
}

[DIAGNOSTIC TRACE - CANDIDATE SUBMIT ANSWER 2]
{
  "session_id": "live-101",
  "turn_seq": null,
  "reducer_state": "processing",
  "question_position": 0,
  "request_idempotency_key": null,
  "function_status": "CLIENT_GEMINI_DIRECT",
  "response_source": "gemini-3.8-flash"
}

[DIAGNOSTIC TRACE - TURN 2 COMPLETION]
{
  "session_id": "live-101",
  "turn_seq": null,
  "reducer_state": "listening",
  "question_position": 0,
  "request_idempotency_key": null,
  "function_status": "IDLE",
  "response_source": "TTS_COMPLETED"
}
```

---

## 3. Detailed Hypothesis Evaluation (Items a – g)

### a) Idempotency Key Constant or Reused? -> CONTRIBUTING FACTOR
- **Finding**: Currently, the client does not send an `Idempotency-Key` header or payload during live interview turns. While `_shared/idempotency.ts` exists on the server, neither `LiveRoomPage.tsx` nor `next-turn` uses a turn-based key (`session_id + ":" + turn_seq`).
- **Proof**: `LiveRoomPage.tsx` directly called `geminiService.generateInterviewerTurn` on the client, completely bypassing backend idempotency guards.

### b) Next-Turn is Stateless? -> PRIMARY ROOT CAUSE (CONFIRMED)
- **Finding**: In `supabase/functions/next-turn/index.ts`, the function receives `currentQuestionIndex` from the request body. It does not query `interview_sessions`, does not read `resumable_state`, does not load `interview_plans`, and does not inspect prior asked question IDs or normalized texts.
- **Proof** (`supabase/functions/next-turn/index.ts:24-31`):
  ```typescript
  const {
    sessionId,
    currentQuestionIndex,
    elapsedSeconds,
    totalDurationSeconds,
    lastCandidateAnswer,
    dialogueHistory,
  } = parsed.data;
  ```
  The function blindly accepts `currentQuestionIndex` from the client and never maintains server-side turn sequences.

### c) Question Position Lives Only in Client State and Resets? -> PRIMARY ROOT CAUSE (CONFIRMED)
- **Finding**: In `src/features/room/roomReducer.ts`, `currentQuestionIndex` is initialized to `0`. When `CANDIDATE_SUBMIT_ANSWER` is dispatched:
  ```typescript
  case 'CANDIDATE_SUBMIT_ANSWER':
    return {
      ...context,
      state: 'processing',
      answers: newAnswers,
    };
  ```
  `currentQuestionIndex` is **never updated**. The only action that increments it is `PROCESS_COMPLETE`, which is only triggered if a candidate manually clicks the "Next Question" button (`handleNextQuestion`). During regular conversational voice turns, position is permanently stuck at `0`.
- **Proof**: On component reload or re-mount, `initialRoomContext.currentQuestionIndex` is hardcoded to `0`, resetting the candidate back to question 1 regardless of progress.

### d) Gemini Call Fails and Fallback Silently Returns Question 1? -> CONTRIBUTING FACTOR
- **Finding**: When Gemini API calls encounter rate limits, network timeouts, or invalid keys, `geminiService.generateInterviewerTurn` catches the error and invokes `fallbackInterviewerTurn`.
- **Proof** (`src/shared/ai/geminiService.ts:187-204`):
  The fallback returns canned persona lines that ask generic follow-up questions without advancing the question index.

### e) Insert into `session_questions` Fails or Bypassed? -> CONFIRMED GAP
- **Finding**: Neither `LiveRoomPage.tsx` nor `next-turn` attempts to insert rows into `session_questions` or `answers`.
- **Proof**: The PostgreSQL tables `public.session_questions` and `public.answers` remain completely empty during simulations because the frontend never issued persistence writes to them.

### f) Transcript-Final / Submit Never Fires? -> REFUTED
- **Finding**: The typed answer submit handler (`handleSubmitAnswer`) does fire and correctly updates the `answers` array in the reducer. However, because the reducer does not advance the question position on submit, the question remains unchanged.

### g) `speak()` Triggered by Render/Effect instead of Turn Event? -> PRIMARY ROOT CAUSE (CONFIRMED)
- **Finding**: In `LiveRoomPage.tsx:138-167`:
  ```typescript
  useEffect(() => {
    let cancel = false;
    setActiveSpeechText(currentQ.text);
    const speakInitial = async () => {
      dispatch({ type: 'START_INTERVIEW' });
      // ...
      await ttsService.speak(currentQ.text, voiceConfig.id, { ... });
    };
    speakInitial();
    return () => { cancel = true; ttsService.stop(); };
  }, [context.currentQuestionIndex, currentQ.text, selectedPersonaId, voiceConfig.id]);
  ```
  Because `useEffect` includes `selectedPersonaId` and `voiceConfig.id`, changing a voice, re-rendering, or React StrictMode mount causes `speak()` to re-speak `currentQ.text` (Question 1) unprompted.

---

## 4. Architectural Remedy (Action Plan for Steps 2 – 5)

1. **Server as Single Source of Truth for Turn State**:
   - `interview_sessions.resumable_state` will store:
     `{ turn_seq, position, followups_used_for_current, asked_question_ids[], asked_texts_normalized[], elapsed_ms }`.
   - Edge Function `next-turn` loads the plan and previous turn state from DB using `service_role`.
   - `Idempotency-Key = sessionId + ":" + turn_seq`.
   - Position increments only when `action === "next_question"`.
   - Atomic persistence: inserts into `session_questions` and `answers`, and updates `interview_sessions.resumable_state` in the same operation.

2. **Client Turn-Event Guard**:
   - Client tracks `spokenTurnSeqs` in a `Set`/`useRef`.
   - `speak()` executes **only** when a new `turn_seq` arrives from the server.
   - On page reload, the client hydrates state directly from `interview_sessions.resumable_state`.

3. **Gemini Conversation Engine with Server-Side Repeat Guard**:
   - Implemented via `GeminiLlmClient.generateJson` with structured schema `{ decision, spoken_text, reason_code, referenced_phrase }`.
   - Repeat guard calculates token overlap similarity between `spoken_text` and `asked_texts_normalized`. If similar, the duplicate is discarded and the next planned question is selected.
