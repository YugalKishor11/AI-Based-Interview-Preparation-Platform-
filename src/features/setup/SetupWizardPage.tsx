import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Slider } from '../../shared/ui/Slider';
import { ConsentPanel } from '../../shared/ui/SystemStates';
import { sessionsRepo } from '../../data';
import {
  Layers,
  Code2,
  User,
  Terminal,
  Award,
  Activity,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  CreditCard,
  File,
  RotateCcw,
} from 'lucide-react';

const TYPES = [
  { id: 'system-design', label: 'System Design', icon: Layers, desc: 'Distributed architectures, rate limiters, caching, and scalability trade-offs.' },
  { id: 'coding', label: 'Live Coding', icon: Code2, desc: 'Algorithms, edge cases, clean code, space-time complexity.' },
  { id: 'behavioral', label: 'Behavioral & Leadership', icon: User, desc: 'STAR framework, conflict mediation, and cross-functional leadership.' },
  { id: 'technical', label: 'Deep-Dive Technical', icon: Terminal, desc: 'Language internals, concurrency race hazards, DB indexing, and networking.' },
  { id: 'hr', label: 'HR & Culture Alignment', icon: Award, desc: 'Career motivations, remote philosophy, and compensation alignment.' },
  { id: 'dsa', label: 'DSA Problem Solving', icon: Activity, desc: 'Trees, graphs, dynamic programming, and optimal data structure choices.' },
  { id: 'resume', label: 'Resume & Project Defense', icon: FileText, desc: 'Deep interrogation of past architectural decisions and metrics.' },
];

const ROLES = [
  'Staff Software Engineer',
  'Senior Distributed Systems Engineer',
  'Principal Infrastructure Architect',
  'Senior Fullstack Engineer',
  'Engineering Manager',
  'Machine Learning Infrastructure Engineer',
];

