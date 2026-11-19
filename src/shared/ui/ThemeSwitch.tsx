import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Sun, Moon, Laptop, Sparkles, Zap, Shield, RotateCcw } from 'lucide-react';
import { cn } from '../lib/cn';

export const ThemeSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-xl text-txt-2 hover:text-txt bg-surface/80 hover:bg-elevated border border-border/20 transition-all',
        className
      )}
      title={`Current: ${theme} theme (Click to toggle)`}
      aria-label="Toggle dark/light theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-sky-400" />
      )}
    </button>
  );
};

export const EffectsSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { effects, resolvedEffects, toggleEffects } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleEffects}
      className={cn(
        'px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all',
        resolvedEffects === 'reduced'
          ? 'bg-elevated text-txt-muted border-border/30'
          : 'bg-primary/10 text-primary border-primary/30 shadow-sm',
        className
      )}
      title={`Effects mode: ${resolvedEffects} (Click to toggle Reduced Effects)`}
      aria-label="Toggle reduced effects"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">
        {resolvedEffects === 'reduced' ? 'Reduced Effects' : 'Full FX'}
      </span>
    </button>
  );
};

export const GovernorNotificationToast: React.FC = () => {
  const { governorDowngraded, undoGovernorDowngrade, resolvedEffects } = useTheme();

  if (!governorDowngraded) return null;

  return (
    <div
      role="status"
      className="fixed bottom-24 right-6 z-50 p-4 rounded-xl bg-surface/95 border border-primary/40 shadow-lift backdrop-blur-md flex items-center gap-3 max-w-sm text-xs animate-in fade-in slide-in-from-bottom-4"
    >
      <Shield className="w-4 h-4 text-secondary flex-shrink-0" />
      <div className="flex-1 text-txt-2">
        Effects auto-adjusted to <strong>{resolvedEffects}</strong> to maintain high frame rate performance.
      </div>
      <button
        type="button"
        onClick={undoGovernorDowngrade}
        className="px-2 py-1 rounded bg-elevated hover:bg-surface text-txt font-semibold flex items-center gap-1 border border-border/30"
      >
        <RotateCcw className="w-3 h-3" /> Undo
      </button>
    </div>
  );
};
