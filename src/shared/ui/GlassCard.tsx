import React from 'react';
import { cn } from '../lib/cn';
import { handleSpotlight } from '../hooks/useSpotlight';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: '1' | '2' | '3' | 'gcard';
  spotlight?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ tier = 'gcard', spotlight = true, className, onPointerMove, children, ...props }, ref) => {
    const tierClass = {
      '1': 'glass-1',
      '2': 'glass-2',
      '3': 'glass-3',
      'gcard': 'gcard',
    }[tier];

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (spotlight) {
        handleSpotlight(e);
      }
      onPointerMove?.(e);
    };

    return (
      <div
        ref={ref}
        onPointerMove={handlePointerMove}
        className={cn(tierClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
