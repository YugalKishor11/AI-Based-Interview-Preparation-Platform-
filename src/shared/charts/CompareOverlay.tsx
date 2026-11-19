import React from 'react';
import { cn } from '../lib/cn';
import { Report } from '../../data/contracts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CompareOverlayProps {
  sessionA: Report;
  sessionB: Report;
  className?: string;
}

export const CompareOverlay: React.FC<CompareOverlayProps> = ({
  sessionA,
  sessionB,
  className,
}) => {
  // Dimension comparison list
  const dimensions = sessionA.rubric.map((itemA) => {
    const itemB = sessionB.rubric.find((r) => r.dimension === itemA.dimension) || {
      score: 3.5,
      dimension: itemA.dimension,
    };
    const delta = Number((itemA.score - itemB.score).toFixed(1));
    return {
      dimension: itemA.dimension,
      scoreA: itemA.score,
      scoreB: itemB.score,
      delta,
    };
  });

  const overallDelta = sessionA.overallScore - sessionB.overallScore;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Session Titles & Overall Scores Header */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/20">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
            Current Session
          </span>
          <h4 className="font-head font-bold text-txt text-sm truncate">{sessionA.title}</h4>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-head text-primary tabular-nums">
              {sessionA.overallScore}
            </span>
            <span className="text-xs text-txt-muted">{sessionA.date}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Baseline / Prior Session
          </span>
          <h4 className="font-head font-bold text-txt text-sm truncate">{sessionB.title}</h4>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-head text-secondary tabular-nums">
              {sessionB.overallScore}
            </span>
            <span className="text-xs text-txt-muted">{sessionB.date}</span>
          </div>
        </div>
      </div>

      {/* Delta Callout */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-elevated/70 border border-border/20">
        <span className="text-sm font-semibold text-txt">Net Score Trajectory:</span>
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-bold',
            overallDelta > 0 ? 'text-emerald-400' : overallDelta < 0 ? 'text-rose-400' : 'text-txt-muted'
          )}
        >
          {overallDelta > 0 ? (
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          ) : overallDelta < 0 ? (
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          <span>{overallDelta > 0 ? `+${overallDelta}` : overallDelta} points</span>
        </div>
      </div>

      {/* Rubric Dimension Comparisons */}
      <div className="flex flex-col gap-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-txt-muted">
          Dimension Deltas (0 to 5 Scale)
        </h5>
        {dimensions.map((dim) => (
          <div
            key={dim.dimension}
            className="p-3 rounded-lg bg-surface/60 border border-border/15 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-txt">{dim.dimension}</div>
              <div className="text-[11px] text-txt-muted flex gap-3 mt-0.5">
                <span className="text-primary font-mono">Current: {dim.scoreA}</span>
                <span className="text-secondary font-mono">Prior: {dim.scoreB}</span>
              </div>
            </div>

            <div
              className={cn(
                'text-xs font-mono font-bold px-2 py-0.5 rounded',
                dim.delta > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : dim.delta < 0
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-elevated text-txt-muted'
              )}
            >
              {dim.delta > 0 ? `+${dim.delta}` : dim.delta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
