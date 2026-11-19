import React from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Badge } from '../../shared/ui/Badge';
import { ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="py-12 max-w-4xl mx-auto text-left px-6 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="demo">Terms of Use</Badge>
          <span className="text-xs text-txt-muted">Last revised: November 2026</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          Terms of Service & Usage Ethics
        </h1>
        <p className="text-xs text-txt-2 mt-2 leading-relaxed">
          Please review the operating terms governing candidate practice simulations on PrepSphere.
        </p>
      </div>

      <div className="space-y-6 text-xs text-txt-2 leading-relaxed">
        <GlassCard tier="1" className="p-6 space-y-3">
          <h2 className="font-head font-bold text-base text-txt flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> 1. Practice & Simulation Only
          </h2>
          <p>
            PrepSphere is designed exclusively for pre-interview preparation and self-coaching. We strictly prohibit the use of our platform as a live "copilot" or real-time covert answering tool during live employer interviews.
          </p>
        </GlassCard>

        <GlassCard tier="1" className="p-6 space-y-3">
          <h2 className="font-head font-bold text-base text-txt flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" /> 2. AI Scoring Limitations
          </h2>
          <p>
            All rubric scores, strengths, confidence indicators, and drill plans are artificial intelligence estimates. They do not guarantee job offers, hiring decisions, or specific employment outcomes.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
