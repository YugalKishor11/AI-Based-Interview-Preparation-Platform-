import React from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Badge } from '../../shared/ui/Badge';
import { Shield, Lock, Eye, Trash2, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="py-12 max-w-4xl mx-auto text-left px-6 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="ai">Privacy by Design</Badge>
          <span className="text-xs text-txt-muted">Last revised: November 2026</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          Privacy Policy & Fair Evaluation Charter
        </h1>
        <p className="text-xs text-txt-2 mt-2 leading-relaxed">
          PrepSphere is engineered around strict candidate privacy. We do not sell user data, train foundational public models on private transcripts, or infer protected characteristics.
        </p>
      </div>

      <div className="space-y-6 text-xs text-txt-2 leading-relaxed">
        <GlassCard tier="1" className="p-6 space-y-3">
          <h2 className="font-head font-bold text-base text-txt flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" /> 1. No Evaluation of Accent, Gender, or Appearance
          </h2>
          <p>
            PrepSphere evaluates responses strictly against technical competency and job rubric standards. We do not score accent, dialect, vocal timber, gender presentation, racial identity, disability status, or physical appearance.
          </p>
        </GlassCard>

        <GlassCard tier="1" className="p-6 space-y-3">
          <h2 className="font-head font-bold text-base text-txt flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> 2. Audio Recordings Off by Default
          </h2>
          <p>
            Microphone audio streams are analyzed in real time for words and pacing. Raw audio files are never stored or retained unless the candidate explicitly enables recording storage in their privacy settings.
          </p>
        </GlassCard>

        <GlassCard tier="1" className="p-6 space-y-3">
          <h2 className="font-head font-bold text-base text-txt flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-emerald-400" /> 3. Real, Immediate Deletion & Data Portability
          </h2>
          <p>
            You retain absolute ownership of your interview practice logs. At any time, you can export your entire history as structured JSON or permanently purge all records with a single click from the Settings panel.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};
