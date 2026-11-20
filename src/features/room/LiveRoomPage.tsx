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
import { getVoiceConfig, VOICE_REGISTRY } from '../../shared/audio/voiceRegistry';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Keyboard,
  Clock,
  Sparkles,
  PhoneOff,
  Settings,
  Send,
  AlertTriangle,
  RotateCcw,
  Wifi,
  FileText,
  Volume2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';

const SCRIPTED_QUESTIONS = [
  {
    qIndex: 1,
    text: 'Design a high-throughput, multi-tenant distributed rate limiter supporting 500,000 req/sec across global regions.',
    followUp: 'How do you handle atomic incrementation and race hazards when multiple edge nodes sync concurrently?',
  },
  {
    qIndex: 2,
    text: 'How do you mitigate clock skew and synchronized time windows across geographically dispersed nodes without heavy two-phase locking?',
    followUp: 'Could you elaborate on why sliding window counters offer superior space complexity over sliding window logs?',
  },
  {
    qIndex: 3,
    text: 'If your primary Redis cluster partitions or degrades past 15ms latency, how does your reverse proxy degrade gracefully?',
    followUp: 'Walk me through how backpressure and circuit breakers prevent cascading outages downstream.',
  },
];

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
  const [sideView, setSideView] = useState<'transcript' | 'code' | 'notes'>('code');

  const currentQ = SCRIPTED_QUESTIONS[context.currentQuestionIndex] || SCRIPTED_QUESTIONS[0];

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
      ttsService.speak(currentQ.text, newVoice.id, {
        onEnd: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
        onError: () => dispatch({ type: 'INTERVIEWER_SPEAK_END' }),
      });
    }
  };

  const handleReplayQuestion = () => {
    dispatch({ type: 'START_INTERVIEW' });
    ttsService.speak(currentQ.text, voiceConfig.id, {
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
      : context.state === 'processing'
      ? 'thinking'
      : context.state === 'reconnecting'
      ? 'reconnecting'
      : 'idle';

  // Elapsed timer loop
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Barge-in detection: if interviewer is speaking and candidate speaks loudly, trigger BARGE_IN
  useEffect(() => {
    if (context.state === 'interviewer_speaking' && audioLevel > 0.25) {
      ttsService.stop();
      dispatch({ type: 'BARGE_IN' });
    }
  }, [context.state, audioLevel]);

  // Initial greeting & question speech synthesis
  useEffect(() => {
    let cancel = false;
    const speakQuestion = async () => {
      dispatch({ type: 'START_INTERVIEW' });
      await ttsService.speak(currentQ.text, voiceConfig.id, {
        onEnd: () => {
          if (!cancel) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
        onError: () => {
          if (!cancel) dispatch({ type: 'INTERVIEWER_SPEAK_END' });
        },
      });
    };

    speakQuestion();
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

  const handleSubmitAnswer = (text: string) => {
    if (!text.trim()) return;
    dispatch({ type: 'CANDIDATE_SUBMIT_ANSWER', text });
    setTypedAnswer('');
    setShowTypeModal(false);

    // Simulate evaluator thinking and moving to next question or completion
    setTimeout(() => {
      const isLast = context.currentQuestionIndex >= SCRIPTED_QUESTIONS.length - 1;
      dispatch({ type: 'PROCESS_COMPLETE', isLastQuestion: isLast });
      if (isLast) {
        navigate('/app/reports/rep-101');
      }
    }, 2200);
  };

  const handleEndEarly = () => {
    navigate('/app/reports/rep-101');
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
          <Badge variant="demo">Demo Simulation</Badge>
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
                    {p.name} ({p.voiceGender === 'female' ? 'Female' : 'Male'} · {p.style})
                  </option>
                );
              })}
            </select>
          </div>
          <span className="text-xs text-txt-muted hidden md:inline">
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
        {/* Stage Column (Span 6 or 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 overflow-y-auto relative border-r border-border/15">
          {/* Question Card */}
          <div className="w-full max-w-2xl">
            <RgbBorder className="rounded-2xl">
              <GlassCard tier="2" className="p-6 border border-white/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                    Current Question · Staff System Design
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReplayQuestion}
                      className="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Replay audio in currently selected voice"
                    >
                      <Volume2 className="w-3 h-3" /> Replay in {interviewer.name.split(' ')[0]}'s Voice
                    </button>
                    <Badge variant="ai">Live Probing</Badge>
                  </div>
                </div>
                <h2 className="text-base font-bold text-txt leading-relaxed">
                  "{currentQ.text}"
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
            className="w-full max-w-xl p-3 rounded-xl bg-black/40 border border-white/10 text-center text-xs text-txt-2 backdrop-blur-md mb-20 lg:mb-16"
          >
            <span className="text-txt-muted text-[10px] uppercase font-bold block mb-1">
              Live Closed Captions
            </span>
            {context.state === 'interviewer_speaking' && (
              <p className="italic text-txt leading-relaxed">{currentQ.text}</p>
            )}
            {context.state === 'candidate_answering' && (
              <p className="text-emerald-400 font-semibold animate-pulse">
                Speaking... Hold Spacebar or speak into microphone
              </p>
            )}
            {context.state === 'listening' && (
              <p className="text-txt-muted">
                Listening... (Barge-in active: speak at any time to answer)
              </p>
            )}
            {context.state === 'processing' && (
              <p className="text-primary font-semibold">
                Synthesizing response and evaluating evidence...
              </p>
            )}
          </div>
        </div>

        {/* Side Column: Code Panel, Transcript, or Scratchpad (Span 5) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col bg-surface/50 overflow-hidden">
          {/* Side Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/15 bg-elevated/40">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSideView('code')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  sideView === 'code' ? 'bg-primary/20 text-txt' : 'text-txt-muted hover:text-txt'
                }`}
              >
                Code & Design
              </button>
              <button
                type="button"
                onClick={() => setSideView('transcript')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  sideView === 'transcript' ? 'bg-primary/20 text-txt' : 'text-txt-muted hover:text-txt'
                }`}
              >
                Live Transcript ({context.answers.length})
              </button>
            </div>
            <span className="text-[10px] text-txt-muted uppercase font-mono">Real-time Stream</span>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            {sideView === 'code' ? (
              <CodePanel className="h-full" />
            ) : (
              <div className="h-full overflow-y-auto space-y-3 text-xs">
                {context.answers.length === 0 ? (
                  <div className="text-center py-12 text-txt-muted">
                    No transcript entries yet. Answers will be logged here with timestamps.
                  </div>
                ) : (
                  context.answers.map((ans, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface/80 border border-border/15 space-y-1">
                      <div className="flex justify-between text-[10px] text-txt-muted">
                        <span className="font-bold text-secondary">Candidate Answer</span>
                        <span className="font-mono">{ans.timestamp}</span>
                      </div>
                      <p className="text-txt-2 leading-relaxed">{ans.text}</p>
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
            if (context.state === 'candidate_answering') {
              handleSubmitAnswer('We encapsulate token incrementation inside an atomic Redis Lua script to eliminate concurrency race conditions.');
            } else {
              dispatch({ type: 'CANDIDATE_START_ANSWER' });
            }
          }}
          className={`mic-btn ${
            context.state === 'candidate_answering' ? 'active' : 'bg-primary/20 text-primary border border-primary/40'
          }`}
          title="Click to toggle mic or hold Spacebar"
        >
          <Mic className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Type Answer Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowTypeModal(true)}
          className="gap-1.5 text-xs"
        >
          <Keyboard className="w-4 h-4 text-secondary" /> Type Answer
        </Button>

        {/* Quick Submit Sample Answer (Demo shortcut) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            handleSubmitAnswer(
              'To handle 500,000 req/sec globally, we deploy localized Redis Sentinel clusters with Envoy proxies running local Token Bucket algorithms and fallback in-memory caches on network partitions.'
            )
          }
          className="text-xs gap-1.5"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" /> Submit Candidate Sample
        </Button>

        {/* End Interview */}
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="w-10 h-10 rounded-full bg-danger/15 hover:bg-danger text-danger hover:text-white flex items-center justify-center transition-colors"
          title="End interview and view report"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Type Answer Modal */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Type Your Answer</DialogTitle>
            <DialogDescription>
              For quiet environments or microphone fallback, type your response to: "{currentQ.text}"
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            rows={5}
            placeholder="Type your structured technical reasoning or STAR explanation..."
            className="input textarea leading-relaxed"
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-txt-muted">
              Press submit to advance evaluator pipeline
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowTypeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSubmitAnswer(typedAnswer)}
                disabled={!typedAnswer.trim()}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-danger mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Conclude Interview Session?</DialogTitle>
            </div>
            <DialogDescription>
              Ending the interview will compile your answers into a completed demonstration report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowExitConfirm(false)}>
              Resume Practice
            </Button>
            <Button variant="danger" onClick={handleEndEarly}>
              Conclude & Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
