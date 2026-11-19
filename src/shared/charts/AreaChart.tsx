import React, { useState } from 'react';
import { cn } from '../lib/cn';
import { ProgressSnapshot } from '../../data/contracts';

interface AreaChartProps {
  data: ProgressSnapshot[];
  className?: string;
}

type Dimension = 'overallScore' | 'technicalScore' | 'reasoningScore' | 'communicationScore' | 'problemSolvingScore';

const DIMENSION_CONFIG: Record<Dimension, { label: string; color: string }> = {
  overallScore: { label: 'Overall', color: '#8b5cf6' },
  technicalScore: { label: 'Technical', color: '#38bdf8' },
  reasoningScore: { label: 'Reasoning', color: '#34d399' },
  communicationScore: { label: 'Communication', color: '#f472b6' },
  problemSolvingScore: { label: 'Problem Solving', color: '#fbbf24' },
};

export const AreaChart: React.FC<AreaChartProps> = ({ data, className }) => {
  const [activeDim, setActiveDim] = useState<Dimension>('overallScore');

  if (!data || data.length === 0) return null;

  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const val = d[activeDim];
    const x = paddingX + (i / (data.length - 1)) * innerWidth;
    // Score range 50 to 100 for clear visualization
    const y = height - paddingY - ((val - 50) / 50) * innerHeight;
    return { x, y, val, date: d.date };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  const activeColor = DIMENSION_CONFIG[activeDim].color;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Dimension Toggles */}
      <div className="flex flex-wrap gap-2 items-center">
        {(Object.keys(DIMENSION_CONFIG) as Dimension[]).map((dim) => {
          const cfg = DIMENSION_CONFIG[dim];
          const isSelected = activeDim === dim;
          return (
            <button
              key={dim}
              type="button"
              onClick={() => setActiveDim(dim)}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-full transition-all border',
                isSelected
                  ? 'bg-primary/20 text-txt border-primary shadow-sm'
                  : 'bg-elevated/60 text-txt-muted border-border/20 hover:text-txt'
              )}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: cfg.color }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Responsive SVG Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`Progress area chart for ${DIMENSION_CONFIG[activeDim].label}`}
        >
          <defs>
            <linearGradient id={`area-grad-${activeDim}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[60, 70, 80, 90, 100].map((score) => {
            const y = height - paddingY - ((score - 50) / 50) * innerHeight;
            return (
              <g key={score}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.12)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgb(var(--c-text-muted))"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          <path d={areaD} fill={`url(#area-grad-${activeDim})`} />
          <path
            d={pathD}
            fill="none"
            stroke={activeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={activeColor} stroke="#ffffff" strokeWidth="2" />
              <text
                x={p.x}
                y={height - paddingY + 16}
                textAnchor="middle"
                fill="rgb(var(--c-text-muted))"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
