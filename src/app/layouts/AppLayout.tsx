import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { FloatingDock } from '../../shared/ui/FloatingDock';
import { AmbientLights } from '../../shared/ui/AmbientLights';
import { GovernorNotificationToast } from '../../shared/ui/ThemeSwitch';
import { CommandPalette } from '../../shared/ui/CommandPalette';
import { DevToolsDrawer } from '../../features/devtools/DevToolsDrawer';
import { useGlobalHotkeys } from '../../shared/hooks/useHotkeys';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';
import { Kbd } from '../../shared/ui/Kbd';
import { SessionExpiredDialog } from '../../shared/auth/SessionExpiredDialog';

export const AppLayout: React.FC = () => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Global hotkeys hook
  useGlobalHotkeys({
    onOpenCommand: () => setCommandOpen(true),
    onOpenHelp: () => setHelpOpen(true),
  });

  return (
    <div className="app-layout">
      {/* Skip to Main Content Link for A11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-lg"
      >
        Skip to main content
      </a>

      {/* Ambient Lights Layer */}
      <AmbientLights />

      {/* Top Navigation Bar */}
      <TopBar
        onOpenCommand={() => setCommandOpen(true)}
      />

      {/* Main Page Content */}
      <main id="main-content" className="page-container relative z-10 flex-1">
        <Outlet />
      </main>

      {/* Floating Dock & Mobile Navigation */}
      <FloatingDock />

      {/* Governor Frame Degradation Quiet Toast */}
      <GovernorNotificationToast />

      {/* Command Palette Modal */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onOpenDevTools={() => setDevToolsOpen(true)}
      />

      {/* DevTools Drawer */}
      <DevToolsDrawer
        open={devToolsOpen}
        onOpenChange={setDevToolsOpen}
      />

      {/* Session Expired Re-auth Modal */}
      <SessionExpiredDialog />

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick keystrokes to navigate PrepSphere without touching the mouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Open Command Palette</span>
              <div className="flex gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Start New Interview</span>
              <Kbd>N</Kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Go to Dashboard</span>
              <div className="flex gap-1"><Kbd>G</Kbd><Kbd>D</Kbd></div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Go to Practice Bank</span>
              <div className="flex gap-1"><Kbd>G</Kbd><Kbd>P</Kbd></div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Go to History</span>
              <div className="flex gap-1"><Kbd>G</Kbd><Kbd>H</Kbd></div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/60 border border-border/15">
              <span className="text-txt-2">Toggle Shortcut Help</span>
              <Kbd>?</Kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
