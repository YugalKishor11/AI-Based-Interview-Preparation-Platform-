import React, { useReducer, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { roomReducer, initialRoomContext } from './roomReducer';
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
import { geminiService, isGeminiConfigured } from '../../shared/ai/geminiService';
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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';

const SCRIPTED_QUESTIONS = [
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
];

interface ConversationTurn {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export const LiveRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // Gemini Conversational State
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const currentQ = SCRIPTED_QUESTIONS[context.currentQuestionIndex] || SCRIPTED_QUESTIONS[0];
  const [activeSpeechText, setActiveSpeechText] = useState(currentQ.text);
  const isGeminiLive = isGeminiConfigured();

  const handleVoiceChange = (newPersonaId: string) => {
    setSelectedPersonaId(newPersonaId);
    const newVoice = getVoiceConfig(newPersonaId);
    try {
      localStorage.setItem('prepsphere_selected_persona_id', newPersonaId);
      localStorage.setItem('prepsphere_selected_voice_id', newVoice.id);
    } catch {}

    // Immediately stop ongoing speech and switch
    ttsService.stop();
    if (context.state === 'interviewer_speaking') {
      ttsService.speak(activeSpeechText, newVoice.id, {
        onEnd: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
        onError: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
      });
    }
  };

  const handleReplayCurrent = () => {
    dispatch({ type: 'START_INTERVIEW' });
    ttsService.speak(activeSpeechText, voiceConfig.id, {
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

  // Initial question speech synthesis on question index change
  useEffect(() => {
    let cancel = false;
    setActiveSpeechText(currentQ.text);

    const speakInitial = async () => {
      dispatch({ type: 'START_INTERVIEW' });

      // Record interviewer turn
      const ts = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      setConversationTurns((prev) => [
        ...prev,
        { role: 'interviewer', text: currentQ.text, timestamp: ts },
      ]);

      await ttsService.speak(currentQ.text, voiceConfig.id, {
        onEnd: () => {
          if (!cancel) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
        onError: () => {
          if (!cancel) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
      });
    };

    speakInitial();
    return () => {
      cancel = true;
      ttsService.stop();
    };
  }, [context.currentQuestionIndex, currentQ.text, selectedPersonaId, voiceConfig.id]);

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

  // Candidate Submits an Answer -> Gemini AI Agent analyzes and speaks follow-up
  const handleSubmitAnswer = async (text: string) => {
    if (!text.trim()) return;
    const answerTimestamp = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    
    // 1. Dispatch candidate answer
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
      // 2. Call Gemini API to generate the next interviewer turn
      const interviewerReply = await geminiService.generateInterviewerTurn({
        persona: interviewer,
        questionText: currentQ.text,
        candidateAnswer: text,
        conversationHistory: updatedTurns,
      });

      const replyTimestamp = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      setConversationTurns((prev) => [
        ...prev,
        { role: 'interviewer', text: interviewerReply, timestamp: replyTimestamp },
      ]);
      setActiveSpeechText(interviewerReply);
      setIsProcessingAi(false);

      // 3. Set room to interviewer speaking
      dispatch({ type: 'INTERVIEWER_SPEAK_START', questionIndex: context.currentQuestionIndex });

      // 4. Speak the Gemini response with the selected interviewer's voice
      await ttsService.speak(interviewerReply, voiceConfig.id, {
        onEnd: () => {
          dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
        onError: () => {
          dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
      });
    } catch {
      setIsProcessingAi(false);
      dispatch({ type: 'INTERVIEWER_SPEAK_END' });
    }
  };

  const handleNextQuestion = () => {
    ttsService.stop();
    const isLast = context.currentQuestionIndex >= SCRIPTED_QUESTIONS.length - 1;
    if (isLast) {
      navigate('/app/reports/rep-101');
    } else {
      dispatch({ type: 'PROCESS_COMPLETE', isLastQuestion: false });
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
