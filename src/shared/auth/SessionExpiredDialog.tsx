import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const SessionExpiredDialog: React.FC = () => {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!sessionExpired) return null;

  const handleSignIn = () => {
    // Preserve current setup drafts in localStorage
    try {
      const currentDraft = sessionStorage.getItem('prepsphere_setup_draft');
      if (currentDraft) {
        localStorage.setItem('prepsphere_preserved_draft', currentDraft);
      }
    } catch {
      // LocalStorage fallback
    }

    dismissSessionExpired();
    const intended = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirectTo=${intended}`);
  };

  return (
    <Dialog open={sessionExpired} onOpenChange={(open) => !open && dismissSessionExpired()}>
      <DialogContent className="max-w-md p-6 border-white/20">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-txt">
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-xs text-txt-2 leading-relaxed pt-1">
            Your authentication token has expired. For security, live interview rooms and confidential transcripts require an active session.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 my-2 rounded-xl bg-surface/70 border border-border/20 text-xs text-txt-muted flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            Any in-progress interview configurations, rubric progress, and draft settings have been automatically preserved.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" size="sm" onClick={dismissSessionExpired}>
            Dismiss
          </Button>
          <Button variant="primary" size="sm" onClick={handleSignIn} className="gap-1.5">
            Sign In to Resume
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
