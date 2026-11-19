import React from 'react';
import { cn } from '../lib/cn';
import { Zap, Check } from 'lucide-react';

interface StreakHeatmapProps {
  currentStreakDays?: number;
  className?: string;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  currentStreakDays = 4,
  className,
}) => {
  // 7-day immediate dots (Monday to Sunday)
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeDays = [true, true, true, true, false, false, false]; // 4-day streak

  // 12-week mini activity grid (84 days)
  // Seed with realistic practice activity
  const weeks = 12;
  const daysPerWeek = 7;
  const activityMatrix = Array.from({ length: weeks }, (_, wIdx) =>
    Array.from({ length: daysPerWeek }, (_, dIdx) => {
      // More recent weeks have higher activity
      const seed = (wIdx * 7 + dIdx * 13) % 10;
      if (wIdx > 8) return seed > 3 ? (seed > 7 ? 2 : 1) : 0;
      return seed > 6 ? 1 : 0;
    })
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 7-Day Current Streak Row */}
      <div className="flex items-center justify-between pb-3 border-b border-border/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center">
            <Zap className="w-4 h-4 fill-warning" />
          </div>
          <div>
            <div className="text-base font-extrabold font-head text-txt">
              {currentStreakDays} Day Streak
            </div>
            <div className="text-[11px] text-txt-muted">Personal best: 7 days</div>
          </div>
        </div>

        {/* Weekday dots */}
        <div className="flex gap-1.5">
          {weekDays.map((day, idx) => {
            const isActive = activeDays[idx];
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-txt-muted">{day}</span>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    isActive
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-black shadow-sm'
                      : 'bg-elevated/70 text-txt-muted border border-border/20'
                  )}
                >
                  {isActive ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Week Practice Heatmap */}
      <div>
        <div className="flex items-center justify-between text-xs text-txt-muted mb-2">
          <span>12-Week Practice Cadence</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-elevated/70 border border-border/20" />
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {activityMatrix.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((level, dIdx) => (
                <div
                  key={dIdx}
                  className={cn(
                    'w-2.5 h-2.5 rounded-sm transition-colors',
                    level === 0 && 'bg-elevated/80 border border-border/10',
                    level === 1 && 'bg-primary/45 border border-primary/20',
                    level === 2 && 'bg-primary border border-primary/60 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                  )}
                  title={`Week ${wIdx + 1}, Day ${dIdx + 1}: ${level === 0 ? 'No sessions' : level === 1 ? '1 session' : '2+ sessions'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
