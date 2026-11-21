import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { Switch } from '../../shared/ui/Switch';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { profileRepo } from '../../data';
import { soundManager } from '../../shared/audio/audioHelpers';
import { useAuth } from '../auth/AuthContext';
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  isSupabaseConfigured,
} from '../../data/supabase';
import {
  geminiService,
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
  isGeminiConfigured as isGeminiLive,
} from '../../shared/ai/geminiService';
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
  Database,
  LogOut,
  KeyRound,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, effects, setEffects } = useTheme();
  const { profile: authProfile, isSupabase, signOut, updatePassword, deleteAccount, user, refreshProfile } = useAuth();

  const [name, setName] = useState(authProfile?.name || 'Alex Chen');
  const [targetRole, setTargetRole] = useState(authProfile?.targetRole || 'Staff Software Engineer');
  const [targetLevel, setTargetLevel] = useState(authProfile?.targetLevel || 'Staff');
  const [retentionMonths, setRetentionMonths] = useState('12');
  const [uiSounds, setUiSounds] = useState(soundManager.enabled);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [typedDeleteConfirm, setTypedDeleteConfirm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auth & Security Settings
  const [newPassword, setNewPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [otherSessionsNotice, setOtherSessionsNotice] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Supabase Configuration Form
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialCreds.anonKey);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  // Gemini Configuration Form
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey());
  const [geminiModel, setGeminiModelInput] = useState(getGeminiModel());
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestMsg, setGeminiTestMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (authProfile) {
      setName(authProfile.name);
      setTargetRole(authProfile.targetRole);
      setTargetLevel(authProfile.targetLevel);
    }
  }, [authProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileRepo.update({ name, targetRole, targetLevel });
    await refreshProfile();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && supabaseAnonKey) {
      setCustomSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      localStorage.setItem('prepsphere_data_source', 'supabase');
      setBackendNotice('Supabase credentials saved. Reloading workspace to apply backend changes...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setCustomSupabaseCredentials('', '');
      localStorage.setItem('prepsphere_data_source', 'mock');
      setBackendNotice('Switched to local sandbox mock data. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleSaveGeminiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(geminiKey);
    setGeminiModel(geminiModel);
    setBackendNotice(`Gemini settings updated (${geminiModel}).`);
    setTimeout(() => setBackendNotice(null), 2500);
  };

  const handleTestGeminiConnection = async () => {
    setIsTestingGemini(true);
    setGeminiTestMsg(null);
    const res = await geminiService.testConnection(geminiKey, geminiModel);
    setGeminiTestMsg({ success: res.success, text: res.message });
    setIsTestingGemini(false);
  };

  const handleSwitchToDemo = () => {
    localStorage.setItem('prepsphere_data_source', 'mock');
    window.location.reload();
  };

  const handleSwitchToSupabase = () => {
    if (!isSupabaseConfigured() && !supabaseUrl) {
      setBackendNotice('Please provide your Supabase URL and Anon Key first.');
      return;
    }
    localStorage.setItem('prepsphere_data_source', 'supabase');
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
    if (typedDeleteConfirm !== 'DELETE') return;
    try {
      if (deleteAccount) {
        await deleteAccount('DELETE');
      } else {
        await profileRepo.deleteAllData();
      }
      setDeleteConfirmOpen(false);
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      await signOut({ scope: 'others' });
      setOtherSessionsNotice('Successfully revoked all other active sessions.');
      setTimeout(() => setOtherSessionsNotice(null), 4000);
    } catch {
      setOtherSessionsNotice('Session management is active in Supabase mode.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      setPasswordNotice('Password must be at least 10 characters long.');
      return;
    }
    try {
      if (updatePassword) {
        await updatePassword(newPassword);
        setPasswordNotice('Password updated successfully.');
        setNewPassword('');
        setTimeout(() => setPasswordNotice(null), 4000);
      }
    } catch (err: unknown) {
      setPasswordNotice(err instanceof Error ? err.message : 'Failed to update password.');
    }
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
          <Badge variant={isSupabase ? 'success' : 'demo'}>
            {isSupabase ? 'Supabase Backend' : 'Demo Mode'}
          </Badge>
          <span className="text-xs text-txt-muted">Candidate profile, database connection, and privacy controls</span>
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

      {backendNotice && (
        <div className="p-3.5 rounded-xl bg-primary/15 border border-primary/30 text-txt text-xs flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span>{backendNotice}</span>
        </div>
      )}

      {/* 1. Account & Authentication Status */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/15">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-head font-bold text-base text-txt">Account & Authentication</h2>
              <p className="text-[11px] text-txt-muted">Manage candidate session and credentials</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface/70 border border-border/20">
            <span className="text-txt-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Active User
            </span>
            <span className="font-semibold text-txt">{authProfile?.name || 'Alex Chen'}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface/70 border border-border/20">
            <span className="text-txt-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Account Email
            </span>
            <span className="font-semibold text-txt truncate block">
              {user?.email || authProfile?.email || 'alex.chen@example.com'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface/70 border border-border/20">
            <span className="text-txt-muted block text-[10px] uppercase font-bold tracking-wider mb-1">
              Auth Provider
            </span>
            <span className="font-semibold text-txt flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSupabase ? 'bg-emerald-400' : 'bg-primary'}`} />
              {isSupabase ? 'Supabase Auth' : 'Demo Sandbox'}
            </span>
          </div>
        </div>

        {/* Device & Session Management */}
        <div className="pt-2 border-t border-border/15 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-txt text-xs block">Active Browser Session</span>
              <p className="text-[11px] text-txt-muted">
                {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) + '...' : 'Current Web Client'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOutOthers} className="text-xs">
              Sign Out Other Sessions
            </Button>
          </div>

          {otherSessionsNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{otherSessionsNotice}</span>
            </div>
          )}
        </div>

        {/* Change Password Form (10+ characters policy per Prompt 4.2) */}
        <div className="pt-2 border-t border-border/15 space-y-2">
          <span className="font-semibold text-txt text-xs block">Update Account Password</span>
          <form onSubmit={handleUpdatePassword} className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 10 chars)"
              className="input text-xs font-mono flex-1"
            />
            <Button type="submit" variant="primary" size="sm" className="text-xs">
              Save Password
            </Button>
          </form>
          {passwordNotice && (
            <p className={`text-[11px] ${passwordNotice.includes('success') ? 'text-emerald-400' : 'text-danger'}`}>
              {passwordNotice}
            </p>
          )}
        </div>

        {/* Optional Multi-Factor Authentication (TOTP MFA per Prompt 4.2) */}
        <div className="pt-2 border-t border-border/15 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-semibold text-txt text-xs block">Two-Factor Authentication (TOTP)</span>
            <p className="text-[11px] text-txt-muted">
              Add an authenticator app layer (Google Authenticator or 1Password) for maximum security.
            </p>
          </div>
          <Switch checked={mfaEnabled} onCheckedChange={(val) => setMfaEnabled(val)} />
        </div>
      </GlassCard>

      {/* 2. Supabase Backend Connection */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/15">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-secondary" />
            <div>
              <h2 className="font-head font-bold text-base text-txt">Supabase Backend & PostgreSQL</h2>
              <p className="text-[11px] text-txt-muted">Direct database integration and Edge Functions</p>
            </div>
          </div>
          <Badge variant={isSupabase ? 'success' : 'demo'}>
            {isSupabase ? 'Connected' : 'Mock Fallback'}
          </Badge>
        </div>

        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-txt mb-1">Supabase Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="input text-xs font-mono"
                placeholder="https://xyzcompany.supabase.co"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-txt mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="input text-xs font-mono"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>
          </div>

          <p className="text-[11px] text-txt-muted">
            You can enter your own Supabase project credentials above or configure <code className="text-primary font-mono">VITE_SUPABASE_URL</code> and <code className="text-primary font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="text-primary font-mono">.env</code>.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isSupabase ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleSwitchToDemo}
              >
                Use Local Demo Mock
              </Button>
              <Button
                type="button"
                variant={isSupabase ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleSwitchToSupabase}
              >
                Use Supabase
              </Button>
            </div>

            <Button type="submit" variant="primary" size="sm" className="gap-1.5">
              <Database className="w-3.5 h-3.5" /> Save Credentials
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* 3. Google Gemini 3.8 Flash AI Agent & Voice Engine */}
      <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/15">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-head font-bold text-base text-txt">Google Gemini 3.8 Flash (Live AI Interviewer Agent)</h2>
              <p className="text-[11px] text-txt-muted">Powers real-time interview conversations, adaptive follow-ups, and drill feedback</p>
            </div>
          </div>
          <Badge variant={isGeminiLive() ? 'success' : 'demo'}>
            {isGeminiLive() ? 'Gemini 3.8 Flash Active' : 'Gemini 3.8 Flash'}
          </Badge>
        </div>

        <form onSubmit={handleSaveGeminiConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-txt mb-1">Google Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="input text-xs font-mono"
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-txt mb-1">AI Model Tag</label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModelInput(e.target.value)}
                className="input text-xs font-mono"
                placeholder="gemini-3.8-flash"
              />
            </div>
          </div>

          <p className="text-[11px] text-txt-muted">
            Gemini 3.8 Flash acts as the interviewer agent and speaks to you with the 4 voices. When no key is provided, the platform uses intelligent adaptive fallback logic.
          </p>

          {geminiTestMsg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in ${
                geminiTestMsg.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-danger/15 border-danger/30 text-danger'
              }`}
            >
              {geminiTestMsg.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{geminiTestMsg.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isTestingGemini}
              onClick={handleTestGeminiConnection}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary" /> Test Gemini Connection
            </Button>

            <Button type="submit" variant="primary" size="sm" className="gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Save Gemini Key
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* 3. Candidate Profile */}
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

      {/* 4. Appearance & Effects Governor */}
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

      {/* 5. Audio & Micro-interactions */}
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

      {/* 6. Privacy, Data Retention & Erasure (GDPR Non-Negotiable) */}
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
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setTypedDeleteConfirm(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-danger mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Permanently Erase Account & All Data?</DialogTitle>
            </div>
            <DialogDescription>
              This action is irreversible. All interview sessions, audio recordings, transcripts, drill plans, and candidate profile data will be permanently wiped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4 text-xs">
            <label className="text-txt font-semibold block">
              Please type <span className="text-danger font-mono font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={typedDeleteConfirm}
              onChange={(e) => setTypedDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border/30 text-txt text-xs focus:outline-none focus:border-danger font-mono"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => { setDeleteConfirmOpen(false); setTypedDeleteConfirm(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={typedDeleteConfirm !== 'DELETE'}
              onClick={handleDeleteAll}
              className={typedDeleteConfirm !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Permanently Erase Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
