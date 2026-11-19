import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';
import { Button } from '../../shared/ui/Button';
import { AlertTriangle } from 'lucide-react';

export const RoomLayout: React.FC = () => {
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'An interview is currently in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="room-layout">
      {/* Dimmed Ambient Lights for Focus */}
      <div className="ambient opacity-35" aria-hidden="true">
        <i className="orb orb-1" />
        <i className="orb orb-2" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full">
        <Outlet />
      </div>

      {/* Confirmation Dialog on Abort/Exit */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-danger mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Leave Live Interview?</DialogTitle>
            </div>
            <DialogDescription>
              Your current progress in this mock interview will be preserved as a draft session, but live evaluation will stop.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowExitConfirm(false)}>
              Resume Interview
            </Button>
            <Button variant="danger" onClick={() => navigate('/app')}>
              End & Return to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
