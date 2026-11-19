import React, { useState } from 'react';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Switch } from '../../shared/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../shared/ui/Select';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { profileRepo } from '../../data';
import { soundManager } from '../../shared/audio/audioHelpers';
import {
  User,
  Sliders,
  Volume2,
  Sparkles,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, effects, setEffects } = useTheme();

  const [name, setName] = useState('Alex Chen');
  const [targetRole, setTargetRole] = useState('Staff Software Engineer');
  const [targetLevel, setTargetLevel] = useState('Staff');
  const [retentionMonths, setRetentionMonths] = useState('12');
  const [uiSounds, setUiSounds] = useState(soundManager.enabled);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileRepo.update({ name, targetRole, targetLevel });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExport = async () => {
    const json = await profileRepo.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepsphere-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Export complete. All local transcripts and reports downloaded as JSON.');
  };

  const handleDeleteAll = async () => {
    await profileRepo.deleteAllData();
    setDeleteConfirmOpen(false);
    window.location.reload();
  };

  const handleToggleSound = (enabled: boolean) => {
    soundManager.enabled = enabled;
    setUiSounds(enabled);
    if (enabled) soundManager.playSuccess();
  };

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-4xl mx-auto text-left">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="demo">Preferences</Badge>
          <span className="text-xs text-txt-muted">Candidate profile, audio, and privacy controls</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          Settings & Privacy
        </h1>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile configuration saved successfully.</span>
        </div>
      )}

      {/* 1. Candidate Profile */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/15">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-head font-bold text-base text-txt">Candidate Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-txt mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-txt mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-txt mb-1">Target Seniority Level</label>
            <div className="flex gap-2">
              {['Fresher', 'Junior', 'Mid', 'Senior', 'Staff'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setTargetLevel(lvl)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    targetLevel === lvl
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* 2. Appearance & Effects Governor */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/15">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="font-head font-bold text-base text-txt">Appearance & Effects Governor</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-txt block mb-1.5">Color Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`py-2 rounded-lg border font-semibold capitalize transition-all ${
                    theme === t
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-txt block mb-1.5">Visual Effects Governor</label>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'lite', 'reduced'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEffects(e)}
                  className={`py-2 rounded-lg border font-semibold capitalize transition-all ${
                    effects === e
                      ? 'bg-secondary text-black border-secondary shadow-sm'
                      : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-txt-muted mt-1.5">
              "Reduced effects" swaps glass and lights for solid surfaces for ultra-low battery consumption.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 3. Audio & Micro-interactions */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/15">
          <Volume2 className="w-5 h-5 text-warning" />
          <h2 className="font-head font-bold text-base text-txt">Audio & Sound FX</h2>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-txt block">UI Sound Feedback</span>
            <p className="text-txt-muted">
              Synthesizes subtle WebAudio chimes on question completion and button taps (off by default).
            </p>
          </div>
          <Switch checked={uiSounds} onCheckedChange={handleToggleSound} />
        </div>
      </GlassCard>

      {/* 4. Privacy, Data Retention & Erasure (GDPR Non-Negotiable) */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/15">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="font-head font-bold text-base text-txt">Privacy & Data Governance</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-txt block">Automatic Transcript Retention Period</label>
            <div className="flex gap-2">
              {['3', '6', '12', 'forever'].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setRetentionMonths(months)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    retentionMonths === months
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-surface text-txt-muted border-border/20 hover:text-txt'
                  }`}
                >
                  {months === 'forever' ? 'Never Delete' : `${months} Months`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-txt-muted">
              Transcripts older than this threshold are purged from local storage automatically.
            </p>
          </div>

          {exportNotice && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-txt text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="w-4 h-4 text-secondary" /> Export All Data (JSON)
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirmOpen(true)} className="gap-1.5">
              <Trash2 className="w-4 h-4" /> Purge All Local History
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Purge Data Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-danger mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Permanently Erase All Data?</DialogTitle>
            </div>
            <DialogDescription>
              This will irreversibly delete all local sessions, transcripts, drill plans, and customized candidate settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAll}>
              Erase Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
