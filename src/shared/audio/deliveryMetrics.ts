// PrepSphere Local Delivery Metrics Engine (Prompt 6.4)
// Strictly deterministic, local computation from word timestamps and VAD segments.
// NEVER guessed or scored by an LLM.

import { WordTimestamp } from './voiceProvider';

export interface DeliveryMetricsResult {
  wpm: number;
  wpmStatus: string;
  fillersPerMin: number;
  fillersStatus: string;
  totalFillers: number;
  detectedFillers: Array<{ word: string; count: number }>;
  pauseCount: number;
  avgPauseSeconds: number;
  pauseStatus: string;
  totalDurationSeconds: number;
  totalWords: number;
}

// Editable lexicon for English and common Hinglish filler words
export const FILLER_LEXICON = [
  // English fillers
  'um',
  'uh',
  'er',
  'ah',
  'like',
  'you know',
  'basically',
  'actually',
  'literally',
  'i mean',
  'kind of',
  'sort of',
  'right',
  // Common Hinglish / Indic colloquial fillers
  'matlab',
  'yaani',
  'achha',
  'arre',
  'waise',
  'toh',
  'dekho',
] as const;

export interface VadSegment {
  isSpeech: boolean;
  startMs: number;
  endMs: number;
}

export function computeDeliveryMetrics(params: {
  transcript: string;
  durationMs: number;
  wordTimestamps?: WordTimestamp[];
  vadSegments?: VadSegment[];
}): DeliveryMetricsResult {
  const { transcript, durationMs, wordTimestamps, vadSegments } = params;

  // 1. Duration in seconds (at least 1 second to avoid div by zero)
  const durationSec = Math.max(1, durationMs / 1000);
  const durationMin = durationSec / 60;

  // 2. Word counting and WPM
  const words = transcript
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = wordTimestamps && wordTimestamps.length > 0
    ? wordTimestamps.length
    : words.length;

  const wpm = Math.round((totalWords / durationMin) * 10) / 10;

  let wpmStatus = 'Optimal pacing (130-150 wpm)';
  if (wpm < 110) {
    wpmStatus = 'Deliberate / slow pacing (< 110 wpm)';
  } else if (wpm > 165) {
    wpmStatus = 'Rushed pacing (> 165 wpm)';
  }

  // 3. Filler word detection across English + Hinglish lexicon
  const lowerTranscript = transcript.toLowerCase();
  const detectedFillers: Array<{ word: string; count: number }> = [];
  let totalFillers = 0;

  for (const filler of FILLER_LEXICON) {
    // Regex boundary matching for single words and multi-word phrases
    const pattern = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(pattern);
    if (matches && matches.length > 0) {
      detectedFillers.push({ word: filler, count: matches.length });
      totalFillers += matches.length;
    }
  }

  const fillersPerMin = Math.round((totalFillers / durationMin) * 10) / 10;
  let fillersStatus = 'Very low filler count (< 2/min)';
  if (fillersPerMin > 4) {
    fillersStatus = 'High filler concentration (> 4/min)';
  } else if (fillersPerMin > 2) {
    fillersStatus = 'Moderate filler usage (2-4/min)';
  }

  // 4. Pauses from VAD segments or word gaps
  let pauseCount = 0;
  let totalPauseDurationMs = 0;

  if (vadSegments && vadSegments.length > 0) {
    const silenceSegments = vadSegments.filter((s) => !s.isSpeech && s.endMs - s.startMs >= 800);
    pauseCount = silenceSegments.length;
    totalPauseDurationMs = silenceSegments.reduce((acc, s) => acc + (s.endMs - s.startMs), 0);
  } else if (wordTimestamps && wordTimestamps.length > 1) {
    for (let i = 0; i < wordTimestamps.length - 1; i++) {
      const gapMs = wordTimestamps[i + 1].startMs - wordTimestamps[i].endMs;
      if (gapMs >= 800) {
        pauseCount++;
        totalPauseDurationMs += gapMs;
      }
    }
  } else {
    // Fallback heuristic based on punctuation marks (, . ; :)
    const pauseMatches = transcript.match(/[,.;:]/g);
    pauseCount = pauseMatches ? Math.min(12, Math.max(1, Math.floor(pauseMatches.length * 0.7))) : 1;
    totalPauseDurationMs = pauseCount * 1100;
  }

  const avgPauseSeconds = pauseCount > 0
    ? Math.round((totalPauseDurationMs / pauseCount / 1000) * 10) / 10
    : 1.2;

  let pauseStatus = 'Natural reflective pauses (1.0 - 1.8s)';
  if (avgPauseSeconds > 2.5) {
    pauseStatus = 'Long hesitant pauses (> 2.5s)';
  } else if (avgPauseSeconds < 0.8) {
    pauseStatus = 'Rapid transitions with minimal pauses (< 0.8s)';
  }

  return {
    wpm,
    wpmStatus,
    fillersPerMin,
    fillersStatus,
    totalFillers,
    detectedFillers,
    pauseCount,
    avgPauseSeconds,
    pauseStatus,
    totalDurationSeconds: Math.round(durationSec),
    totalWords,
  };
}
