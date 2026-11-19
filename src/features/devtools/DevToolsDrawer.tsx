import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import { Switch } from '../../shared/ui/Switch';
import { Slider } from '../../shared/ui/Slider';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { mockDevState, store } from '../../data/mock';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { RotateCcw, AlertTriangle, WifiOff, Clock, Shield } from 'lucide-react';

interface DevToolsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DevToolsDrawer: React.FC<DevToolsDrawerProps> = ({ open, onOpenChange }) => {
  const { effects, setEffects, theme, setTheme } = useTheme();
  const [forceFail, setForceFail] = useState(mockDevState.forceFailure);
  const [extraLatency, setExtraLatency] = useState(mockDevState.extraLatencyMs);

  const handleToggleFail = (val: boolean) => {
    mockDevState.forceFailure = val;
    setForceFail(val);
  };

  const handleLatencyChange = (vals: number[]) => {
    const ms = vals[0] || 0;
    mockDevState.extraLatencyMs = ms;
    setExtraLatency(ms);
  };

  const handleResetData = () => {
    store.resetAll();
    window.location.reload();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>DevTools & Failure Injection</SheetTitle>
            <Badge variant="demo">Dev Only</Badge>
          </div>
          <SheetDescription>
            Simulate realistic network latencies, API crashes, rate limits, and effects governor states.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-4">
          {/* Force API Failure */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-txt flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-danger" /> Force API Errors
              </div>
              <div className="text-xs text-txt-muted">
                Simulates 500/503 network crash on next repository query
              </div>
            </div>
            <Switch checked={forceFail} onCheckedChange={handleToggleFail} />
          </div>

          {/* Simulated Extra Latency */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-txt flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-warning" /> Artificial Latency
              </div>
              <span className="text-xs font-mono font-bold text-txt tabular-nums">
                +{extraLatency} ms
              </span>
            </div>
            <Slider
              min={0}
              max={2500}
              step={100}
              value={[extraLatency]}
              onValueChange={handleLatencyChange}
            />
            <div className="flex justify-between text-[10px] text-txt-muted font-mono">
              <span>0ms (Standard)</span>
              <span>1200ms</span>
              <span>2500ms (Slow 3G)</span>
            </div>
          </div>

          {/* Effects Governor Controls */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border/20 space-y-3">
            <div className="text-sm font-semibold text-txt flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-secondary" /> Effects Governor Tier
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'lite', 'reduced'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setEffects(tier)}
                  className={`text-xs font-semibold py-2 rounded-lg border uppercase tracking-wider ${
                    effects === tier
                      ? 'bg-primary text-white border-primary'
                      : 'bg-elevated/70 text-txt-muted border-border/20 hover:text-txt'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Demo State */}
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 space-y-3">
            <div className="text-sm font-semibold text-danger">Reset Sandbox State</div>
            <p className="text-xs text-txt-2 leading-relaxed">
              Resets all locally persisted sessions, reports, drafts, and question saves back to pristine seed baseline.
            </p>
            <Button variant="danger" size="sm" onClick={handleResetData} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" /> Reset All Local Demo Data
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
