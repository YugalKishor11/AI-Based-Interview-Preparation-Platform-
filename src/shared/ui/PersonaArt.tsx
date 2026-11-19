import React from 'react';
import { cn } from '../lib/cn';
import { Persona } from '../../data/contracts';
import { Badge } from './Badge';
import { Check, Volume2, Shield } from 'lucide-react';

interface PersonaArtProps {
  persona: Persona;
  selected?: boolean;
  onSelect?: () => void;
  onPreviewVoice?: (e: React.MouseEvent) => void;
  className?: string;
}

export const PersonaArt: React.FC<PersonaArtProps> = ({
  persona,
  selected = false,
  onSelect,
  onPreviewVoice,
  className,
}) => {
  // Extract initials
  const initials = persona.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer text-left transition-all duration-300',
        'border border-white/10 hover:border-primary/50',
        selected && 'rgb-trace ring-2 ring-primary shadow-ambient',
        className
      )}
      style={
        {
          '--p1': persona.p1,
          '--p2': persona.p2,
        } as React.CSSProperties
      }
    >
      {/* Background Gradient Mesh + Persona Art */}
      <div
        className="persona-art w-full"
        data-initials={initials}
      >
        <div className="ai-tag">
          <Badge variant="ai" className="shadow-lg backdrop-blur-md">
            <Shield className="w-3 h-3 mr-1" /> Virtual AI Interviewer
          </Badge>
        </div>

        {selected && (
          <div className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Card Info Details */}
      <div className="p-4 bg-surface/90 backdrop-blur-md flex-1 flex flex-col justify-between border-t border-white/10">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-head text-lg font-bold text-txt">{persona.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-elevated text-txt-2 border border-border/30">
              {persona.style}
            </span>
          </div>
          <p className="text-xs font-semibold text-secondary mb-2">{persona.title}</p>
          <p className="text-xs text-txt-2 line-clamp-2 leading-relaxed mb-3">
            {persona.description}
          </p>
        </div>

        <div className="pt-2 border-t border-border/15 flex items-center justify-between">
          <span className="text-[11px] text-txt-muted">{persona.languages}</span>
          {onPreviewVoice && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewVoice(e);
              }}
              className="text-xs flex items-center gap-1 text-primary hover:text-primary-hover font-semibold px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" /> Voice Sample
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
