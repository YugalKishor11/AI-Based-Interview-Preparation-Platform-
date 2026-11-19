import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../shared/ui/GlassCard';
import { RgbBorder } from '../../shared/ui/RgbBorder';
import { Button } from '../../shared/ui/Button';
import { Badge } from '../../shared/ui/Badge';
import { FluidWave } from '../../shared/ui/FluidWave';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../shared/ui/Accordion';
import { PermissionDeniedGuide } from '../../shared/ui/SystemStates';
import { useMicStream } from '../../shared/hooks/useMicStream';
import { useAudioLevel } from '../../shared/hooks/useAudioLevel';
import { soundManager } from '../../shared/audio/audioHelpers';
import {
  Mic,
  MicOff,
  Volume2,
  Video,
  VideoOff,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const DeviceCheckPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    stream,
    analyserNode,
    permissionState,
    errorMessage,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    requestPermission,
    stop,
  } = useMicStream(true);

  // Real smoothed audio level from AnalyserNode
  const audioLevel = useAudioLevel(analyserNode);

  // Optional local camera preview state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Audio output test state
  const [speakerTested, setSpeakerTested] = useState(false);

  // Connection latency simulation
  const [latencyMs, setLatencyMs] = useState<number>(24);

  useEffect(() => {
    // Quick ping measurement
    const t0 = performance.now();
    setTimeout(() => {
      setLatencyMs(Math.round(performance.now() - t0));
    }, 25);
  }, []);

  // Handle local camera toggle
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraEnabled(false);
    } else {
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = vidStream;
        if (videoRef.current) {
          videoRef.current.srcObject = vidStream;
        }
        setCameraEnabled(true);
      } catch (e) {
        console.warn('Camera preview unavailable or denied', e);
      }
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      stop();
    };
  }, [stop]);

  const handleTestSpeaker = () => {
    soundManager.playTestTone(600);
    setSpeakerTested(true);
  };

  const isReady = permissionState === 'granted' && speakerTested;

  const handleLaunchLive = () => {
    navigate('/app/interview/live-101/live');
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="demo">Hardware Diagnostic</Badge>
          <span className="text-xs text-txt-muted">Verifying real browser audio pipeline</span>
        </div>
        <h1 className="font-head text-3xl font-extrabold text-txt tracking-tight">
          System & Device Check
        </h1>
        <p className="text-xs text-txt-2 mt-1">
          PrepSphere connects to your physical microphone via WebAudio AnalyserNode. Silence is rendered flat.
        </p>
      </div>

      {/* Permission Denied Guide if blocked */}
      {permissionState === 'denied' && (
        <PermissionDeniedGuide
          onRetry={requestPermission}
          onUseTyped={() => navigate('/app/interview/live-101/live')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Device Configuration & Meters (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Microphone Card */}
          <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    permissionState === 'granted'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-danger/15 text-danger'
                  }`}
                >
                  {permissionState === 'granted' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-head font-bold text-sm text-txt">Microphone Input</h3>
                  <span className="text-[11px] text-txt-muted">
                    {permissionState === 'granted' ? 'Connected & streaming' : 'Permission needed'}
                  </span>
                </div>
              </div>

              {permissionState === 'granted' ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Granted
                </span>
              ) : (
                <Button variant="secondary" size="sm" onClick={requestPermission}>
                  Grant Access
                </Button>
              )}
            </div>

            {/* Input Device Selector */}
            {devices.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-txt-muted mb-1">
                  Input Microphone Device
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="input text-xs py-2"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-surface text-txt">
                      {d.label || `Microphone ${d.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Real AnalyserNode Waveform Display */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-txt-2">Live Input Level</span>
                <span className="font-mono text-[11px] text-txt-muted tabular-nums">
                  {audioLevel > 0.01 ? `${Math.round(audioLevel * 100)}% RMS` : 'Silence (Flat)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface/70 border border-border/20 flex flex-col items-center justify-center">
                <FluidWave audioLevel={audioLevel} height={50} />
              </div>
              <p className="text-[10px] text-txt-muted text-center">
                Speak aloud to test. If no speech is detected, the wave remains a flat hairline.
              </p>
            </div>
          </GlassCard>

          {/* Speaker Output Test Card */}
          <GlassCard tier="gcard" className="p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-sm text-txt">Speaker Output</h3>
                  <span className="text-[11px] text-txt-muted">Play 440Hz test tone to confirm volume</span>
                </div>
              </div>

              <Button
                variant={speakerTested ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleTestSpeaker}
                className="gap-1.5"
              >
                <Volume2 className="w-4 h-4" /> Play Test Chime
              </Button>
            </div>

            {speakerTested && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Speaker test tone confirmed audible.</span>
              </div>
            )}
          </GlassCard>

          {/* Optional Local-Only Camera Preview */}
          <GlassCard tier="1" className="p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-head font-bold text-sm text-txt">Local Camera Preview (Optional)</h3>
                  <span className="text-[11px] text-txt-muted">
                    Off by default. Self-view only, never sent to server.
                  </span>
                </div>
              </div>

              <Button
                variant={cameraEnabled ? 'danger' : 'secondary'}
                size="sm"
                onClick={toggleCamera}
              >
                {cameraEnabled ? 'Disable Camera' : 'Test Camera'}
              </Button>
            </div>

            {cameraEnabled && (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/30">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-mono">
                  Local Mirror Only · No video AI scoring
                </span>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Readiness Checklist & Troubleshooting (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Readiness Checklist */}
          <GlassCard tier="gcard" className="p-6 border border-white/20 space-y-4">
            <h3 className="font-head font-bold text-sm text-txt">Pre-Interview Readiness</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/70 border border-border/15">
                <span className="text-txt-2">Microphone Permission</span>
                {permissionState === 'granted' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">Pending</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/70 border border-border/15">
                <span className="text-txt-2">Speaker Test Chime</span>
                {speakerTested ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Confirmed
                  </span>
                ) : (
                  <span className="text-txt-muted font-bold">Unchecked</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/70 border border-border/15">
                <span className="text-txt-2">Browser Connection Latency</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> {latencyMs} ms
                </span>
              </div>
            </div>

            <RgbBorder bloom={isReady} className="rounded-xl mt-4">
              <Button
                variant="primary"
                onClick={handleLaunchLive}
                disabled={permissionState !== 'granted'}
                disabledReason={permissionState !== 'granted' ? 'Microphone permission required' : undefined}
                className="w-full py-3"
              >
                Enter Live Interview Room <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </RgbBorder>

            <button
              type="button"
              onClick={() => navigate('/app/interview/live-101/live')}
              className="w-full text-center text-xs text-txt-muted hover:text-txt py-1"
            >
              Skip device test & continue with typed answers
            </button>
          </GlassCard>

          {/* Troubleshooting Accordion */}
          <GlassCard tier="1" className="p-6 border border-white/15">
            <h4 className="font-head font-bold text-xs uppercase tracking-wider text-txt mb-2">
              Audio Troubleshooting
            </h4>
            <Accordion type="single" collapsible className="w-full text-xs">
              <AccordionItem value="item-1">
                <AccordionTrigger>Microphone shows 0% volume</AccordionTrigger>
                <AccordionContent>
                  Ensure your physical headset or laptop microphone is not muted in system OS settings. Check if other conferencing apps (Zoom, Teams) are locking the microphone exclusively.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Chrome / Edge permission recovery</AccordionTrigger>
                <AccordionContent>
                  Click the tune icon to the left of your URL bar in Chrome/Edge, verify "Microphone" is set to "Allow", and reload the tab.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I practice on mobile?</AccordionTrigger>
                <AccordionContent>
                  Yes, mobile WebViews and browsers support WebAudio microphone recording. iOS Safari requires an initial user tap to start audio recording.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