const LS_DRAFT_KEY = 'prepsphere_setup_draft';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Load draft or initialize defaults
  const [step, setStep] = useState(1);
  const [type, setType] = useState('system-design');
  const [role, setRole] = useState('Staff Software Engineer');
  const [level, setLevel] = useState<'Fresher' | 'Junior' | 'Mid' | 'Senior' | 'Staff'>('Staff');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Hard');
  const [duration, setDuration] = useState(45);
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState('English');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Autosave draft to localStorage
  useEffect(() => {
    try {
      const draft = { type, role, level, difficulty, duration, questionCount, language };
      localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [type, role, level, difficulty, duration, questionCount, language]);

  const estimatedCredits = Math.round((duration / 10) * 3 + (difficulty === 'Hard' ? 4 : 2));

  // Resume mock upload simulation
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (!p || p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 25;
      });
    }, 200);
  };

  const handleProceedToInterviewer = () => {
    navigate('/app/interview/new/interviewer');
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="demo">Step {step} of 5</Badge>
          <span className="text-xs text-txt-muted">Draft automatically saved locally</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          Configure Interview Simulation
        </h1>
      </div>

      {/* Stepper Bar */}
      <div className="flex items-center justify-between px-2 overflow-x-auto pb-2">
        {[
          { num: 1, label: 'Type' },
          { num: 2, label: 'Role & Level' },
          { num: 3, label: 'Format' },
          { num: 4, label: 'Resume' },
          { num: 5, label: 'Review' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex items-center gap-2 cursor-pointer ${
              s.num === step ? 'text-primary' : s.num < step ? 'text-emerald-400' : 'text-txt-muted'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s.num === step
                  ? 'bg-primary text-white ring-2 ring-primary/40'
                  : s.num < step
                  ? 'bg-emerald-500 text-white'
                  : 'bg-elevated text-txt-muted border border-border/30'
              }`}
            >
              {s.num < step ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
            </div>
            <span className="text-xs font-semibold whitespace-nowrap hidden sm:inline">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Step Content Form (Span 8) */}
        <div className="lg:col-span-8">
          <GlassCard tier="2" className="p-7 border border-white/15 shadow-lift">
            {/* Step 1: Interview Type */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-head text-lg font-bold text-txt">1. Select Interview Discipline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`p-4 rounded-xl border cursor-pointer text-left transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-primary ring-1 ring-primary shadow-sm'
                            : 'bg-surface/50 border-border/20 hover:border-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 text-txt">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-bold text-xs">{t.label}</span>
                        </div>
                        <p className="text-[11px] text-txt-2 leading-relaxed">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setStep(2)}>
                    Next: Role & Seniority <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Role & Level */}
            {step === 2 && (
              <div className="space-y-5">
                <h3 className="font-head text-lg font-bold text-txt">2. Target Role & Calibration</h3>
                <div>
                  <label className="block text-xs font-semibold text-txt mb-2">Target Title</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          role === r
                            ? 'bg-primary/20 border-primary text-txt'
                            : 'bg-surface/60 border-border/20 text-txt-2 hover:text-txt'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-txt mb-2">Experience Bracket</label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['Fresher', 'Junior', 'Mid', 'Senior', 'Staff'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          level === lvl
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface/60 border-border/20 text-txt-muted hover:text-txt'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-txt mb-2">Interviewer Probing Rigor</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                          difficulty === d
                            ? 'bg-secondary text-black border-secondary shadow-sm'
                            : 'bg-surface/60 border-border/20 text-txt-muted hover:text-txt'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/15">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="primary" onClick={() => setStep(3)}>
                    Next: Format & Timers <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Format (Sliders) */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-head text-lg font-bold text-txt">3. Simulation Duration & Language</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-txt">Session Duration</label>
                    <span className="font-mono font-bold text-primary tabular-nums">{duration} Minutes</span>
                  </div>
                  <Slider
                    min={10}
                    max={60}
                    step={5}
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0])}
                  />
                  <div className="flex justify-between text-[10px] text-txt-muted font-mono">
                    <span>10m (Quick Drill)</span>
                    <span>30m (Standard)</span>
                    <span>60m (Comprehensive)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-txt">Question Allocation</label>
                    <span className="font-mono font-bold text-secondary tabular-nums">{questionCount} Questions</span>
                  </div>
                  <Slider
                    min={3}
                    max={15}
                    step={1}
                    value={[questionCount]}
                    onValueChange={(v) => setQuestionCount(v[0])}
                  />
                  <div className="flex justify-between text-[10px] text-txt-muted font-mono">
                    <span>3 (Deep-dive)</span>
                    <span>7 (Standard)</span>
                    <span>15 (Rapid fire)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-txt mb-2">Speech Language Calibration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['English', 'Indian English (Tolerant)', 'Hinglish (Preview)'].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLanguage(l)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          language === l
                            ? 'bg-primary/20 border-primary text-txt'
                            : 'bg-surface/50 border-border/20 text-txt-muted hover:text-txt'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/15">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="primary" onClick={() => setStep(4)}>
                    Next: Resume Upload <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Resume Dropzone (Simulated) */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-head text-lg font-bold text-txt">4. Upload Resume / Project Specs</h3>
                  <Badge variant="demo">Demo Upload</Badge>
                </div>

                <div className="p-8 border-2 border-dashed border-border/40 rounded-2xl text-center flex flex-col items-center justify-center bg-surface/40 hover:bg-surface/70 transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleSimulateUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-txt mb-1">
                    Drag and drop resume PDF, or click to browse
                  </h4>
                  <p className="text-xs text-txt-muted max-w-sm mb-4">
                    Extracted projects and metrics are parsed locally to seed tailored interviewer probing questions.
                  </p>
                  <span className="text-[10px] text-txt-muted font-mono">
                    Supports PDF, DOCX, TXT up to 10MB
                  </span>
                </div>

                {resumeFileName && (
                  <div className="p-3.5 rounded-xl bg-surface/80 border border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs font-bold text-txt">{resumeFileName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {uploadProgress === 100 ? 'Parsed successfully (Demo)' : `Parsing ${uploadProgress}%...`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResumeFileName(null);
                        setUploadProgress(null);
                      }}
                      className="text-xs text-danger"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/15">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="primary" onClick={() => setStep(5)}>
                    Next: Review & Confirm <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Review & Consent */}
            {step === 5 && (
              <div className="space-y-6">
                <h3 className="font-head text-lg font-bold text-txt">5. Review Configuration & Consent</h3>

                <div className="p-4 rounded-xl bg-surface/80 border border-border/20 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/10">
                    <span className="text-txt-muted">Interview Discipline:</span>
                    <span className="font-bold text-txt">{type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/10">
                    <span className="text-txt-muted">Calibrated Role:</span>
                    <span className="font-bold text-txt">{role} ({level})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/10">
                    <span className="text-txt-muted">Format:</span>
                    <span className="font-bold text-txt">{duration} mins · {questionCount} questions</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/10">
                    <span className="text-txt-muted">Probing Rigor:</span>
                    <span className="font-bold text-secondary">{difficulty}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-txt-muted">Speech Protocol:</span>
                    <span className="font-bold text-txt">{language}</span>
                  </div>
                </div>

                <ConsentPanel
                  agreed={consentAgreed}
                  onToggle={setConsentAgreed}
                />

                <div className="flex justify-between pt-4 border-t border-border/15">
                  <Button variant="ghost" onClick={() => setStep(4)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!consentAgreed}
                    disabledReason={!consentAgreed ? 'Please agree to the practice consent' : undefined}
                    onClick={handleProceedToInterviewer}
                  >
                    Select Virtual Interviewer <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sticky Desktop Summary Rail (Span 4) */}
        <div className="lg:col-span-4 sticky top-24">
          <GlassCard tier="gcard" className="p-6 border border-white/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/20">
              <span className="text-xs font-bold uppercase tracking-wider text-txt">
                Simulation Summary
              </span>
              <Badge variant="demo">Preview</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-txt-muted block text-[11px]">Track</span>
                <span className="font-bold text-txt">{type}</span>
              </div>
              <div>
                <span className="text-txt-muted block text-[11px]">Seniority & Role</span>
                <span className="font-bold text-txt">{role} ({level})</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-txt-muted block text-[11px]">Duration</span>
                  <span className="font-mono font-bold text-txt">{duration}m</span>
                </div>
                <div>
                  <span className="text-txt-muted block text-[11px]">Questions</span>
                  <span className="font-mono font-bold text-txt">{questionCount} Qs</span>
                </div>
                <div>
                  <span className="text-txt-muted block text-[11px]">Rigor</span>
                  <span className="font-mono font-bold text-secondary">{difficulty}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CreditCard className="w-4 h-4" /> Estimated Cost:
              </div>
              <span className="text-sm font-mono font-extrabold text-emerald-400 tabular-nums">
                {estimatedCredits} Credits
              </span>
            </div>

            <p className="text-[11px] text-txt-muted leading-relaxed">
              Credits are only deducted once the live audio stream successfully initializes in the room.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
