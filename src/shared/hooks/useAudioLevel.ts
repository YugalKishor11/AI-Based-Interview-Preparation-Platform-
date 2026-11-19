import { useState, useEffect, useRef } from 'react';

/**
 * Hook to calculate smoothed audio RMS level from an AnalyserNode
 * Attack: 40ms, Release: 220ms.
 * At silence, level returns 0.
 */
export function useAudioLevel(analyserNode: AnalyserNode | null): number {
  const [level, setLevel] = useState<number>(0);
  const smoothedLevelRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyserNode) {
      setLevel(0);
      smoothedLevelRef.current = 0;
      return;
    }

    const dataArray = new Uint8Array(analyserNode.fftSize);

    const checkLevel = () => {
      const now = performance.now();
      const dt = Math.max(now - lastTimeRef.current, 1);
      lastTimeRef.current = now;

      analyserNode.getByteTimeDomainData(dataArray);

      // Compute RMS
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rawRms = Math.sqrt(sumSquares / dataArray.length);

      // Noise floor threshold (real silence detection)
      const targetRms = rawRms < 0.015 ? 0 : Math.min(rawRms * 3.5, 1);

      // Smooth with attack (40ms) and release (220ms)
      const tau = targetRms > smoothedLevelRef.current ? 40 : 220;
      const alpha = 1 - Math.exp(-dt / tau);

      smoothedLevelRef.current += (targetRms - smoothedLevelRef.current) * alpha;

      // Snap to zero if very low to guarantee flat hairline at silence
      if (smoothedLevelRef.current < 0.005) {
        smoothedLevelRef.current = 0;
      }

      setLevel(smoothedLevelRef.current);
      animFrameRef.current = requestAnimationFrame(checkLevel);
    };

    animFrameRef.current = requestAnimationFrame(checkLevel);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyserNode]);

  return level;
}
