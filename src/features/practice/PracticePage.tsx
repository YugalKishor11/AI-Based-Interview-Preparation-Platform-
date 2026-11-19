import React, { useState } from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import { SEED_QUESTIONS } from '../../data/mock/seed';
import { questionsRepo } from '../../data';
import { Question } from '../../data/contracts';
import {
  Search,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Lightbulb,
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
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="demo">60 Questions</Badge>
            <span className="text-xs text-txt-muted">Curated technical interview curriculum</span>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
            Targeted Practice Bank
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Drill high-probability Staff and Senior interview problems with staged progressive hints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSavedOnly(!savedOnly)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            savedOnly
              ? 'bg-primary/20 text-txt border-primary'
              : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
          <span>Saved Questions ({questions.filter((q) => q.saved).length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or technology (Redis, CRDT, Star, etc.)..."
              className="input pl-10 text-xs py-2.5"
            />
            <Search className="w-4 h-4 text-txt-muted absolute left-3 top-3" />
          </div>

          <div className="flex gap-2">
            {['All', 'Easy', 'Medium', 'Hard'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedLevel === lvl
                    ? 'bg-secondary text-black border-secondary'
                    : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full min-w-0">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedTopic === topic
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface/70 text-txt-2 border-border/20 hover:border-primary/40'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Question Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuestions.map((q) => (
          <GlassCard
            key={q.id}
            tier="1"
            onClick={() => {
              setActiveQuestion(q);
              setHint1Visible(false);
              setHint2Visible(false);
              setPracticeAnswer('');
            }}
            className="p-5 flex flex-col justify-between cursor-pointer hover:border-primary/40 text-left transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  {q.topic}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      q.level === 'Hard'
                        ? 'bg-danger/15 text-danger'
                        : q.level === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {q.level}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(q.id, e)}
                    className="text-txt-muted hover:text-primary transition-colors p-1"
                    title={q.saved ? 'Remove bookmark' : 'Bookmark question'}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${q.saved ? 'fill-primary text-primary' : ''}`}
                    />
                  </button>
                </div>
              </div>

              <h3 className="font-head text-sm font-bold text-txt group-hover:text-primary transition-colors leading-snug mb-3">
                {q.title}
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {q.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-elevated/80 text-txt-muted"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/15 text-xs text-txt-muted">
              <span>{q.completed ? 'Completed' : 'Practice ready'}</span>
              <span className="text-primary font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                Drill Question <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Question Drill Drawer */}
      {activeQuestion && (
        <Sheet open={Boolean(activeQuestion)} onOpenChange={() => setActiveQuestion(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg">
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
              <SheetTitle>{activeQuestion.title}</SheetTitle>
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
                <label className="font-bold text-txt uppercase text-[11px] tracking-wider">
                  Draft Your Answer or Talking Points
                </label>
                <textarea
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  rows={6}
                  placeholder="Structure your STAR response or system architecture trade-offs..."
                  className="input textarea leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
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
