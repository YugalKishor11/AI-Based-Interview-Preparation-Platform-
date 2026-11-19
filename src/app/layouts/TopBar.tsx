import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Command, Shield, CreditCard, User, LogOut, Code2 } from 'lucide-react';
import { ThemeSwitch, EffectsSwitch } from '../../shared/ui/ThemeSwitch';
import { Badge } from '../../shared/ui/Badge';
import { Kbd } from '../../shared/ui/Kbd';
import { cn } from '../../shared/lib/cn';
import { store } from '../../data/mock';

interface TopBarProps {
  onOpenCommand: () => void;
  isPublic?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommand, isPublic = false }) => {
  const navigate = useNavigate();
  const profile = store.profile;

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
          <Badge variant="demo" className="text-[9px] py-0">
            Demo
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
              to="/app/practice"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'bg-primary/20 text-txt font-bold' : 'text-txt-2 hover:text-txt'
                )
              }
            >
              Practice
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
          </nav>
        )}
      </div>

      {/* Center Command Palette Trigger (xl+ screens) */}
      <div className="hidden xl:flex items-center">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-elevated text-xs text-txt-muted border border-border/20 transition-all hover:border-primary/40 shadow-sm"
        >
          <Command className="w-3.5 h-3.5 text-primary" />
          <span>Quick actions & jump...</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      {/* Right Controls: Credits chip, FX switch, Theme switch, Profile */}
      <div className="flex items-center gap-2.5">
        {!isPublic ? (
          <>
            {/* Credits Chip */}
            <Link
              to="/app/credits"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
              title="Demo credits balance"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{profile.credits} Credits</span>
              <span className="text-[9px] opacity-75 uppercase">Demo</span>
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
          </>
        ) : (
          <>
            <EffectsSwitch />
            <ThemeSwitch />
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
      </div>
    </header>
  );
};
