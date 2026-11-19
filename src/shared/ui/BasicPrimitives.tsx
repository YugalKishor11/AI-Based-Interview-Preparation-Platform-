import React from 'react';
import { cn } from '../lib/cn';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent text-primary',
        sizeMap[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'demo' | 'sample' | 'preview' | 'ai' | 'estimate' | 'success' | 'warning' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, children, ...props }) => {
  const variantStyles = {
    demo: 'badge-demo',
    sample: 'badge-sample',
    preview: 'badge-preview',
    ai: 'badge-ai',
    estimate: 'badge-estimate',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    neutral: 'bg-elevated/80 text-txt-2 border border-border/20',
  };

  return (
    <span className={cn('badge', variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono font-medium text-txt-2 bg-elevated/90 border border-border/40 rounded shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  );
};
