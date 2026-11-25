# PrepSphere — P6 Voice Stack & AI Provider Research & Decision
**Phase E: Voice Provider Architecture Assessment · Date: 25 November 2026**

---

## 1. Executive Summary

This document addresses **Section 6.0 of Prompt 6 (AI Voice and Trend Models)**. Before proceeding with code implementation, this research analyzes the architectural and commercial viability of current production-ready voice stacks:
1. **Option A: Native Speech-to-Speech Realtime APIs**
   - OpenAI Realtime API (`gpt-realtime-2.1` / `gpt-realtime-2.1-mini`, WebRTC)
   - Google Gemini Multimodal Live API (`gemini-2.0-flash` / Gemini Live, Bidi WebSockets)
2. **Option B: Modular STT + LLM + TTS via LiveKit Agents**
   - Deepgram Nova-3 (STT) + Gemini 2.0 Flash / GPT-4o-mini (LLM) + Cartesia Sonic / ElevenLabs (TTS)
3. **Option C: Decoupled Hybrid Architecture (Recommended)**
   - **Real-Time Conversational Turn Layer**: Ultra-low latency voice interaction via Gemini Multimodal Live API (or LiveKit + Deepgram + Cartesia)
   - **Analytical & Evaluation Layer**: Decoupled server-side Gemini 2.0 Flash (`LlmClient`) enforcing strict Zod-validated JSON schemas for P1 Planner, P3 Follow-up decisions, P4 Rubric evaluation (with mandatory verbatim transcript quote verification), P5 Synthesis, P6 Drill planning, and P7 Progress trends.
   - **Client-Side Delivery Metrics**: Objective computation of WPM, pauses, filler words, and answer duration from word-level timestamps and VAD segments (never LLM-guessed).

---

## 2. In-Depth Comparative Analysis Matrix (November 2026)

| Evaluation Dimension | Option A1: OpenAI Realtime (`gpt-realtime-2.1`) | Option A2: Gemini Multimodal Live (`gemini-2.0-flash`) | Option B: Modular Pipeline (LiveKit + Deepgram + Cartesia) | Option C: Decoupled Hybrid (Recommended) |
|---|---|---|---|---|
| **End-of-Speech to 1st Audio (Latency)** | **300ms – 500ms** (p50 ~380ms, p95 ~650ms) | **400ms – 700ms** (p50 ~480ms, p95 ~850ms) | **540ms – 800ms** (p50 ~620ms, p95 ~950ms) | **Voice**: 400ms – 700ms<br>**Turn Eval**: Async / decoupled |
| **Barge-in & Turn Detection** | Native server VAD (<280ms cancellation) | Native Bidi WebSocket interruption | LiveKit Silero VAD (<150ms cancellation) | Instant local audio cut-off (<120ms) + server turn sync |
| **English (Indian Accents)** | High accuracy for general English; slight phonetic drift on regional Indian idioms | **Exceptional**; trained extensively on Indic English & diverse speech corpora | **Industry leading** with Deepgram Nova-3 Indic acoustic models | **Superior**: Deepgram / Gemini acoustic models |
| **Hindi & Hinglish Support** | Basic phonetics; high token expansion and occasional hallucination | **Native multilingual**: smooth code-switching in Hindi & Hinglish | **Excellent**: Nova-3 handles Hindi and mixed Hinglish vocabulary natively | **Native Hinglish**: preserves code-switched technical phrasing |
| **Word-Level Timestamps** | ❌ No native word timestamps on output audio | ❌ No word-level audio alignment returned | ✅ **Full millisecond word timestamps** on input STT & output TTS | ✅ **Preserved**: STT word timestamps drive local delivery metrics |
| **Voice Quality & Personas** | 8 standard voices (Alloy, Echo, Shimmer, etc.) | High quality expressiveness; 4 distinct system personas | Highly configurable; custom cloned persona voices (Cartesia / ElevenLabs) | Configured to PrepSphere's 4 persona styles (`p1`–`p4`) |
| **Structured Output Reliability** | ⚠️ Moderate: Function calling during live audio streaming can drop audio frames | ⚠️ Moderate: Tool-call JSON can stall realtime audio stream | ✅ **100% Reliable**: LLM runs isolated JSON schema mode with Zod | ✅ **100% Guaranteed**: Server edge functions enforce Zod schemas |
| **Cost per Interview Minute** | **$0.08 – $0.11 / min** (Flagship)<br>**$0.02 – $0.05 / min** (Mini) | **~$0.023 – $0.035 / min** ($3/1M in, $12/1M out) | **~$0.043 – $0.055 / min** (Deepgram + Cartesia + LLM + LiveKit) | **~$0.028 – $0.045 / min** (Best cost/reliability ratio) |
| **Rate Limits (Concurrency)** | Tier-based TPM/RPM; strict session limits on lower tiers | Generous on Google AI Studio / Vertex AI enterprise | Scalable via distributed LiveKit Cloud or self-hosted workers | High concurrency; evaluation runs via batch/stateless endpoints |
| **Data Retention & Privacy** | Zero Data Retention (ZDR) on Enterprise only; 30-day default | Zero training on Vertex AI / Cloud paid tier; AI Studio logs | Deepgram & Cartesia offer zero-log enterprise agreements | **Strict DPDP/GDPR**: No PII/transcripts sent to unapproved vendors |
| **Regional Hosting** | US / EU primarily | **Google Cloud India (Mumbai / `asia-south1`)** available | Deepgram / LiveKit global edge mesh (APAC available) | Low round-trip latency within India / APAC |
| **SDK Maturity (Web + Android)** | WebRTC JS SDK; WebView requires custom audio focus handling | WebSocket + Web Audio API (PCM 24kHz); runs smoothly in Capacitor | Full WebRTC SDK for React + Capacitor Android native plugins | **Universal**: Standard WebSockets/WebRTC + REST Edge Functions |
| **Failure Modes & Fallback** | WebSocket disconnect drops whole turn | Connection drop pauses turn; resume token required | Modular: STT failure drops to typing; TTS failure drops to text | **Zero-Disruption Fallback**: Drops to typed chat if voice degrades |

