import React, { useState } from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import { SEED_QUESTIONS, SEED_PERSONAS } from '../../data/mock/seed';
import { questionsRepo } from '../../data';
import { Question } from '../../data/contracts';
import { geminiService, DrillEvaluationResult, isGeminiConfigured } from '../../shared/ai/geminiService';
import { ttsService } from '../../shared/audio/ttsService';
import { getVoiceConfig } from '../../shared/audio/voiceRegistry';
import {
  Search,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Lightbulb,
  Bot,
  Volume2,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const TOPICS = [
  'All',
  'System Design',
  'React / Frontend',
  'Behavioral',
  'DSA',
  'Database',
  'Concurrency',
  'Architecture',
  'Culture & Leadership',
];

export const PracticePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(SEED_QUESTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [savedOnly, setSavedOnly] = useState(false);

  // Detail drawer state
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [hint1Visible, setHint1Visible] = useState(false);
  const [hint2Visible, setHint2Visible] = useState(false);
  const [practiceAnswer, setPracticeAnswer] = useState('');

  // Gemini Drill Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [drillResult, setDrillResult] = useState<DrillEvaluationResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedVoiceId =
    typeof window !== 'undefined'
      ? localStorage.getItem('prepsphere_selected_voice_id') || 'voice-daniel-architect'
      : 'voice-daniel-architect';

  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = await questionsRepo.toggleSave(id);
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, saved: isSaved } : q))
    );
    if (activeQuestion?.id === id) {
      setActiveQuestion((prev) => (prev ? { ...prev, saved: isSaved } : null));
    }
  };

  const handleToggleComplete = async (id: string) => {
    const isCompleted = await questionsRepo.toggleComplete(id);
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: isCompleted } : q))
    );
    if (activeQuestion?.id === id) {
      setActiveQuestion((prev) => (prev ? { ...prev, completed: isCompleted } : null));
    }
  };

  const handleEvaluateWithGemini = async () => {
    if (!activeQuestion || !practiceAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await geminiService.evaluatePracticeDrill({
        questionTitle: activeQuestion.title,
        questionTopic: activeQuestion.topic,
        questionLevel: activeQuestion.level,
        hints: [activeQuestion.hint1, activeQuestion.hint2],
        candidateAnswer: practiceAnswer,
      });
      setDrillResult(res);
    } catch (err) {
      console.warn('Drill evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSpeakCritique = () => {
    if (!drillResult) return;
    if (isPlayingAudio) {
      ttsService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    ttsService.speak(drillResult.spokenCritique, selectedVoiceId, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
    if (selectedLevel !== 'All' && q.level !== selectedLevel) return false;
    if (savedOnly && !q.saved) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(query) ||
        q.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="demo">60 Questions</Badge>
            <span className="text-xs text-txt-muted">Curated technical interview curriculum</span>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
            Targeted Practice Bank & AI Drills
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Drill high-probability Staff and Senior interview problems with staged hints and real-time Gemini coaching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSavedOnly(!savedOnly)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            savedOnly
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-white' : ''}`} />
          Saved Only ({questions.filter((q) => q.saved).length})
        </button>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, topic, or technology (#Redis, #CRDT)..."
            className="input pl-10 text-xs"
          />
          <Search className="w-4 h-4 text-txt-muted absolute left-3 top-3" />
        </div>

        {/* Level Filter */}
        <div className="flex gap-1.5 bg-surface p-1 rounded-xl border border-border/20 self-start">
          {['All', 'Easy', 'Medium', 'Hard'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedLevel === lvl
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Horizontal Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TOPICS.map((top) => (
          <button
            key={top}
            type="button"
            onClick={() => setSelectedTopic(top)}
            className={`px-3 py-1 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTopic === top
                ? 'bg-secondary text-black border-secondary shadow-sm font-bold'
                : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
            }`}
          >
            {top}
          </button>
        ))}
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuestions.map((q) => (
          <GlassCard
            key={q.id}
            tier="gcard"
            onClick={() => {
              setActiveQuestion(q);
              setHint1Visible(false);
              setHint2Visible(false);
              setPracticeAnswer('');
              setDrillResult(null);
            }}
            className="p-5 border border-white/10 hover:border-primary/40 cursor-pointer flex flex-col justify-between transition-all group hover:scale-[1.01]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-secondary uppercase font-mono">
                  {q.topic}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      q.level === 'Hard'
                        ? 'bg-danger/15 text-danger border border-danger/30'
                        : q.level === 'Medium'
                        ? 'bg-warning/15 text-warning border border-warning/30'
                        : 'bg-success/15 text-success border border-success/30'
                    }`}
                  >
                    {q.level}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(q.id, e)}
                    className="p-1 rounded hover:bg-elevated text-txt-muted hover:text-primary transition-colors"
                    title={q.saved ? 'Remove from saved' : 'Save question'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${q.saved ? 'fill-primary text-primary' : ''}`} />
                  </button>
                </div>
              </div>

              <h3 className="font-head font-bold text-sm text-txt group-hover:text-primary transition-colors line-clamp-2">
                {q.title}
              </h3>

              <div className="flex flex-wrap gap-1">
                {q.tags.map((t) => (
                  <span key={t} className="text-[10px] font-mono text-txt-muted bg-surface/80 px-1.5 py-0.5 rounded border border-border/15">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/15 text-[11px]">
              <span className={`font-semibold ${q.completed ? 'text-emerald-400' : 'text-txt-muted'}`}>
                {q.completed ? '✓ Practiced' : 'Unattempted'}
              </span>
              <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                Practice Drill <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Question Drill Drawer */}
      {activeQuestion && (
        <Sheet open={Boolean(activeQuestion)} onOpenChange={() => { setActiveQuestion(null); ttsService.stop(); }}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase">
                  {activeQuestion.topic} · {activeQuestion.level}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleToggleSave(activeQuestion.id, e)}
                  className="text-xs text-primary font-semibold flex items-center gap-1"
                >
                  <Bookmark className={`w-4 h-4 ${activeQuestion.saved ? 'fill-primary' : ''}`} />
                  {activeQuestion.saved ? 'Saved' : 'Save'}
                </button>
              </div>
              <SheetTitle className="text-left">{activeQuestion.title}</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 mt-6 text-xs text-left">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeQuestion.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-elevated text-txt font-mono">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Staged Progressive Hints */}
              <div className="space-y-3">
                <h4 className="font-bold text-txt uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Staged Progressive Hints
                </h4>

                {/* Hint 1 */}
                <div className="p-3.5 rounded-xl bg-surface border border-border/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt">Hint 1: Conceptual Framing</span>
                    {!hint1Visible && (
                      <Button variant="secondary" size="sm" onClick={() => setHint1Visible(true)} className="text-xs py-1">
                        Reveal Hint 1
                      </Button>
                    )}
                  </div>
                  {hint1Visible && (
                    <p className="mt-2 text-txt-2 leading-relaxed italic animate-in fade-in">
                      "{activeQuestion.hint1}"
                    </p>
                  )}
                </div>

                {/* Hint 2 */}
                <div className="p-3.5 rounded-xl bg-surface border border-border/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt">Hint 2: Implementation Edge Cases</span>
                    {!hint2Visible && (
                      <Button variant="secondary" size="sm" onClick={() => setHint2Visible(true)} className="text-xs py-1">
                        Reveal Hint 2
                      </Button>
                    )}
                  </div>
                  {hint2Visible && (
                    <p className="mt-2 text-txt-2 leading-relaxed italic animate-in fade-in">
                      "{activeQuestion.hint2}"
                    </p>
                  )}
                </div>
              </div>

              {/* Answer Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-txt uppercase text-[11px] tracking-wider">
                    Draft Your Answer or Talking Points
                  </label>
                  <span className="text-[10px] text-txt-muted">
                    {practiceAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  rows={5}
                  placeholder="Outline your STAR response, system components, or concurrent invariants..."
                  className="input textarea leading-relaxed"
                />
              </div>

              {/* Gemini AI Coaching Action */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  loading={isEvaluating}
                  onClick={handleEvaluateWithGemini}
                  disabled={!practiceAnswer.trim()}
                  className="flex-1 gap-1.5"
                >
                  <Bot className="w-4 h-4" /> Evaluate with Gemini Agent
                </Button>
              </div>

              {/* Gemini Evaluation Report Card */}
              {drillResult && (
                <div className="p-4 rounded-xl bg-surface/90 border border-primary/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-border/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-bold text-txt text-sm">Gemini AI Critique</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-secondary">
                        {drillResult.score}/100 ({drillResult.verdict})
                      </span>
                      <button
                        type="button"
                        onClick={handleSpeakCritique}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isPlayingAudio
                            ? 'bg-secondary text-black border-secondary'
                            : 'bg-elevated hover:bg-surface text-txt border-border/20'
                        }`}
                        title="Listen to feedback"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Strengths Demonstrated
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-txt-2">
                      {drillResult.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Points */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Key Missing Points & Edge Cases
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-txt-2">
                      {drillResult.missingPoints.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Coaching Tip */}
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/25 text-txt">
                    <span className="text-[10px] font-bold text-primary uppercase block mb-0.5">
                      Staff-Level Coaching Tip
                    </span>
                    <p className="italic leading-relaxed">{drillResult.coachingTip}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleToggleComplete(activeQuestion.id)}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {activeQuestion.completed ? 'Mark as Incomplete' : 'Mark as Practiced'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};
