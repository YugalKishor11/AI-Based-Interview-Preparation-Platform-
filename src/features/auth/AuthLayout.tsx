import React from 'react';
import { VoiceOrb } from '../../shared/ui/VoiceOrb';
import { Badge } from '../../shared/ui/Badge';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden glass-2 border border-white/15 shadow-lift">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-primary/20 via-surface to-bg border-b lg:border-b-0 lg:border-r border-border/20 flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-head text-lg font-bold text-txt">PrepSphere</span>
              <Badge variant="demo">Demo</Badge>
            </Link>

            <h2 className="font-head text-2xl font-bold text-txt mb-2">
              Voice-First Interview Mastery
            </h2>
            <p className="text-xs text-txt-2 leading-relaxed mb-8">
              Practice under real cognitive load with specialized virtual AI interviewers.
            </p>

            <div className="space-y-4 text-xs text-txt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Evidence-linked feedback citing verbatim transcript proof</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Fairness by design: zero accent, gender, or appearance bias</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Targeted 7-day drill plans following every simulation</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <VoiceOrb state="idle" size="sm" />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-head text-2xl font-bold text-txt">{title}</h1>
              <Badge variant="demo">Demo Sign In</Badge>
            </div>
            <p className="text-xs text-txt-2">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
