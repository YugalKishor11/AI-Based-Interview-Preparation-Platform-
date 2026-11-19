import React from 'react';
import { cn } from '../lib/cn';

export interface RadarMetric {
  label: string;
  actual: number; // 0 to 5
  target: number; // 0 to 5
}

interface RadarChartProps {
  metrics: RadarMetric[];
  size?: number;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  size = 280,
  className,
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const total = metrics.length;

  // Compute vertex positions
  const getCoordinates = (value: number, index: number, max = 5) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Target polygon
  const targetPoints = metrics.map((m, i) => getCoordinates(m.target, i));
  const targetPolygon = targetPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Actual polygon
  const actualPoints = metrics.map((m, i) => getCoordinates(m.actual, i));
  const actualPolygon = actualPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label="Staff Readiness Radar Chart comparing current estimate to target benchmarks"
      >
        {/* Background concentric rings */}
        {[1, 2, 3, 4, 5].map((level) => {
          const ringPoints = metrics.map((_, i) => getCoordinates(level, i, 5));
          return (
            <polygon
              key={level}
              points={ringPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgba(148, 163, 184, 0.14)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis rays */}
        {metrics.map((_, i) => {
          const outer = getCoordinates(5, i, 5);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Target Level Shape (Staff Baseline) */}
        <polygon
          points={targetPolygon}
          fill="rgba(56, 189, 248, 0.10)"
          stroke="rgba(56, 189, 248, 0.60)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Candidate Actual Shape */}
        <polygon
          points={actualPolygon}
          fill="rgba(139, 92, 246, 0.35)"
          stroke="#8b5cf6"
          strokeWidth="2.5"
        />

        {/* Actual point markers & outer text labels */}
        {actualPoints.map((p, i) => {
          const labelPos = getCoordinates(5.7, i, 5);
          const m = metrics[i];
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgb(var(--c-text-2))"
                fontSize="10"
                fontWeight="600"
              >
                {m.label} ({m.actual})
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5 text-txt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Current Estimate
        </span>
        <span className="flex items-center gap-1.5 text-txt-muted">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-secondary bg-secondary/20" /> Staff Target
        </span>
      </div>
    </div>
  );
};
