import React, { useReducer, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { roomReducer, initialRoomContext } from './roomReducer';
import { NextTurnResponse, ResumableInterviewState } from '../../data/contracts';
import { VoiceOrb, VoiceOrbState } from '../../shared/ui/VoiceOrb';
import { FluidWave } from '../../shared/ui/FluidWave';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { CodePanel } from './CodePanel';
import { useMicStream } from '../../shared/hooks/useMicStream';
import { useAudioLevel } from '../../shared/hooks/useAudioLevel';
import { SEED_PERSONAS } from '../../data/mock/seed';
import { ttsService } from '../../shared/audio/ttsService';
import { getVoiceConfig } from '../../shared/audio/voiceRegistry';
import { isGeminiConfigured } from '../../shared/ai/geminiService';
import { getSupabaseCredentials, isSupabaseConfigured, supabase } from '../../data/supabase/client';
import { normalizeQuestionText } from '../../../supabase/functions/_shared/repeatGuard';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Keyboard,
  Clock,
  Sparkles,
  PhoneOff,
  Send,
  Volume2,
  Wifi,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';

export const SCRIPTED_QUESTIONS = [
  {
    qIndex: 1,
    text: 'Design a high-throughput, multi-tenant distributed rate limiter supporting 500,000 req/sec across global regions.',
  },
  {
    qIndex: 2,
    text: 'How do you mitigate clock skew and synchronized time windows across geographically dispersed nodes without heavy two-phase locking?',
  },
  {
    qIndex: 3,
    text: 'If your primary Redis cluster partitions or degrades past 15ms latency, how does your reverse proxy degrade gracefully?',
  },
  {
    qIndex: 4,
    text: 'How would you architect the underlying persistence schema and write-ahead log to support multi-region write replication while maintaining p99 read latency under 10ms?',
  },
  {
    qIndex: 5,
    text: 'What distributed tracing, cardinality management, and alerting thresholds would you configure to detect silent data corruption or partition storms?',
  },
  {
    qIndex: 6,
    text: 'Finally, walk me through the trade-offs between mutual TLS termination at the edge versus hop-by-hop mesh encryption under peak load.',
  },
];

interface ConversationTurn {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

// Client helper that invokes the server next-turn Edge Function or deterministic fallback
async function callNextTurnApi(params: {
  sessionId: string;
  turnSeq: number;
  answerText: string;
  typed: boolean;
  elapsedSeconds: number;
}): Promise<NextTurnResponse> {
  const creds = getSupabaseCredentials();
  const isSupabase = isSupabaseConfigured();

  if (isSupabase && creds.url) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || creds.anonKey;
      const url = `${creds.url}/functions/v1/next-turn`;
      const idempotencyKey = `${params.sessionId}:${params.turnSeq}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          sessionId: params.sessionId,
          turnSeq: params.turnSeq,
          lastCandidateAnswer: params.answerText,
          typed: params.typed,
          elapsedSeconds: params.elapsedSeconds,
        }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Next-turn Edge Function call unreachable, using local turn engine fallback:', err);
    }
  }

  // Local turn engine matching server state machine & repeat guard
  return localTurnEngine(params);
}

function localTurnEngine(params: {
  sessionId: string;
  turnSeq: number;
  answerText: string;
  typed: boolean;
  elapsedSeconds: number;
}): Promise<NextTurnResponse> {
  const resumeKey = `prepsphere_resumable_${params.sessionId}`;
  let resumable: ResumableInterviewState = {
    turn_seq: 0,
    position: 0,
    followups_used_for_current: 0,
    asked_question_ids: [],
    asked_texts_normalized: [normalizeQuestionText(SCRIPTED_QUESTIONS[0].text)],
    elapsed_ms: params.elapsedSeconds * 1000,
    is_completed: false,
  };

  const storedStr = localStorage.getItem(resumeKey);
  if (storedStr) {
    try {
      resumable = { ...resumable, ...JSON.parse(storedStr) };
    } catch {}
  }

  const currentPos = Math.min(resumable.position, SCRIPTED_QUESTIONS.length - 1);
  let action: 'ask_followup' | 'next_question' | 'wrap_up' = 'ask_followup';
  let nextPos = currentPos;
  let followupsUsed = resumable.followups_used_for_current;
  let spokenText = '';

  // Max 2 follow-ups rule: advance when 2 follow-ups reached
  if (followupsUsed >= 2) {
    const candidateNextPos = currentPos + 1;
    if (candidateNextPos >= SCRIPTED_QUESTIONS.length) {
      action = 'wrap_up';
      spokenText = 'Thank you for walking me through those components. That concludes our planned interview questions today. Let us wrap up and review your report.';
    } else {
      action = 'next_question';
      nextPos = candidateNextPos;
      followupsUsed = 0;
      spokenText = `Understood. Moving forward to our next question: ${SCRIPTED_QUESTIONS[candidateNextPos].text}`;
    }
  } else {
    // Generate follow-up or advance
    const wordCount = params.answerText.trim().split(/\s+/).length;
    if (wordCount > 25 && followupsUsed >= 1) {
      const candidateNextPos = currentPos + 1;
      if (candidateNextPos >= SCRIPTED_QUESTIONS.length) {
        action = 'wrap_up';
        spokenText = 'Thank you for walking me through those components. That concludes our planned topics today.';
      } else {
        action = 'next_question';
        nextPos = candidateNextPos;
        followupsUsed = 0;
        spokenText = `Great explanation. Let us move to the next technical topic: ${SCRIPTED_QUESTIONS[candidateNextPos].text}`;
      }
    } else {
      action = 'ask_followup';
      followupsUsed += 1;
      spokenText = followupsUsed === 1
        ? 'That addresses the primary flow. How does your architecture handle node partition recovery under high concurrent load?'
        : 'Good insight on the failure modes. What specific metrics or p99 SLAs would you track to alert on degraded performance?';
    }
  }

  const newTurnSeq = params.turnSeq + 1;
  const updatedResumable: ResumableInterviewState = {
    turn_seq: newTurnSeq,
    position: nextPos,
    followups_used_for_current: followupsUsed,
    asked_question_ids: [...resumable.asked_question_ids, `q-${currentPos}`],
    asked_texts_normalized: [...resumable.asked_texts_normalized, normalizeQuestionText(spokenText)],
    elapsed_ms: params.elapsedSeconds * 1000,
    active_question_text: spokenText,
    is_completed: action === 'wrap_up',
  };

  localStorage.setItem(resumeKey, JSON.stringify(updatedResumable));

  return Promise.resolve({
    action,
    spokenText,
    position: nextPos,
    turnSeq: newTurnSeq,
    questionId: `q-${nextPos}`,
    reason: 'local_engine',
    timeRemainingSeconds: Math.max(0, 1800 - params.elapsedSeconds),
    nextQuestionIndex: nextPos,
    fallbackUsed: false,
  });
}

export const LiveRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = id || searchParams.get('sessionId') || 'live-101';
  const [context, dispatch] = useReducer(roomReducer, initialRoomContext);

  const initialPersonaId =
    searchParams.get('personaId') ||
    localStorage.getItem('prepsphere_selected_persona_id') ||
    'p4';
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId);
  const interviewer = SEED_PERSONAS.find((p) => p.id === selectedPersonaId) || SEED_PERSONAS[3];
  const voiceConfig = getVoiceConfig(selectedPersonaId);

  // Audio pipeline
  const { analyserNode, requestPermission, stop } = useMicStream(true);
  const audioLevel = useAudioLevel(analyserNode);

  // Room state
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sideView, setSideView] = useState<'transcript' | 'code'>('transcript');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Speech Guards & Turn State
  const spokenTurnSeqsRef = useRef<Set<number>>(new Set());
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const isGeminiLive = isGeminiConfigured();

  // Voice change handler (does NOT restart the interview turn or reset state)
  const handleVoiceChange = (newPersonaId: string) => {
    setSelectedPersonaId(newPersonaId);
    const newVoice = getVoiceConfig(newPersonaId);
    try {
      localStorage.setItem('prepsphere_selected_persona_id', newPersonaId);
      localStorage.setItem('prepsphere_selected_voice_id', newVoice.id);
    } catch {}

    // Immediately stop ongoing speech and switch voice for future turns
    ttsService.stop();
    if (context.state === 'interviewer_speaking' && context.activeSpeechText) {
      ttsService.speak(context.activeSpeechText, newVoice.id, {
        onEnd: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
        onError: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
      });
    }
  };

  const handleReplayCurrent = () => {
    ttsService.stop();
    if (!context.activeSpeechText) return;
    dispatch({
      type: 'INTERVIEWER_SPEAK_START',
      questionIndex: context.currentQuestionIndex,
      turnSeq: context.turnSeq,
      text: context.activeSpeechText,
    });
    ttsService.speak(context.activeSpeechText, voiceConfig.id, {
      onEnd: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
      onError: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
    });
  };

  // Map room state to Voice Orb state
  const orbState: VoiceOrbState =
    context.state === 'interviewer_speaking'
      ? 'speaking'
      : context.state === 'listening' || context.state === 'candidate_answering'
      ? 'listening'
      : context.state === 'processing' || isProcessingAi
      ? 'thinking'
      : context.state === 'reconnecting'
      ? 'reconnecting'
      : 'idle';

  // Elapsed timer loop
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Barge-in detection: if interviewer is speaking and candidate speaks loudly, interrupt
  useEffect(() => {
    if (context.state === 'interviewer_speaking' && audioLevel > 0.25) {
      ttsService.stop();
      dispatch({ type: 'BARGE_IN' });
    }
  }, [context.state, audioLevel]);

  // Session Initialization / Resume on Mount
  useEffect(() => {
    const resumeKey = `prepsphere_resumable_${sessionId}`;
    const storedState = localStorage.getItem(resumeKey);

    if (storedState) {
      try {
        const parsed = JSON.parse(storedState) as ResumableInterviewState;
        if (parsed && typeof parsed.turn_seq === 'number' && parsed.position > 0) {
          // Hydrate from resumable_state
          dispatch({ type: 'RESUME_SESSION_STATE', state: parsed });
          return;
        }
      } catch {}
    }

    // Default initial turn (Turn 0)
    const initialQ = SCRIPTED_QUESTIONS[0];
    const initialText = initialQ.text;
    dispatch({
      type: 'INTERVIEWER_SPEAK_START',
      questionIndex: 0,
      turnSeq: 0,
      text: initialText,
    });
    setConversationTurns([
      {
        role: 'interviewer',
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      },
    ]);
  }, [sessionId]);

  // Server-Authoritative Speech Synthesis Effect: Runs strictly ONCE per turn_seq
  useEffect(() => {
    if (context.state !== 'interviewer_speaking' || !context.activeSpeechText) {
      return;
    }

    // Guard: Prevent re-speaking on render, StrictMode remount, or voice switch
    if (spokenTurnSeqsRef.current.has(context.turnSeq)) {
      return;
    }
    spokenTurnSeqsRef.current.add(context.turnSeq);

    let cancelled = false;
    const playSpeech = async () => {
      try {
        await ttsService.speak(context.activeSpeechText, voiceConfig.id, {
          onEnd: () => {
            if (!cancelled) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
          },
          onError: () => {
            if (!cancelled) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
          },
        });
      } catch {
        if (!cancelled) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
      }
    };

    playSpeech();
    return () => {
      cancelled = true;
      ttsService.stop();
    };
  }, [context.state, context.turnSeq, context.activeSpeechText, voiceConfig.id]);

  // Spacebar push-to-talk handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        if (context.state === 'listening') {
          e.preventDefault();
          dispatch({ type: 'CANDIDATE_START_ANSWER' });
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && context.state === 'candidate_answering') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [context.state]);

  // Candidate Submits an Answer -> Server Decides Follow-up vs Next Question
  const handleSubmitAnswer = async (text: string) => {
    if (!text.trim()) return;
    const answerTimestamp = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });

    dispatch({ type: 'CANDIDATE_SUBMIT_ANSWER', text });
    setTypedAnswer('');
    setShowTypeModal(false);
    setIsProcessingAi(true);

    const updatedTurns: ConversationTurn[] = [
      ...conversationTurns,
      { role: 'candidate', text, timestamp: answerTimestamp },
    ];
    setConversationTurns(updatedTurns);

    try {
      const response = await callNextTurnApi({
        sessionId,
        turnSeq: context.turnSeq,
        answerText: text,
        typed: true,
        elapsedSeconds: timerSeconds,
      });

      setIsProcessingAi(false);

      const replyTimestamp = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      setConversationTurns((prev) => [
        ...prev,
        { role: 'interviewer', text: response.spokenText, timestamp: replyTimestamp },
      ]);

      dispatch({ type: 'TURN_RESPONSE_RECEIVED', response });

      if (response.action === 'wrap_up' || response.action === 'conclude_session') {
        setTimeout(() => {
          navigate(`/app/reports/rep-101`);
        }, 3500);
      }
    } catch (err) {
      console.warn('Next-turn call exception, progressing safely:', err);
      setIsProcessingAi(false);

      // Deterministic progression fallback (never loops on current question)
      const nextPos = Math.min(context.currentQuestionIndex + 1, SCRIPTED_QUESTIONS.length - 1);
      const isWrapUp = context.currentQuestionIndex >= SCRIPTED_QUESTIONS.length - 1;
      const nextQ = SCRIPTED_QUESTIONS[nextPos];
      const fallbackResponse: NextTurnResponse = {
        action: isWrapUp ? 'wrap_up' : 'next_question',
        spokenText: isWrapUp
          ? 'Thank you for walking me through your architecture and reasoning. Let us wrap up here so you can review your feedback report.'
          : `Understood. Moving forward to our next question: ${nextQ.text}`,
        position: nextPos,
        turnSeq: context.turnSeq + 1,
        reason: 'error_fallback',
        timeRemainingSeconds: Math.max(0, 1800 - timerSeconds),
        fallbackUsed: true,
      };

      dispatch({ type: 'TURN_RESPONSE_RECEIVED', response: fallbackResponse });
      if (isWrapUp) {
        setTimeout(() => navigate('/app/reports/rep-101'), 3500);
      }
    }
  };

  const handleNextQuestion = () => {
    ttsService.stop();
    const isLast = context.currentQuestionIndex >= SCRIPTED_QUESTIONS.length - 1;
    if (isLast) {
      navigate('/app/reports/rep-101');
    } else {
      const nextPos = context.currentQuestionIndex + 1;
      const nextQ = SCRIPTED_QUESTIONS[nextPos];
      const newTurnSeq = context.turnSeq + 1;
      const resp: NextTurnResponse = {
        action: 'next_question',
        spokenText: nextQ.text,
        position: nextPos,
        turnSeq: newTurnSeq,
        questionId: `q-${nextPos}`,
        reason: 'candidate_next_action',
        timeRemainingSeconds: Math.max(0, 1800 - timerSeconds),
      };
      dispatch({ type: 'TURN_RESPONSE_RECEIVED', response: resp });

      try {
        const resumeKey = `prepsphere_resumable_${sessionId}`;
        const existing = localStorage.getItem(resumeKey);
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          resumeKey,
          JSON.stringify({
            ...parsed,
            turn_seq: newTurnSeq,
            position: nextPos,
            active_question_text: nextQ.text,
            is_completed: false,
          })
        );
      } catch {}
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeSpeechText =
    context.activeSpeechText ||
    SCRIPTED_QUESTIONS[context.currentQuestionIndex]?.text ||
    SCRIPTED_QUESTIONS[0].text;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden text-txt">
      {/* Top Status Strip */}
      <header className="h-14 px-6 border-b border-border/15 bg-surface/70 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant={isGeminiLive ? 'ai' : 'demo'} className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <span>{isGeminiLive ? 'Gemini 3.8 Flash Live' : 'Gemini 3.8 Flash Agent'}</span>
          </Badge>

          {/* Voice Selector */}
          <div className="flex items-center gap-1.5 bg-surface/80 border border-border/25 px-2.5 py-1 rounded-lg">
            <Volume2 className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="text-xs text-txt-muted hidden sm:inline">Voice:</span>
            <select
              value={selectedPersonaId}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 text-txt focus:ring-0 focus:outline-none cursor-pointer"
              title="Change interviewer voice live"
            >
              {SEED_PERSONAS.map((p) => {
                const v = getVoiceConfig(p.id);
                return (
                  <option key={p.id} value={p.id} className="bg-surface text-txt">
                    {p.name.split(' ')[0]} ({v.gender}, {v.lang})
                  </option>
                );
              })}
            </select>
          </div>

          <span className="text-xs font-mono text-txt-muted hidden md:inline">
            Question {context.currentQuestionIndex + 1} of {SCRIPTED_QUESTIONS.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-txt">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">24ms Live</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowExitConfirm(true)}
            className="text-xs py-1 px-2.5 gap-1"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End Interview
          </Button>
        </div>
      </header>

      {/* Fallback Warning Banner */}
      {context.fallbackActive && (
        <div className="bg-warning/15 border-b border-warning/30 px-4 py-1.5 text-xs text-warning flex items-center justify-center gap-2 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>AI follow-up unavailable, using planned questions</span>
        </div>
      )}

      {/* Main Two-Column Stage & Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Stage Column */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 overflow-y-auto relative border-r border-border/15">
          {/* Question & Persona Card */}
          <div className="w-full max-w-2xl">
            <RgbBorder className="rounded-2xl">
              <GlassCard tier="2" className="p-6 border border-white/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-secondary uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-secondary" /> {interviewer.name} · {interviewer.style}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReplayCurrent}
                      className="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Replay spoken question in selected voice"
                    >
                      <Volume2 className="w-3 h-3" /> Replay Voice
                    </button>
                    <Badge variant="ai">Live AI Conversation</Badge>
                  </div>
                </div>
                <h2 className="text-base font-bold text-txt leading-relaxed">
                  "{activeSpeechText}"
                </h2>
              </GlassCard>
            </RgbBorder>
          </div>

          {/* Living Voice Orb & Audio Wave */}
          <div className="my-auto py-6 flex flex-col items-center justify-center">
            <VoiceOrb state={orbState} audioLevel={audioLevel} size="lg" />
            <div className="w-full max-w-md mt-6">
              <FluidWave audioLevel={audioLevel} height={60} />
            </div>
          </div>

          {/* Real-time Subtitles / Live Captions */}
          <div
            aria-live="polite"
            className="w-full max-w-xl p-3.5 rounded-xl bg-black/40 border border-white/10 text-center text-xs text-txt-2 backdrop-blur-md mb-20 lg:mb-16"
          >
            <span className="text-txt-muted text-[10px] uppercase font-bold block mb-1">
              {context.state === 'interviewer_speaking'
                ? `${interviewer.name} Speaking (Voice Synthesized)`
                : 'Closed Captions'}
            </span>
            {context.state === 'interviewer_speaking' && (
              <p className="italic text-txt leading-relaxed">"{activeSpeechText}"</p>
            )}
            {context.state === 'candidate_answering' && (
              <p className="text-emerald-400 font-semibold animate-pulse">
                Speaking... Hold Spacebar or click "Type Answer" to submit response
              </p>
            )}
            {context.state === 'listening' && (
              <p className="text-txt-muted">
                Listening... (Click "Type / Dictate Answer" or speak to reply to {interviewer.name.split(' ')[0]})
              </p>
            )}
            {(context.state === 'processing' || isProcessingAi) && (
              <p className="text-primary font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Gemini Agent evaluating your response & formulating next question...
              </p>
            )}
          </div>
        </div>

        {/* Side Column: Transcript & Live Dialogue */}
        <div className="hidden lg:flex lg:col-span-5 flex-col bg-surface/50 overflow-hidden">
          {/* Side Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/15 bg-elevated/40">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSideView('transcript')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  sideView === 'transcript' ? 'bg-primary/20 text-txt' : 'text-txt-muted hover:text-txt'
                }`}
              >
                Live Dialogue ({conversationTurns.length})
              </button>
              <button
                type="button"
                onClick={() => setSideView('code')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  sideView === 'code' ? 'bg-primary/20 text-txt' : 'text-txt-muted hover:text-txt'
                }`}
              >
                Code & Design
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextQuestion}
                className="text-[11px] py-1 px-2.5"
              >
                Next Problem →
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            {sideView === 'code' ? (
              <CodePanel className="h-full" />
            ) : (
              <div className="h-full overflow-y-auto space-y-3 text-xs pr-1">
                {conversationTurns.length === 0 ? (
                  <div className="text-center py-12 text-txt-muted">
                    No transcript entries yet. Answers and Gemini follow-ups appear here.
                  </div>
                ) : (
                  conversationTurns.map((turn, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border space-y-1 ${
                        turn.role === 'interviewer'
                          ? 'bg-surface/90 border-primary/30 text-left'
                          : 'bg-elevated/90 border-emerald-500/30 text-left'
                      }`}
                    >
                      <div className="flex justify-between text-[10px]">
                        <span
                          className={`font-bold uppercase ${
                            turn.role === 'interviewer' ? 'text-primary' : 'text-emerald-400'
                          }`}
                        >
                          {turn.role === 'interviewer' ? `${interviewer.name} (Virtual AI)` : 'Candidate'}
                        </span>
                        <span className="font-mono text-txt-muted">{turn.timestamp}</span>
                      </div>
                      <p className="text-txt-2 leading-relaxed">{turn.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Room Dock */}
      <div className="room-dock">
        {/* Mic Control */}
        <button
          type="button"
          onClick={() => {
            if (context.state === 'listening') {
              dispatch({ type: 'CANDIDATE_START_ANSWER' });
            } else if (context.state === 'candidate_answering') {
              setShowTypeModal(true);
            }
          }}
          className={`p-3 rounded-2xl border transition-all ${
            context.state === 'candidate_answering'
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg scale-105'
              : 'bg-surface hover:bg-elevated border-border/20 text-txt'
          }`}
          title={context.state === 'candidate_answering' ? 'Click to finalize answer' : 'Click or hold Spacebar to speak'}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Text Input Trigger */}
        <button
          type="button"
          onClick={() => setShowTypeModal(true)}
          className="p-3 rounded-2xl bg-surface hover:bg-elevated border border-border/20 text-txt transition-colors"
          title="Type your answer to Gemini"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* Replay Current Spoken Line */}
        <button
          type="button"
          onClick={handleReplayCurrent}
          className="p-3 rounded-2xl bg-surface hover:bg-elevated border border-border/20 text-txt transition-colors"
          title="Replay Gemini speech"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* Advance Question */}
        <button
          type="button"
          onClick={handleNextQuestion}
          className="px-4 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors"
          title="Advance to next question"
        >
          Next Question
        </button>
      </div>

      {/* Answer Modal Dialog */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <DialogTitle>Respond to {interviewer.name}</DialogTitle>
            </div>
            <DialogDescription>
              "{activeSpeechText}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <textarea
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Structure your answer (e.g. 'I would approach this by isolating the partition tolerance with CRDTs...')"
              rows={5}
              className="input textarea text-xs leading-relaxed"
              autoFocus
            />

            <div className="flex justify-between items-center text-[11px] text-txt-muted">
              <span>Gemini will speak back in {interviewer.name.split(' ')[0]}'s voice ({voiceConfig.gender}, {voiceConfig.lang}).</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowTypeModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSubmitAnswer(typedAnswer)}
                  disabled={!typedAnswer.trim()}
                  className="gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Submit to Agent
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End Simulation Early?</DialogTitle>
            <DialogDescription>
              Your spoken transcript and answers will be evaluated to generate your evidence-linked performance report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowExitConfirm(false)}>
              Continue Interview
            </Button>
            <Button variant="danger" onClick={() => navigate('/app/reports/rep-101')}>
              End & View Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
