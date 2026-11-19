import React, { useState, useEffect } from 'react';
import { cn } from '../lib/cn';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  AlertCircle,
  WifiOff,
  MicOff,
  Clock,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

/* 1. Empty State with Original SVG Illustration */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({ title, description, actionLabel, onAction, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto', className)}>
      <div className="w-24 h-24 mb-4 text-primary/40 relative">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <path
            d="M32 48C32 40 40 32 48 32C56 32 64 40 64 48C64 56 56 64 48 64C40 64 32 56 32 48Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="48" cy="48" r="6" fill="currentColor" />
        </svg>
      </div>
      <h3 className="font-head text-lg font-bold text-txt mb-1">{title}</h3>
      <p className="text-sm text-txt-2 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/* 2. Error State with Retry Button */
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry: () => void;
  className?: string;
}> = ({ title = 'Failed to load content', message, onRetry, className }) => {
  return (
    <div
      role="alert"
      className={cn(
        'p-6 rounded-2xl bg-danger/10 border border-danger/25 flex flex-col items-center text-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="font-head text-base font-bold text-txt mb-1">{title}</h4>
      <p className="text-xs text-txt-2 mb-4 leading-relaxed">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
        <RotateCcw className="w-4 h-4" /> Try Again
      </Button>
    </div>
  );
};

/* 3. Offline Banner */
export const OfflineBanner: React.FC = () => {
  return (
    <div
      role="status"
      className="bg-warning/20 border-b border-warning/40 text-warning px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold backdrop-blur-md sticky top-0 z-50"
    >
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline. Changes are saved locally and will sync once connection resumes.</span>
    </div>
  );
};

/* 4. Microphone Permission Denied Guide */
export const PermissionDeniedGuide: React.FC<{ onRetry: () => void; onUseTyped: () => void }> = ({
  onRetry,
  onUseTyped,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/30 max-w-lg mx-auto text-left shadow-lift">
      <div className="flex items-center gap-3 mb-4 text-danger">
        <div className="w-10 h-10 rounded-full bg-danger/15 flex items-center justify-center">
          <MicOff className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-head text-base font-bold text-txt">Microphone Permission Blocked</h4>
          <span className="text-xs text-txt-muted">Browser microphone access is required for voice practice</span>
        </div>
      </div>

      <div className="bg-elevated/70 p-4 rounded-xl mb-4 text-xs space-y-2 text-txt-2">
        <p className="font-semibold text-txt">How to unblock in your browser:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click the <strong>padlock or tune icon</strong> in your browser address bar (top left).</li>
          <li>Find <strong>Microphone</strong> in the permissions menu.</li>
          <li>Change setting from Block to <strong>Allow</strong>.</li>
          <li>Refresh the page or click below to re-test.</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onRetry}>
          Re-test Microphone
        </Button>
        <Button variant="ghost" onClick={onUseTyped}>
          Continue with Typed Answers
        </Button>
      </div>
    </div>
  );
};

/* 5. Rate Limit Notice with Live Countdown */
export const RateLimitNotice: React.FC<{ retryAfterSeconds: number; onComplete: () => void }> = ({
  retryAfterSeconds,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onComplete]);

  return (
    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-md mx-auto">
      <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
      <h4 className="font-head font-bold text-txt text-base mb-1">Rate Limit Cooldown Active</h4>
      <p className="text-xs text-txt-2 mb-3">
        To ensure fair resource distribution, please wait before initiating another voice stream.
      </p>
      <div className="text-2xl font-mono font-extrabold text-amber-400 tabular-nums mb-4">
        00:{secondsLeft.toString().padStart(2, '0')}
      </div>
      <Button variant="secondary" size="sm" disabled disabledReason="Waiting for cooldown timer">
        Retry in {secondsLeft}s
      </Button>
    </div>
  );
};

/* 6. Demo Mode Banner */
export const DemoModeBanner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/25 text-warning flex items-center justify-between text-xs',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Demo Mode:</strong> Scripted virtual interviewer. Scores and transcripts are AI estimates.
        </span>
      </div>
      <Badge variant="demo" className="text-[10px]">
        Sample Data
      </Badge>
    </div>
  );
};

/* 7. Consent Panel */
export const ConsentPanel: React.FC<{
  agreed: boolean;
  onToggle: (val: boolean) => void;
  className?: string;
}> = ({ agreed, onToggle, className }) => {
  return (
    <div className={cn('p-4 rounded-xl bg-surface/80 border border-border/20 text-xs text-txt-2', className)}>
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-5 h-5 rounded mt-0.5 border border-border/40 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
        />
        <div className="space-y-1">
          <span className="font-semibold text-txt block">
            Practice Consent & Fair Evaluation Terms
          </span>
          <p className="leading-relaxed text-txt-muted text-[11px]">
            I understand that PrepSphere is a practice platform. Scores are AI estimates with inherent limitations.
            Voice and transcript data are evaluated strictly against professional job rubrics and never score
            accent, gender, appearance, or disability.
          </p>
        </div>
      </label>
    </div>
  );
};
