import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Command, Shield, CreditCard, User, LogOut, Code2, Database } from 'lucide-react';
import { ThemeSwitch, EffectsSwitch } from '../../shared/ui/ThemeSwitch';
import { Badge } from '../../shared/ui/Badge';
import { Kbd } from '../../shared/ui/Kbd';
import { cn } from '../../shared/lib/cn';
import { store } from '../../data/mock';
import { useAuth } from '../../features/auth/AuthContext';

interface TopBarProps {
  onOpenCommand: () => void;
  isPublic?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommand, isPublic = false }) => {
  const navigate = useNavigate();
  const { profile: authProfile, isSupabase, signOut, isAuthenticated } = useAuth();
  const profile = authProfile || store.profile;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
  };

  return (
    <header className="top-bar">
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <Link to={isPublic ? '/' : '/app'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-head text-lg font-extrabold tracking-tight text-txt">
            PrepSphere
          </span>
          <Badge variant={isSupabase ? 'success' : 'demo'} className="text-[9px] py-0">
            {isSupabase ? 'Supabase' : 'Demo'}
          </Badge>
        </Link>

        {/* Desktop Route Links for App (lg+ screens, mobile nav covers <1024px) */}
        {!isPublic && (
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/app/interview/new"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Simulate
            </NavLink>
            <NavLink
              to="/app/practice"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Curated Bank
            </NavLink>
            <NavLink
              to="/app/history"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              History
            </NavLink>
            <NavLink
              to="/app/credits"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Credits
            </NavLink>
            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Settings
            </NavLink>
          </nav>
        )}
      </div>

      {/* Center Search / Command Trigger */}
      {!isPublic && (
        <div className="flex-1 max-w-sm hidden md:block mx-4">
          <button
            type="button"
            onClick={onOpenCommand}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-surface/60 hover:bg-surface border border-border/20 text-txt-muted hover:text-txt text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5" />
              <span>Search interviews, topics, settings...</span>
            </div>
            <Kbd>⌘K</Kbd>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {!isPublic ? (
          <>
            {/* Credits Chip */}
            <Link
              to="/app/credits"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
              title="Credits balance"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{profile.credits} Credits</span>
              <span className="text-[9px] opacity-75 uppercase">{isSupabase ? 'Live' : 'Demo'}</span>
            </Link>

            <EffectsSwitch />
            <ThemeSwitch />

            {/* Profile Pill */}
            <Link
              to="/app/settings"
              className="flex items-center gap-2 p-1.5 rounded-xl bg-surface hover:bg-elevated border border-border/20 text-txt transition-colors"
              title={`${profile.name} (${profile.targetRole})`}
            >
              <div className="w-7 h-7 rounded-lg bg-primary/25 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary">
                {profile.name[0]}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-txt pr-1">
                {profile.name.split(' ')[0]}
              </span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-xl bg-surface hover:bg-danger/15 border border-border/20 text-txt-muted hover:text-danger hover:border-danger/30 transition-colors"
              title="Sign out of PrepSphere"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <EffectsSwitch />
            <ThemeSwitch />
            {isAuthenticated ? (
              <Link
                to="/app"
                className="btn btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/app"
                  onClick={() => localStorage.setItem('prepsphere_guest_mode', 'true')}
                  className="btn btn-secondary text-xs py-1.5 px-3 hidden sm:inline-flex items-center gap-1.5 text-txt"
                >
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>Enter Workspace</span>
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-txt-2 hover:text-txt"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary text-xs py-1.5 px-3.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
};