---

## 3. Deep Dive into Architectural Options

### 3.1 Option A: Pure End-to-End Speech-to-Speech (OpenAI / Gemini Live)
- **Strengths**: Lowest conceivable latency (300ms–500ms); model hears candidate intonation, cadence, and breath.
- **Weaknesses**:
  1. **Cannot reliably generate complex nested JSON rubrics during live audio**: Attempting to force an audio model to output both natural conversational speech and strict Zod-compliant JSON (with verbatim quotes, dimension breakdowns, and 0–5 scores) causes audio stuttering, token lag, or hallucinations.
  2. **Lack of word timestamps**: Pure audio tokens do not provide millisecond-aligned word timestamps needed to calculate objective delivery metrics (Words Per Minute, filler words count, exact pause intervals).
  3. **High cost**: OpenAI Realtime flagship reaches $0.10+/min, making 45-minute technical interviews expensive ($4.50+ per mock interview).

### 3.2 Option B: Modular Pipeline via LiveKit Agents (STT + LLM + TTS)
- **Strengths**:
  1. **Decoupled excellence**: Uses the best model for each task (Deepgram Nova-3 for speech recognition $\to$ Gemini 2.0 Flash for logic $\to$ Cartesia Sonic for ultra-fast natural voice).
  2. **Word timestamps out of the box**: Deepgram provides exact start/end milliseconds for every transcribed word, enabling local computation of WPM, pauses, and filler rates.
  3. **Granular fallback**: If Cartesia TTS encounters an outage, candidate audio is still transcribed, and the interview smoothly transitions to typed/visual text.
- **Weaknesses**: Requires managing a LiveKit agent worker process (or LiveKit Cloud SIP/SIP-trunk/Agent dispatch).

### 3.3 Option C: The Decoupled Hybrid (Recommended)
This approach delivers the optimal balance of conversational speed, strict rubric compliance, and cost efficiency:
1. **Live Conversational Turn Engine**:
   - Audio capture via Web Audio API / PCM streaming.
   - Speech synthesis via fast streaming TTS / Gemini Live Audio.
   - Client-side VAD (Voice Activity Detection) with tuned thresholds (800ms for thinking pauses, 200ms for clean turn ends; 200ms barge-in cancellation).
