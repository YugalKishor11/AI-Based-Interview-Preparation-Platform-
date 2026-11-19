import React from 'react';
import { cn } from '../lib/cn';
import { useCountUp } from '../hooks/useSystemHooks';
import { Badge } from './Badge';

interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showEstimateBadge?: boolean;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label = 'AI estimate',
  showEstimateBadge = true,
  className,
}) => {
  const animatedScore = useCountUp(score, 900);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        role="img"
        aria-label={`Score estimate: ${score} out of 100 (${label})`}
      >
        <defs>
          <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="50%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(var(--c-elevated))"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated gradient progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#score-grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>

      {/* Center Number & AI Estimate Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-head text-3xl font-extrabold text-txt tracking-tight tabular-nums">
          {animatedScore}
        </span>
        {label && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-txt-muted mt-0.5">
            {label}
          </span>
        )}
      </div>

      {showEstimateBadge && (
        <div className="mt-2">
          <Badge variant="estimate" className="text-[10px] py-0.5">
            AI estimate
          </Badge>
        </div>
      )}
    </div>
  );
};
