import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { ScoreRing } from '../../shared/ui/ScoreRing';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { AreaChart } from '../../shared/charts/AreaChart';
import { CompareOverlay } from '../../shared/charts/CompareOverlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import {
  SEED_SESSIONS,
  SEED_PROGRESS_SNAPSHOTS,
  SEED_REPORTS,
  SEED_PERSONAS,
} from '../../data/mock/seed';
import { Session } from '../../data/contracts';
import {
  Search,
  GitCompare,
  TrendingUp,
  Clock,
  Layers,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(SEED_SESSIONS);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(['s-101', 's-102']);
  const [compareOpen, setCompareOpen] = useState(false);

  const filteredSessions = sessions.filter((s) => {
    if (selectedType !== 'All' && s.type !== selectedType) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const sessionA = SEED_REPORTS['rep-101'];
  const sessionB = SEED_REPORTS['rep-102'];

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="demo">12 Past Simulations</Badge>
            <span className="text-xs text-txt-muted">Historical interview archives & trajectories</span>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
            Interview History & Analytics
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Re-open evidence-based reports or compare before-and-after rubric trajectories side-by-side.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={selectedForCompare.length !== 2}
          disabledReason={selectedForCompare.length !== 2 ? 'Select 2 sessions using the checkboxes to compare' : undefined}
          onClick={() => setCompareOpen(true)}
          className="gap-1.5 text-xs"
        >
          <GitCompare className="w-4 h-4 text-primary" /> Compare Selected ({selectedForCompare.length}/2)
        </Button>
      </div>

      {/* Trajectory Trend Chart Card */}
      <GlassCard tier="gcard" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-head text-base font-bold text-txt">
              Competency Growth Trajectory
            </h3>
            <p className="text-xs text-txt-2">Overall score trajectory from 68 to 84 across 6 weeks</p>
          </div>
          <Badge variant="estimate">AI Estimate</Badge>
        </div>
        <AreaChart data={SEED_PROGRESS_SNAPSHOTS} />
      </GlassCard>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past sessions by title or topic..."
            className="input pl-10 text-xs py-2"
          />
          <Search className="w-4 h-4 text-txt-muted absolute left-3 top-2.5" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1">
          {['All', 'System Design', 'Behavioral', 'Technical', 'DSA'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedType === t
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => {
          const persona = SEED_PERSONAS.find((p) => p.id === session.personaId) || SEED_PERSONAS[0];
          const isSelected = selectedForCompare.includes(session.id);

          return (
            <GlassCard
              key={session.id}
              tier="1"
              className="p-4 flex flex-wrap items-center justify-between gap-4 text-left hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleCompare(session.id)}
                  title="Select for comparison"
                  className="w-4 h-4 rounded border-border"
                />

                <ScoreRing
                  score={session.score}
                  size={46}
                  strokeWidth={5}
                  label=""
                  showEstimateBadge={false}
                />

                <div>
                  <h4 className="text-sm font-bold text-txt">{session.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-txt-muted mt-0.5">
                    <span className="font-semibold text-secondary">{session.type}</span>
                    <span>·</span>
                    <span>{session.durationMins} mins</span>
                    <span>·</span>
                    <span>{session.date}</span>
                    <span>·</span>
                    <span>Interviewer: {persona.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/app/reports/${session.reportId || 'rep-101'}`}
                  className="btn btn-secondary text-xs py-1.5 px-3.5 gap-1"
                >
                  Inspect Evidence Report <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Compare Side-by-Side Drawer */}
      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Session Trajectory Comparison</SheetTitle>
            <SheetDescription>
              Overlaying current simulation against prior baseline to verify measured rubric gains.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <CompareOverlay sessionA={sessionA} sessionB={sessionB} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
