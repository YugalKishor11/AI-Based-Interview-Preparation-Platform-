// Production-Grade Centralized Text-to-Speech (TTS) Engine
// Supports 4 distinct voice options, audio caching, race condition prevention,
// and seamless preview capabilities.

import {
  VoiceConfig,
  VOICE_REGISTRY,
  getVoiceConfig,
  SAMPLE_PREVIEW_TEXT,
  DEFAULT_VOICE_ID,
} from './voiceRegistry';

export interface TTSState {
  isSpeaking: boolean;
  isLoading: boolean;
  activeVoiceId: string | null;
  error: string | null;
}

export type TTSListener = (state: TTSState) => void;

interface AudioCacheEntry {
  cacheKey: string;
  voiceId: string;
  pitch: number;
  rate: number;
  textHash: string;
  timestamp: number;
}

class TTSService {
  private currentRequestId = 0;
  private cachedEntries = new Map<string, AudioCacheEntry>();
  private state: TTSState = {
    isSpeaking: false,
    isLoading: false,
    activeVoiceId: null,
    error: null,
  };
  private listeners = new Set<TTSListener>();
  private loadedVoices: SpeechSynthesisVoice[] = [];
  private voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

  constructor() {
    this.initVoices();
  }

  private initVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve([]);
    }

    if (this.voicesLoadedPromise) {
      return this.voicesLoadedPromise;
    }

    this.voicesLoadedPromise = new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.loadedVoices = voices;
        resolve(voices);
        return;
      }

      const onVoicesChanged = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          this.loadedVoices = v;
          window.speechSynthesis.onvoiceschanged = null;
          resolve(v);
        }
      };

      window.speechSynthesis.onvoiceschanged = onVoicesChanged;

      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        const fallback = window.speechSynthesis.getVoices();
        this.loadedVoices = fallback;
        resolve(fallback);
      }, 500);
    });

    return this.voicesLoadedPromise;
  }

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private setState(partial: Partial<TTSState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): TTSState {
    return { ...this.state };
  }

  private generateTextHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  private buildCacheKey(config: VoiceConfig, text: string): string {
    const textHash = this.generateTextHash(text);
    return `${config.id}::${config.pitch.toFixed(2)}::${config.rate.toFixed(2)}::${textHash}`;
  }

  /**
   * Matches browser SpeechSynthesisVoice to the configured voice profile.
   */
  private matchBrowserVoice(
    config: VoiceConfig,
    availableVoices: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | null {
    if (availableVoices.length === 0) return null;

    // 1. Try exact or substring match in preferredVoiceNames
    for (const pref of config.preferredVoiceNames) {
      const exactMatch = availableVoices.find(
        (v) => v.name.toLowerCase() === pref.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      const partialMatch = availableVoices.find((v) =>
        v.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (partialMatch) return partialMatch;
    }

    // 2. Try match by language and gender hints in name
    const langVoices = availableVoices.filter(
      (v) => v.lang.toLowerCase().startsWith(config.lang.toLowerCase().split('-')[0])
    );

    if (langVoices.length > 0) {
      const genderKeywords =
        config.gender === 'female'
          ? ['female', 'woman', 'zira', 'jenny', 'sonia', 'samantha', 'karen', 'victoria', 'aria']
          : ['male', 'man', 'david', 'guy', 'george', 'ryan', 'alex', 'fred', 'daniel', 'mark'];

      const genderMatch = langVoices.find((v) =>
        genderKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (genderMatch) return genderMatch;

      return langVoices[0];
    }

    return availableVoices[0] || null;
  }

  /**
   * Stops any ongoing playback immediately.
   */
  public stop(): void {
    this.currentRequestId++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.setState({
      isSpeaking: false,
      isLoading: false,
      activeVoiceId: null,
      error: null,
    });
  }

  /**
   * Core speech playback method.
   * Cancels prior utterances, validates voice config, tracks cache key,
   * and prevents race conditions across voice switches.
   */
  public async speak(
    text: string,
    voiceOrPersonaId?: string | null,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: Error) => void;
    }
  ): Promise<void> {
    if (!text || !text.trim()) {
      return;
    }

    // Immediately stop any prior speech and increment request counter
    this.stop();
    const requestId = this.currentRequestId;

    const config = getVoiceConfig(voiceOrPersonaId);
    const cacheKey = this.buildCacheKey(config, text);

    // Register cache metadata
    this.cachedEntries.set(cacheKey, {
      cacheKey,
      voiceId: config.id,
      pitch: config.pitch,
      rate: config.rate,
      textHash: this.generateTextHash(text),
      timestamp: Date.now(),
    });

    this.setState({
      isLoading: true,
      activeVoiceId: config.id,
      error: null,
    });

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // Mock / fallback environment
      this.setState({ isLoading: false, isSpeaking: true });
      options?.onStart?.();
      await new Promise((r) => setTimeout(r, Math.min(text.length * 40, 2000)));
      if (this.currentRequestId === requestId) {
        this.setState({ isSpeaking: false, activeVoiceId: null });
        options?.onEnd?.();
      }
      return;
    }

    const availableVoices = await this.initVoices();

    // Check if another request superseded this one while loading voices
    if (this.currentRequestId !== requestId) {
      return;
    }

    return new Promise<void>((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = config.pitch;
        utterance.rate = config.rate;
        utterance.lang = config.lang;

        const matchedVoice = this.matchBrowserVoice(config, availableVoices);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => {
          if (this.currentRequestId !== requestId) return;
          this.setState({ isLoading: false, isSpeaking: true, error: null });
          options?.onStart?.();
        };

        utterance.onend = () => {
          if (this.currentRequestId !== requestId) return;
          this.setState({ isSpeaking: false, isLoading: false, activeVoiceId: null });
          options?.onEnd?.();
          resolve();
        };

        utterance.onerror = (e) => {
          if (this.currentRequestId !== requestId) return;
          // 'canceled' or 'interrupted' is normal when switching or stopping
          if (e.error === 'canceled' || e.error === 'interrupted') {
            this.setState({ isSpeaking: false, isLoading: false, activeVoiceId: null });
            resolve();
            return;
          }
          const err = new Error(`TTS synthesis error: ${e.error}`);
          this.setState({ isSpeaking: false, isLoading: false, error: err.message });
          options?.onError?.(err);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.setState({ isSpeaking: false, isLoading: false, error: error.message });
        options?.onError?.(error);
        resolve();
      }
    });
  }

  /**
   * Previews a voice with the standard required sentence:
   * "Hello! I’m your AI interviewer. Let’s begin your interview and explore your skills."
   */
  public async previewVoice(
    voiceOrPersonaId: string,
    customText?: string
  ): Promise<void> {
    const textToSpeak = customText || SAMPLE_PREVIEW_TEXT;
    return this.speak(textToSpeak, voiceOrPersonaId);
  }

  /**
   * Returns current cache diagnostics.
   */
  public getCacheEntries(): AudioCacheEntry[] {
    return Array.from(this.cachedEntries.values());
  }

  public clearCache(): void {
    this.cachedEntries.clear();
  }

  public getLoadedVoices(): SpeechSynthesisVoice[] {
    return this.loadedVoices;
  }
}

export const ttsService = new TTSService();