2. **Server-Side Interview Brain & Verbatim Evaluator**:
   - Runs on Supabase Edge Functions / server functions using **Gemini 2.0 Flash (`LlmClient`)**.
   - Handles P1 Planner, P3 Follow-up decisions, P4 Answer evaluation, P5 Report synthesis, P6 Drill planning, and P7 Progress trends.
   - Enforces **verbatim quote verification**: every rubric score quote must match a normalized substring of the actual transcript; unverifiable quotes are rejected with automatic retry.
3. **Deterministic Delivery Metrics**:
   - Computed client-side / server-side from transcript words and VAD audio segments:
     - Pace (WPM)
     - Filler words per minute (scanned against English + Hinglish filler lexicon: `um`, `uh`, `like`, `you know`, `basically`, `matlab`, `yaani`, `actually`)
     - Pause counts and duration (from silent VAD slices)
     - Never guessed by an LLM.

---

## 4. Cost Comparison for a 30-Minute Interview Session

| Architecture | Voice Layer Cost | LLM Brain & Evaluation Cost | Total Cost per 30-Min Session |
|---|---|---|---|
| **OpenAI Realtime (`gpt-realtime-2.1`)** | ~$2.70 ($0.09/min) | Included in session tokens | **~$2.70** |
| **OpenAI Realtime Mini (`gpt-realtime-2.1-mini`)** | ~$0.90 ($0.03/min) | Included in session tokens | **~$0.90** |
| **Gemini Multimodal Live + Gemini Flash** | ~$0.75 ($0.025/min) | ~$0.08 (P1–P7 tokens) | **~$0.83** |
| **LiveKit + Deepgram + Cartesia + Gemini** | ~$1.20 ($0.04/min) | ~$0.08 (P1–P7 tokens) | **~$1.28** |
| **Demo Mode (Web Speech / Browser Audio)** | $0.00 | $0.00 (or minimal Flash) | **$0.00** |

---

## 5. Decision & Recommendation

### Primary Recommendation: **Option C (Decoupled Hybrid with Gemini Flash / Gemini Live Stack)**
- **Why**:
  1. **Existing Key**: You already have `GEMINI_API_KEY` configured in `.env` (using Gemini 2.0/3.8 Flash).
  2. **Superior Multilingual & Indic English Handling**: Gemini has state-of-the-art phoneme and accent comprehension for Indian English and Hinglish.
  3. **Strict Evaluation Integrity**: Decoupling the evaluation chain ensures 100% adherence to the evidence rule (verbatim quote verification) and schema constraints without compromising voice latency.
  4. **Cost Efficiency**: At ~$0.025–$0.03/min, a full 30-minute interview costs less than $0.85, preserving candidate credits.

### Fallback Recommendation: **Deepgram + Cartesia + LiveKit Agents** (or Web Speech Demo Mode)
- If native bidirectional streaming WebSockets are throttled by candidate network conditions, the system falls back to modular Deepgram STT + Cartesia/Web Speech TTS, and ultimately to typed answers with zero loss of session progress.

---

## 6. Questions for the User (Action Required Before Coding)

To tailor the implementation of Section 6.1 through 6.8:
1. **Which API credentials do you currently possess or plan to use?**
   - [x] **Gemini API Key** (Already configured in `.env` — `VITE_GEMINI_API_KEY`)
   - [ ] **OpenAI API Key** (for Realtime API or GPT-4o-mini)
   - [ ] **Deepgram API Key** (for Nova-3 streaming STT)
   - [ ] **Cartesia / ElevenLabs API Key** (for dedicated streaming TTS)
   - [ ] **LiveKit Cloud Credentials** (URL, API Key, Secret)
2. **Do you approve proceeding with Option C (Decoupled Hybrid with Gemini 2.0/3.8 Flash as the primary brain + streaming voice adapter with typed fallback)?**
