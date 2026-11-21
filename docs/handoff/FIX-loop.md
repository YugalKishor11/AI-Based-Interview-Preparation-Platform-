# PrepSphere Handoff: FIX-INTERVIEW-LOOP

## 1. Problem & Root Cause Summary
Prior to this fix, the virtual interview room in PrepSphere repeated the first question indefinitely ("Question Loop Bug") and never advanced through the planned technical interview topics.

Based on evidence captured in [`/docs/handoff/FIX-loop-diagnosis.md`](file:///d:/platform/docs/handoff/FIX-loop-diagnosis.md), three underlying flaws caused this behavior:
1. **Stateless Server Turn Handling (`cause b`)**: The initial `next-turn` Edge Function did not maintain conversation turn state in PostgreSQL, did not track `asked_question_ids` or `asked_texts_normalized`, and did not persist `interview_sessions.resumable_state`.
2. **Ephemeral Client Reducer Position (`cause c`)**: The client-side `roomReducer` only advanced `currentQuestionIndex` inside `PROCESS_COMPLETE`, which was guarded by `if (context.state === 'processing')`. When candidates submitted answers or clicked next question while the engine was in `listening` or `interviewer_speaking`, the action was a silent no-op, preserving position at 0.
3. **Render-Coupled Speech Synthesis (`cause g`)**: The browser TTS synthesis was attached to an unmemoized `useEffect` dependent on `[context.currentQuestionIndex, currentQ.text, selectedPersonaId, voiceConfig.id]`. Every re-render, StrictMode mount, or voice selection change re-invoked `ttsService.speak()` on question 1.

---

## 2. Server Source of Truth Architecture

### 2.1 Resumable State Schema (`interview_sessions.resumable_state`)
The server is now the absolute source of truth for interview state. State transitions and positions are recorded in the PostgreSQL `interview_sessions.resumable_state` JSONB column:
```json
{
  "turn_seq": 4,
  "position": 2,
  "followups_used_for_current": 1,
  "asked_question_ids": ["q-0", "q-1", "q-2"],
  "asked_texts_normalized": [
    "design a distributed rate limiter supporting 500000 req sec",
    "how do you mitigate clock skew across dispersed nodes",
    "if primary redis degrades past 15ms latency how does proxy degrade"
  ],
  "elapsed_ms": 320000,
  "active_question_text": "If primary Redis degrades past 15ms latency, how does your proxy degrade gracefully?",
  "is_completed": false
}
```

### 2.2 Server-Authoritative `next-turn` Edge Function (`supabase/functions/next-turn/index.ts`)
- **Idempotency Key**: Generated as `sessionId + ":" + turnSeq`. Replayed turns return the cached response with zero DB mutation and zero position change.
- **Stale Turn Rejection**: If a client sends `turnSeq < resumable.turn_seq`, the server immediately throws a `409 Conflict` (`STALE_TURN_SEQ`).
- **Follow-up Limits**: Strictly enforces a maximum of 2 follow-ups per planned question before advancing to `next_question`.
- **Atomic Persistence**: Records `resumable_state`, the new `session_questions` row, and the candidate `answers` row in one atomic transaction using the Supabase Service Role client.

---

## 3. Server-Side Repeat Guard (`supabase/functions/_shared/repeatGuard.ts`)
To prevent the LLM from asking paraphrased or identical questions, a dedicated Repeat Guard evaluates candidate spoken questions against all previously asked questions:
1. **Text Normalization**: Strips punctuation, non-word symbols, excess whitespace, and lowercases the string.
2. **Token Overlap Similarity**: Calculates the Jaccard/overlap coefficient across content tokens (>2 chars):
   $$\text{Similarity}(A, B) = \frac{|Tokens_A \cap Tokens_B|}{\min(|Tokens_A|, |Tokens_B|)}$$
3. **0.65 Repeat Threshold**: Any candidate question with similarity $\ge 0.65$ to any question in `asked_texts_normalized` is flagged as a repeat and rejected. The server automatically falls back to the next planned question from the interview plan.

---

## 4. Gemini LLM Integration (`supabase/functions/_shared/llm/geminiLlmClient.ts`)

### 4.1 Client Configuration
- **Model**: `gemini-3.8-flash` (configurable via `GEMINI_MODEL` environment secret).
- **Secret Management**: `GEMINI_API_KEY` is loaded strictly server-side inside Supabase Edge Functions. The client bundle is scanned by `npm run check:secrets` to guarantee zero key leakage.
- **Structured Output**: Uses Gemini's JSON schema mode (`responseMimeType: "application/json"`) conforming to `GeminiTurnDecisionSchema`:
  ```ts
  {
    decision: 'followup' | 'next' | 'wrap_up',
    spoken_text: string,
    reason_code: string,
    referenced_phrase: string
  }
  ```

### 4.2 1-Retry with Clean Planned Fallback
- If Gemini returns malformed or non-schema JSON, `GeminiLlmClient` executes **exactly one retry** with a targeted repair instruction.
- If the second attempt also fails or times out (12s), the edge function safely falls back to the deterministic planned question catalog:
  - Returns `action: "next_question"`, `fallbackUsed: true`.
  - The client UI renders a banner: `AI follow-up unavailable, using planned questions`.

### 4.3 Architecture Comparison: Gemini Live API vs Modular Path
| Capability / Criterion | Gemini Live API (Bidirectional WebSocket) | PrepSphere Modular Path (Current Production) |
| :--- | :--- | :--- |
| **Protocol** | Persistent WebSockets (`wss://generativelanguage.googleapis.com/.../BidiGenerateContent`) | Standard HTTPS REST (`/functions/v1/next-turn`) + Web Speech API |
| **Token Cost** | Continuous streaming audio billing (approx. \$0.003 - \$0.012 / min) | Per-turn text billing (approx. 500 tokens / turn = \$0.0001 / turn) |
| **Latency** | 200–500ms voice-to-voice | 600–1200ms end-to-end turn decision |
| **Network Resilience** | Drops completely on packet jitter or socket reconnect | Fully idempotent; resumable across page reloads and socket drops |
| **Typed Answer Support** | Unnatural / Requires multiplexing binary streams | Native first-class support; accessibility compliant |
| **Recommendation** | Propose for v2 premium tier when users opt into paid real-time audio | **Production standard for v1**: reliable, zero-leak, deterministic fallback |

---

## 5. Client Room Reducer & Speech Synthesis Fixes

### 5.1 Reducer Progression (`src/features/room/roomReducer.ts`)
- Added `turnSeq`, `activeSpeechText`, and `fallbackActive` to `RoomContext`.
- Added `TURN_RESPONSE_RECEIVED`:
  - `currentQuestionIndex` updates **only** when `response.action === 'next_question'`.
  - For follow-ups (`ask_followup`), `currentQuestionIndex` remains locked while `activeSpeechText` updates to the targeted follow-up.
- Added `RESUME_SESSION_STATE`: Restores position, turn sequence, and active speech text directly from `resumable_state`.

### 5.2 Single-Speech Guard (`src/features/room/LiveRoomPage.tsx`)
```tsx
const spokenTurnSeqsRef = useRef<Set<number>>(new Set());

useEffect(() => {
  if (context.state !== 'interviewer_speaking' || !context.activeSpeechText) return;
  if (spokenTurnSeqsRef.current.has(context.turnSeq)) return;
  spokenTurnSeqsRef.current.add(context.turnSeq);

  ttsService.speak(context.activeSpeechText, voiceConfig.id, {
    onEnd: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
    onError: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
  });
}, [context.state, context.turnSeq, context.activeSpeechText, voiceConfig.id]);
```
This ensures React 18 StrictMode double-mounting, component re-renders, or voice selections cannot re-trigger speech for an already spoken turn.

---

## 6. Verification & Test Evidence

### 6.1 Unit & Integration Test Suite (`tests/interview-loop.test.ts`)
Run: `npx vitest run tests/interview-loop.test.ts`
- **Reducer State Machine**: Verified complete state cycle (`ready` $\to$ `interviewer_speaking` $\to$ `listening` $\to$ `candidate_answering` $\to$ `processing` $\to$ `interviewer_speaking`).
- **Position Locking**: Verified that follow-up responses keep position stable while incrementing `turnSeq`.
- **Repeat Guard Math**: Confirmed similarity $\ge 0.65$ triggers duplicate rejection, while $< 0.65$ is accepted.
- **Server Idempotency**: Verified identical responses when calling `next-turn` with matching idempotency keys.
- **Gemini 1-Retry**: Verified single retry on malformed JSON and clean throw on double failure.
- **Scripted 6-Question Run**: Simulated full interview across all 6 planned questions; 0 duplicates detected, positions 0..5 verified.

### 6.2 Full Test Suite Results
Run: `npx vitest run`
- **Test Files**: 11 passed (11 total)
- **Tests**: 122 passed (122 total)
- **Zero Drift**: `npm run check:contracts` verified all 39 contracts synchronized.
- **Zero Leakage**: `npm run check:secrets` verified 0 secrets in client assets.

### 6.3 Playwright End-to-End Verification (`e2e/interview-loop.spec.ts`)
Run: `npx playwright test e2e/interview-loop.spec.ts`
- Navigates to `/app/interview/sess-101/live`.
- Captures initial Question 1 text.
- Submits candidate typed answer via the Answer Modal.
- Clicks "Advance to next question".
- **Core Assertion Passed**: Asserts Question 2 text strictly does not equal Question 1 text:
  `expect(q2Text).not.toEqual(q1Text)` $\to$ **PASSED (1.8s)**.
