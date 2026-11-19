import React from 'react';
import { cn } from '../lib/cn';
import { Sparkles } from 'lucide-react';

export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'reconnecting';

interface VoiceOrbProps {
  state?: VoiceOrbState;
  audioLevel?: number; // 0 to 1 from real AnalyserNode
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state = 'idle',
  audioLevel = 0,
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: 'w-20 h-20',
    md: 'w-36 h-36',
    lg: 'w-44 h-44',
    hero: 'w-56 h-56',
  };

  // When listening or speaking, apply subtle scale transform driven by real audio RMS
  const micScale = state === 'listening' ? 1 + audioLevel * 0.18 : 1;

  const stateLabels: Record<VoiceOrbState, string> = {
    idle: 'Idle · Ready to begin',
    listening: audioLevel > 0.05 ? 'Listening to microphone' : 'Listening · Waiting for candidate speech',
    thinking: 'Analyzing context',
    speaking: 'Interviewer speaking',
    reconnecting: 'Connection interrupted · Retrying',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        data-state={state}
        className={cn('ai-orb select-none', sizeMap[size], className)}
        style={{
          transform: `scale(${micScale})`,
        }}
        role="img"
        aria-label={`Voice Orb: ${stateLabels[state]}`}
      >
        {/* Specular highlight arc */}
        <div className="absolute inset-0 rounded-full pointer-events-none border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]" />

        {/* PrepSphere Spark Mark */}
        <div className="relative z-10 text-white/90 drop-shadow-md">
          <Sparkles className={size === 'hero' ? 'w-12 h-12' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7'} />
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs font-semibold tracking-wide text-txt-2 uppercase">
          {stateLabels[state]}
        </span>
      </div>
    </div>
  );
};
