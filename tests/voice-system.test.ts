import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VOICE_REGISTRY,
  getVoiceConfig,
  SAMPLE_PREVIEW_TEXT,
  DEFAULT_VOICE_ID,
} from '../src/shared/audio/voiceRegistry';
import { ttsService } from '../src/shared/audio/ttsService';
import { handleSessionToken } from '../supabase/functions/session-token/index.ts';

describe('Voice System & TTS Engine Verification', () => {
  const MOCK_AUTH_HEADER = 'Bearer demo-test-token-alex-chen';

  // Mock SpeechSynthesis environment
  let spokenUtterances: any[] = [];
  let cancelCallCount = 0;

  beforeEach(() => {
    spokenUtterances = [];
    cancelCallCount = 0;
    ttsService.clearCache();

    const mockVoices = [
      { name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Zira', lang: 'en-US' },
      { name: 'Microsoft Sonia Online (Natural) - English (United Kingdom)', lang: 'en-GB' },
      { name: 'Microsoft Hazel', lang: 'en-GB' },
      { name: 'Microsoft Guy Online (Natural) - English (United States)', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Microsoft Ryan Online (Natural) - English (United Kingdom)', lang: 'en-GB' },
      { name: 'Microsoft George', lang: 'en-GB' },
    ];

    // Mock global SpeechSynthesis
    (global as any).window = (global as any).window || {};
    (global as any).window.speechSynthesis = {
      speak: vi.fn((utterance: any) => {
        spokenUtterances.push(utterance);
        setTimeout(() => {
          utterance.onstart?.();
          setTimeout(() => {
            utterance.onend?.();
          }, 10);
        }, 5);
      }),
      cancel: vi.fn(() => {
        cancelCallCount++;
      }),
      getVoices: vi.fn(() => mockVoices),
      onvoiceschanged: null,
    };

    (global as any).SpeechSynthesisUtterance = class MockUtterance {
      text: string;
      voice: any = null;
      pitch = 1.0;
      rate = 1.0;
      lang = 'en-US';
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  afterEach(() => {
    ttsService.stop();
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------------------
  // 1. Voice Registry & Acoustic Profile Distinction
  // ----------------------------------------------------------------
  describe('Centralized Voice Registry & Profiles', () => {
    it('defines all 4 genuinely distinct voices with unique IDs', () => {
      const voiceIds = Object.keys(VOICE_REGISTRY);
      expect(voiceIds).toContain('voice-aanya-supportive');
      expect(voiceIds).toContain('voice-meera-balanced');
      expect(voiceIds).toContain('voice-rohan-challenging');
      expect(voiceIds).toContain('voice-daniel-architect');
      expect(voiceIds.length).toBe(4);
    });

    it('ensures all 4 voices have distinct acoustic pitch and rate parameters', () => {
      const v1 = VOICE_REGISTRY['voice-aanya-supportive'];
      const v2 = VOICE_REGISTRY['voice-meera-balanced'];
      const v3 = VOICE_REGISTRY['voice-rohan-challenging'];
      const v4 = VOICE_REGISTRY['voice-daniel-architect'];

      // Voice 1: Aanya (Supportive Female)
      expect(v1.gender).toBe('female');
      expect(v1.pitch).toBe(1.15);
      expect(v1.rate).toBe(0.96);

      // Voice 2: Meera (Balanced High-Clarity Female)
      expect(v2.gender).toBe('female');
      expect(v2.pitch).toBe(1.30);
      expect(v2.rate).toBe(1.05);

      // Voice 3: Rohan (Challenging Fast-Paced Male)
      expect(v3.gender).toBe('male');
      expect(v3.pitch).toBe(0.94);
      expect(v3.rate).toBe(1.12);

      // Voice 4: Daniel (Deep Baritone Male)
      expect(v4.gender).toBe('male');
      expect(v4.pitch).toBe(0.76);
      expect(v4.rate).toBe(0.88);

      // Verify that no two voices share identical pitch or rate
      const profiles = [v1, v2, v3, v4];
      const pitchRatePairs = profiles.map((p) => `${p.pitch}_${p.rate}`);
      const uniquePairs = new Set(pitchRatePairs);
      expect(uniquePairs.size).toBe(4);
    });

    it('resolves voice configs from voice IDs, persona IDs, and handles unsupported IDs gracefully', () => {
      expect(getVoiceConfig('p1').id).toBe('voice-aanya-supportive');
      expect(getVoiceConfig('p2').id).toBe('voice-meera-balanced');
      expect(getVoiceConfig('p3').id).toBe('voice-rohan-challenging');
      expect(getVoiceConfig('p4').id).toBe('voice-daniel-architect');

      // Graceful fallback on invalid / unsupported IDs
      expect(getVoiceConfig('invalid-unknown-id').id).toBe(DEFAULT_VOICE_ID);
      expect(getVoiceConfig(null).id).toBe(DEFAULT_VOICE_ID);
    });
  });

  // ----------------------------------------------------------------
  // 2. Playback & Voice Matching Tests
  // ----------------------------------------------------------------
  describe('Independent Voice Playback & Matching', () => {
    it('Voice 1 (Aanya) generates audio using its configured voice ID and parameters', async () => {
      await ttsService.speak('Testing architectural resilience', 'voice-aanya-supportive');

      expect(spokenUtterances.length).toBe(1);
      const u = spokenUtterances[0];
      expect(u.text).toBe('Testing architectural resilience');
      expect(u.pitch).toBe(1.15);
      expect(u.rate).toBe(0.96);
      expect(u.voice?.name).toContain('Jenny');
    });

    it('Voice 2 (Meera) generates audio using its configured voice ID and parameters', async () => {
      await ttsService.speak('Testing leadership consensus', 'voice-meera-balanced');

      expect(spokenUtterances.length).toBe(1);
      const u = spokenUtterances[0];
      expect(u.text).toBe('Testing leadership consensus');
      expect(u.pitch).toBe(1.30);
      expect(u.rate).toBe(1.05);
      expect(u.voice?.name).toContain('Sonia');
    });

    it('Voice 3 (Rohan) generates audio using its configured voice ID and parameters', async () => {
      await ttsService.speak('Testing concurrency race conditions', 'voice-rohan-challenging');

      expect(spokenUtterances.length).toBe(1);
      const u = spokenUtterances[0];
      expect(u.text).toBe('Testing concurrency race conditions');
      expect(u.pitch).toBe(0.94);
      expect(u.rate).toBe(1.12);
      expect(u.voice?.name).toContain('Guy');
    });

    it('Voice 4 (Daniel) generates audio using its configured voice ID and parameters', async () => {
      await ttsService.speak('Testing distributed rate limiters', 'voice-daniel-architect');

      expect(spokenUtterances.length).toBe(1);
      const u = spokenUtterances[0];
      expect(u.text).toBe('Testing distributed rate limiters');
      expect(u.pitch).toBe(0.76);
      expect(u.rate).toBe(0.88);
      expect(u.voice?.name).toContain('Ryan');
    });

    it('uses the exact standardized preview sentence for Voice Preview', async () => {
      await ttsService.previewVoice('p1');

      expect(spokenUtterances.length).toBe(1);
      const u = spokenUtterances[0];
      expect(u.text).toBe(
        'Hello! I’m your AI interviewer. Let’s begin your interview and explore your skills.'
      );
      expect(u.pitch).toBe(1.15);
    });
  });

  // ----------------------------------------------------------------
  // 3. Audio Caching, Stale Playback Prevention & Race Conditions
  // ----------------------------------------------------------------
  describe('Audio Caching & Overwrite Safety', () => {
    it('keys audio cache with voiceId, pitch, rate, and text hash', async () => {
      const sampleText = 'Explain consistency in distributed databases.';
      await ttsService.speak(sampleText, 'voice-aanya-supportive');
      await ttsService.speak(sampleText, 'voice-rohan-challenging');

      const cacheEntries = ttsService.getCacheEntries();
      expect(cacheEntries.length).toBe(2);

      const aanyaEntry = cacheEntries.find((c) => c.voiceId === 'voice-aanya-supportive');
      const rohanEntry = cacheEntries.find((c) => c.voiceId === 'voice-rohan-challenging');

      expect(aanyaEntry).toBeDefined();
      expect(rohanEntry).toBeDefined();
      expect(aanyaEntry?.cacheKey).not.toBe(rohanEntry?.cacheKey);
      expect(aanyaEntry?.cacheKey).toContain('voice-aanya-supportive');
      expect(rohanEntry?.cacheKey).toContain('voice-rohan-challenging');
    });

    it('cancels ongoing speech immediately when switching voice or stopping', async () => {
      const p1 = ttsService.speak('Long introductory question from voice 1...', 'voice-aanya-supportive');
      // Rapid voice change
      ttsService.speak('New question from voice 3...', 'voice-rohan-challenging');

      expect(cancelCallCount).toBeGreaterThanOrEqual(1);
      await p1;
    });
  });

  // ----------------------------------------------------------------
  // 4. Backend Request Flow & Voice ID Mapping
  // ----------------------------------------------------------------
  describe('Backend Integration & Session Token Mapping', () => {
    it('returns the configured voiceId corresponding to the selected personaId', async () => {
      const req = new Request('http://localhost:54321/functions/v1/session-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MOCK_AUTH_HEADER,
        },
        body: JSON.stringify({
          sessionId: 'sess-test-voice-1',
          personaId: 'p1',
          expectedDurationMins: 30,
        }),
      });

      const res = await handleSessionToken(req, { requestId: 'req-voice-1' });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.voiceId).toBe('voice-aanya-supportive');
    });

    it('correctly maps all 4 persona IDs to distinct voice IDs in backend tokens', async () => {
      for (const [personaId, expectedVoiceId] of [
        ['p1', 'voice-aanya-supportive'],
        ['p2', 'voice-meera-balanced'],
        ['p3', 'voice-rohan-challenging'],
        ['p4', 'voice-daniel-architect'],
      ]) {
        const req = new Request('http://localhost:54321/functions/v1/session-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: MOCK_AUTH_HEADER,
          },
          body: JSON.stringify({
            sessionId: `sess-test-${personaId}`,
            personaId,
            expectedDurationMins: 30,
          }),
        });

        const res = await handleSessionToken(req, { requestId: `req-${personaId}` });
        const json = await res.json();
        expect(json.voiceId).toBe(expectedVoiceId);
      }
    });
  });
});
