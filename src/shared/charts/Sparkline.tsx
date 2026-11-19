import React from 'react';
import { cn } from '../lib/cn';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  height = 40,
  className,
  isPositive = true,
}) => {
  if (!data || data.length < 2) return null;

  const width = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const strokeColor = color || (isPositive ? 'rgb(var(--c-success))' : 'rgb(var(--c-secondary))');
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('spark overflow-visible', className)}
      role="img"
      aria-label={`Trend sparkline from ${data[0]} to ${data[data.length - 1]}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
