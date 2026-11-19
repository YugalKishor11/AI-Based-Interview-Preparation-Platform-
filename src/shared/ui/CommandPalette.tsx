import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { store } from '../../data/mock';
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  History,
  Settings,
  CreditCard,
  Sun,
  Moon,
  Zap,
  Code2,
  HelpCircle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Kbd } from './Kbd';
import { Dialog, DialogContent } from './Dialog';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDevTools?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onOpenDevTools,
}) => {
  const navigate = useNavigate();
  const { toggleTheme, toggleEffects, resolvedTheme, resolvedEffects } = useTheme();

  const runCommand = (command: () => void) => {
    command();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden border border-white/20 glass-3 shadow-lift top-[40%]">
        <Command className="w-full bg-transparent text-txt">
          <div className="flex items-center border-b border-border/20 px-3 py-2.5">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-txt-muted" />
            <Command.Input
              placeholder="Type a command or jump to screen..."
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-txt-muted disabled:cursor-not-allowed disabled:opacity-50 text-txt"
            />
            <Kbd>ESC</Kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 text-xs">
            <Command.Empty className="py-6 text-center text-xs text-txt-muted">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-txt-muted px-2 py-1.5 font-bold uppercase text-[10px] tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/app'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span>Go to Dashboard</span>
                <span className="ml-auto text-[10px] text-txt-muted flex items-center gap-1">
                  <Kbd>G</Kbd><Kbd>D</Kbd>
                </span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/interview/new'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Start New Interview</span>
                <span className="ml-auto text-[10px] text-txt-muted flex items-center gap-1">
                  <Kbd>N</Kbd>
                </span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/practice'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <Compass className="w-4 h-4 text-secondary" />
                <span>Practice Question Bank</span>
                <span className="ml-auto text-[10px] text-txt-muted flex items-center gap-1">
                  <Kbd>G</Kbd><Kbd>P</Kbd>
                </span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/history'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <History className="w-4 h-4 text-warning" />
                <span>Interview History & Trends</span>
                <span className="ml-auto text-[10px] text-txt-muted flex items-center gap-1">
                  <Kbd>G</Kbd><Kbd>H</Kbd>
                </span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/credits'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Usage & Credits</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/app/settings'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <Settings className="w-4 h-4 text-txt-2" />
                <span>Settings & Privacy</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Preferences & Effects" className="text-txt-muted px-2 py-1.5 font-bold uppercase text-[10px] tracking-wider mt-2 border-t border-border/15">
              <Command.Item
                onSelect={() => runCommand(toggleTheme)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
                <span>Toggle Theme (Switch to {resolvedTheme === 'dark' ? 'Light' : 'Dark'})</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(toggleEffects)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <Zap className="w-4 h-4 text-secondary" />
                <span>Toggle Effects (Currently {resolvedEffects})</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Developer & Quality Tools" className="text-txt-muted px-2 py-1.5 font-bold uppercase text-[10px] tracking-wider mt-2 border-t border-border/15">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dev/showcase'))}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
              >
                <Code2 className="w-4 h-4 text-primary" />
                <span>Open Design Showcase (/dev/showcase)</span>
              </Command.Item>

              {onOpenDevTools && (
                <Command.Item
                  onSelect={() => runCommand(onOpenDevTools)}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-primary/20 hover:text-txt aria-selected:bg-primary/25 text-txt"
                >
                  <Zap className="w-4 h-4 text-warning" />
                  <span>Open DevTools Failure Injection Drawer</span>
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runCommand(() => { store.resetAll(); window.location.reload(); })}
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-danger/20 hover:text-danger aria-selected:bg-danger/25 text-txt"
              >
                <RotateCcw className="w-4 h-4 text-danger" />
                <span>Reset Demo Local Data to Seed Baseline</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
