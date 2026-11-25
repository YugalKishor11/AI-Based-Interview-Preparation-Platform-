import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVoiceProvider,
  GeminiVoiceAdapter,
  DemoVoiceProvider,
  SessionToken,
  AudioState,
} from '../src/shared/audio/voiceProvider';

describe('VoiceProvider & Audio Stack Suite (Prompt 6.1 & 6.2)', () => {
  const MOCK_TOKEN: SessionToken = {
    token: 'pst_test_token_12345',
    sessionId: 'sess-test-101',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    provider: 'gemini',
    voiceConfig: {
      voiceId: 'voice-daniel-architect',
      lang: 'en-US',
      gender: 'male',
    },
    limits: {
      maxDurationMinutes: 45,
      creditsAllocated: 120,
    },
  };

  describe('VoiceProvider Interface & Factory', () => {
    it('creates GeminiVoiceAdapter when requesting gemini provider', () => {
      const provider = createVoiceProvider('gemini');
      expect(provider).toBeInstanceOf(GeminiVoiceAdapter);
    });

    it('creates DemoVoiceProvider when requesting demo provider', () => {
      const provider = createVoiceProvider('demo');
      expect(provider).toBeInstanceOf(DemoVoiceProvider);
    });
  });

  describe('GeminiVoiceAdapter Lifecycle & Operations', () => {
    let provider: GeminiVoiceAdapter;

    beforeEach(() => {
      provider = new GeminiVoiceAdapter();
    });

    it('connects cleanly with session token and transitions to connected state', async () => {
      await provider.connect(MOCK_TOKEN);
      expect(provider.getConnectionState()).toBe('connected');
    });

    it('dispatches audio state updates to registered subscribers', async () => {
      const states: AudioState[] = [];
      provider.onAudioState((s) => states.push(s));

      await provider.connect(MOCK_TOKEN);
      expect(states).toContain('idle');
    });

    it('executes barge-in interruption within 200ms and switches state to listening', async () => {
      await provider.connect(MOCK_TOKEN);

      const stateLog: AudioState[] = [];
      provider.onAudioState((s) => stateLog.push(s));

      const start = performance.now();
      provider.interrupt();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200); // Strict < 200ms barge-in rule
      expect(stateLog[stateLog.length - 1]).toBe('listening');
    });

    it('supports typed fallback with sendText and emits final turn with word timings', async () => {
      await provider.connect(MOCK_TOKEN);

      let finalTurnReceived: any = null;
      provider.onTranscriptFinal((turn) => {
        finalTurnReceived = turn;
      });

      provider.sendText('I would partition the database using consistent hashing ring.');

      expect(finalTurnReceived).toBeDefined();
      expect(finalTurnReceived.isTyped).toBe(true);
      expect(finalTurnReceived.text).toContain('consistent hashing');
      expect(finalTurnReceived.words.length).toBeGreaterThan(5);
    });

    it('records end-of-speech to first-audio latency stats', async () => {
      await provider.connect(MOCK_TOKEN);
      provider.sendText('Sample candidate response');

      const speakPromise = provider.speak('Great, let us dive into cache eviction.');
      const stats = provider.getLatencyStats();
      expect(Array.isArray(stats.eosToFirstAudioMs)).toBe(true);

      provider.interrupt();
      await speakPromise;
    });

    it('disconnects and resets connection state', async () => {
      await provider.connect(MOCK_TOKEN);
      await provider.disconnect();
      expect(provider.getConnectionState()).toBe('failed');
    });
  });

  describe('DemoVoiceProvider Fallback Operations', () => {
    let demo: DemoVoiceProvider;

    beforeEach(() => {
      demo = new DemoVoiceProvider();
    });

    it('operates in demo mode without mic hardware and supports typed responses', async () => {
      await demo.connect({ ...MOCK_TOKEN, provider: 'demo' });
      expect(demo.getConnectionState()).toBe('connected');

      let received: any = null;
      demo.onTranscriptFinal((turn) => {
        received = turn;
      });

      demo.sendText('Demo candidate typed answer');
      expect(received).toBeDefined();
      expect(received.text).toBe('Demo candidate typed answer');
    });
  });
});
