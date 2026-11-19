import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { ConsentPanel } from '../../shared/ui/SystemStates';
import { profileRepo } from '../../data';
import {
  Sparkles,
  Target,
  UserCheck,
  Languages,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

const GOALS = [
  { id: 'promotion', title: 'Senior / Staff Promotion', desc: 'Targeting L6/Staff leveling with rigorous architectural defense' },
  { id: 'career-switch', title: 'Career Switcher', desc: 'Transitioning to distributed systems, backend, or fullstack roles' },
  { id: 'campus', title: 'Placement / Campus Season', desc: 'Campus recruitment, competitive DSA, core CS fundamentals' },
  { id: 'practice', title: 'General Voice Fluency', desc: 'Conquering interview anxiety and structuring spontaneous STAR answers' },
];

const ROLES = [
  'Staff Software Engineer',
  'Senior Backend Engineer',
  'Principal Infrastructure Architect',
  'Fullstack Engineer',
  'Engineering Manager',
  'Frontend Specialist',
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState('promotion');
  const [targetRole, setTargetRole] = useState('Staff Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Staff');
  const [language, setLanguage] = useState('English');
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!consentAgreed) return;
    setLoading(true);
    try {
      await profileRepo.update({
        targetRole,
        targetLevel: experienceLevel,
      });
      navigate('/app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/80 border border-border/30 text-xs font-semibold text-txt mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Candidate Onboarding</span>
            <Badge variant="demo">Step {step} of 3</Badge>
          </div>
          <h1 className="font-head text-3xl font-extrabold text-txt">
            Customize Your Prep Plan
          </h1>
          <p className="text-xs text-txt-2 mt-1">
            Tailor simulation difficulty, interviewer persona styles, and evaluation rubrics.
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-primary text-white ring-2 ring-primary/40'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-elevated text-txt-muted border border-border/30'
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s}
              </div>
              <span className="text-xs font-semibold text-txt hidden sm:inline">
                {s === 1 ? 'Primary Goal' : s === 2 ? 'Target Role' : 'Speech & Consent'}
              </span>
            </div>
          ))}
        </div>

        <GlassCard tier="2" className="p-8 border border-white/15 shadow-lift">
          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-txt">What is your primary interview milestone?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-4 rounded-xl border cursor-pointer text-left transition-all ${
                      selectedGoal === goal.id
                        ? 'bg-primary/15 border-primary ring-1 ring-primary'
                        : 'bg-surface/60 border-border/20 hover:border-border/50'
                    }`}
                  >
                    <div className="font-bold text-sm text-txt mb-1">{goal.title}</div>
                    <div className="text-xs text-txt-2 leading-relaxed">{goal.desc}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setStep(2)}>
                  Continue to Role Selection <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Role & Level */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-txt mb-2">Target Job Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                        targetRole === role
                          ? 'bg-primary/20 border-primary text-txt'
                          : 'bg-surface/50 border-border/20 text-txt-2 hover:text-txt'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt mb-2">Seniority Level</label>
                <div className="flex gap-2">
                  {['Fresher', 'Junior', 'Mid', 'Senior', 'Staff'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExperienceLevel(lvl)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                        experienceLevel === lvl
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface/50 border-border/20 text-txt-muted hover:text-txt'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border/15">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Continue to Preferences <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preferred Speech & Consent */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-txt mb-2">Preferred Voice & Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {['English', 'Indian English', 'Hinglish (Preview)'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        language === lang
                          ? 'bg-primary/20 border-primary text-txt'
                          : 'bg-surface/50 border-border/20 text-txt-muted hover:text-txt'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt mb-2">Evaluation Consent</label>
                <ConsentPanel
                  agreed={consentAgreed}
                  onToggle={setConsentAgreed}
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-border/15">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  variant="primary"
                  loading={loading}
                  disabled={!consentAgreed}
                  disabledReason={!consentAgreed ? 'Please accept the consent terms' : undefined}
                  onClick={handleComplete}
                >
                  Enter PrepSphere Workspace (120 Credits)
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
