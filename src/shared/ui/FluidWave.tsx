import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

interface FluidWaveProps {
  audioLevel: number; // 0 (flat silence) to 1 (full amplitude)
  className?: string;
  height?: number;
}

export const FluidWave: React.FC<FluidWaveProps> = ({
  audioLevel,
  className,
  height = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // IntersectionObserver to pause rendering when offscreen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisibleRef.current = entry.isIntersecting;
      });
    });
    observer.observe(canvas);

    // VisibilityChange to pause when tab is inactive
    const handleVis = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const h = height;

      // Handle retina scaling
      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, h);

      const centerY = h / 2;

      // When silence: flat hairline, no phase increment
      if (audioLevel <= 0.005) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Increment wave phase when audio is active
      phaseRef.current += 0.05 + audioLevel * 0.08;

      // Three layered sine waves (Sky, Violet, Emerald)
      const layers = [
        { color: 'rgba(56, 189, 248, 0.75)', freq: 0.02, ampScale: 0.95, speed: 1.0, width: 2.2 },
        { color: 'rgba(139, 92, 246, 0.65)', freq: 0.015, ampScale: 0.75, speed: 0.8, width: 1.8 },
        { color: 'rgba(52, 211, 153, 0.55)', freq: 0.025, ampScale: 0.60, speed: 1.2, width: 1.5 },
      ];

      layers.forEach((layer) => {
        ctx.beginPath();
        const maxAmp = (h / 2 - 6) * audioLevel * layer.ampScale;

        for (let x = 0; x <= width; x += 2) {
          // Window envelope so ends taper down smoothly to flat centerline
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * layer.freq + phaseRef.current * layer.speed) * maxAmp * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioLevel, height]);

  return (
    <div className={cn('waveform-canvas-container', className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        role="img"
        aria-label={audioLevel > 0.01 ? 'Active audio level waveform' : 'Flat waveform indicating silence'}
      />
    </div>
  );
};
