import {
  SessionsRepo,
  ReportsRepo,
  QuestionsRepo,
  ProfileRepo,
  AuthRepo,
  ProgressRepo,
  InterviewEngine,
  VoiceProvider,
  AudioState,
  ConnectionState,
} from '../repos/interfaces';
import {
  Profile,
  Persona,
  InterviewPlan,
  Session,
  Report,
  Question,
  ProgressSnapshot,
} from '../contracts';
import {
  SEED_PROFILE,
  SEED_PERSONAS,
  SEED_SESSIONS,
  SEED_REPORTS,
  SEED_QUESTIONS,
  SEED_PROGRESS_SNAPSHOTS,
} from './seed';

// Local storage keys
const LS_SESSIONS_KEY = 'prepsphere_mock_sessions';
const LS_REPORTS_KEY = 'prepsphere_mock_reports';
const LS_QUESTIONS_KEY = 'prepsphere_mock_questions';
const LS_PROFILE_KEY = 'prepsphere_mock_profile';

// Devtools injectable failure flags
export const mockDevState = {
  forceFailure: false,
  forceOffline: false,
  extraLatencyMs: 0,
};

const delay = (ms = 250) =>
  new Promise((resolve, reject) => {
    const total = ms + mockDevState.extraLatencyMs;
    setTimeout(() => {
      if (mockDevState.forceFailure) {
        reject(new Error('DevTools simulated failure: Service unavailable'));
      } else {
        resolve(true);
      }
    }, total);
  });

// --- In-Memory & LocalStorage Storage ---
class MockDataStore {
  sessions: Session[];
  reports: Record<string, Report>;
  questions: Question[];
  profile: Profile;

  constructor() {
    this.sessions = this.load(LS_SESSIONS_KEY, SEED_SESSIONS);
    this.reports = this.load(LS_REPORTS_KEY, SEED_REPORTS);
    this.questions = this.load(LS_QUESTIONS_KEY, SEED_QUESTIONS);
    this.profile = this.load(LS_PROFILE_KEY, SEED_PROFILE);
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  saveSessions() {
    try {
      localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(this.sessions));
    } catch {}
  }
  saveReports() {
    try {
      localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(this.reports));
    } catch {}
  }
  saveQuestions() {
    try {
      localStorage.setItem(LS_QUESTIONS_KEY, JSON.stringify(this.questions));
    } catch {}
  }
  saveProfile() {
    try {
      localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(this.profile));
    } catch {}
  }
  resetAll() {
    this.sessions = [...SEED_SESSIONS];
    this.reports = { ...SEED_REPORTS };
    this.questions = [...SEED_QUESTIONS];
    this.profile = { ...SEED_PROFILE };
    this.saveSessions();
    this.saveReports();
    this.saveQuestions();
    this.saveProfile();
  }
}

export const store = new MockDataStore();

// --- Repositories ---

export class MockSessionsRepo implements SessionsRepo {
  async list(params?: { q?: string; type?: string; limit?: number }): Promise<Session[]> {
    await delay(220);
    let list = [...store.sessions];
    if (params?.type && params.type !== 'all') {
      list = list.filter((s) => s.type.toLowerCase().includes(params.type!.toLowerCase()));
    }
    if (params?.q) {
      const query = params.q.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(query));
    }
    if (params?.limit) {
      list = list.slice(0, params.limit);
    }
    return list;
  }

  async get(id: string): Promise<Session> {
    await delay(180);
    const session = store.sessions.find((s) => s.id === id);
    if (!session) throw new Error(`Session with id ${id} not found`);
    return session;
  }

  async create(plan: InterviewPlan, personaId: string): Promise<Session> {
    await delay(320);
    const newId = `s-${Date.now()}`;
    const newSession: Session = {
      id: newId,
      title: `${plan.targetRole} (${plan.type})`,
      type: plan.type,
      personaId,
      score: 82,
      durationMins: plan.durationMinutes,
      date: 'Just now',
      daysAgo: 0,
      reportId: `rep-${newId}`,
      isDemo: true,
    };
    store.sessions.unshift(newSession);
    store.saveSessions();
    return newSession;
  }

  async complete(id: string): Promise<Report> {
    await delay(450);
    const existing = store.reports[`rep-${id}`] || store.reports['rep-101'];
    return existing;
  }
}

export class MockReportsRepo implements ReportsRepo {
  async get(id: string): Promise<Report> {
    await delay(240);
    const report = store.reports[id] || store.reports['rep-101'];
    return report;
  }

  async dispute(scoreId: string, reason: string): Promise<{ success: boolean; message: string }> {
    await delay(300);
    return {
      success: true,
      message: `Score evaluation query for ${scoreId} recorded. Human review queued with reason: "${reason}".`,
    };
  }
}

export class MockQuestionsRepo implements QuestionsRepo {
  async search(params?: { query?: string; topic?: string; level?: string; savedOnly?: boolean }): Promise<Question[]> {
    await delay(180);
    let list = [...store.questions];
    if (params?.topic && params.topic !== 'all') {
      list = list.filter((q) => q.topic.toLowerCase() === params.topic!.toLowerCase());
    }
    if (params?.level && params.level !== 'all') {
      list = list.filter((q) => q.level.toLowerCase() === params.level!.toLowerCase());
    }
    if (params?.savedOnly) {
      list = list.filter((q) => q.saved);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async get(id: string): Promise<Question> {
    await delay(150);
    const q = store.questions.find((item) => item.id === id);
    if (!q) throw new Error(`Question ${id} not found`);
    return q;
  }

  async toggleSave(id: string): Promise<boolean> {
    await delay(120);
    const q = store.questions.find((item) => item.id === id);
    if (q) {
      q.saved = !q.saved;
      store.saveQuestions();
      return q.saved;
    }
    return false;
  }

  async toggleComplete(id: string): Promise<boolean> {
    await delay(120);
    const q = store.questions.find((item) => item.id === id);
    if (q) {
      q.completed = !q.completed;
      store.saveQuestions();
      return q.completed;
    }
    return false;
  }
}

export class MockProfileRepo implements ProfileRepo {
  async get(): Promise<Profile> {
    await delay(160);
    return store.profile;
  }

  async update(p: Partial<Profile>): Promise<Profile> {
    await delay(250);
    store.profile = { ...store.profile, ...p };
    store.saveProfile();
    return store.profile;
  }

  async deleteAllData(): Promise<void> {
    await delay(400);
    store.resetAll();
  }

  async exportData(): Promise<string> {
    await delay(350);
    return JSON.stringify(
      {
        profile: store.profile,
        sessions: store.sessions,
        reports: store.reports,
        questionsSaved: store.questions.filter((q) => q.saved),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

export class MockAuthRepo implements AuthRepo {
  async getUser(): Promise<Profile | null> {
    await delay(100);
    return store.profile;
  }

  async signIn(email: string): Promise<Profile> {
    await delay(350);
    store.profile.email = email;
    store.saveProfile();
    return store.profile;
  }

  async signUp(name: string, email: string): Promise<Profile> {
    await delay(400);
    store.profile.name = name;
    store.profile.email = email;
    store.saveProfile();
    return store.profile;
  }

  async signOut(): Promise<void> {
    await delay(150);
  }

  async resetPassword(email: string): Promise<void> {
    await delay(250);
    // Never reveals if email exists (non-negotiable security)
  }
}

export class MockProgressRepo implements ProgressRepo {
  async getSnapshots(): Promise<ProgressSnapshot[]> {
    await delay(150);
    return SEED_PROGRESS_SNAPSHOTS;
  }
}

// --- Voice Provider (Demo Engine) ---
export class DemoVoiceProvider implements VoiceProvider {
  private audioState: AudioState = 'idle';
  private connectionState: ConnectionState = 'connected';
  private onTranscriptPartialCb: ((text: string) => void) | null = null;
  private onTranscriptFinalCb: ((text: string) => void) | null = null;
  private onAudioStateCb: ((state: AudioState) => void) | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  async connect(_sessionToken: string): Promise<void> {
    this.connectionState = 'connected';
    this.setAudioState('idle');
  }

  async disconnect(): Promise<void> {
    this.interrupt();
    this.connectionState = 'disconnected';
    this.setAudioState('idle');
  }

  async speak(text: string): Promise<void> {
    this.interrupt();
    this.setAudioState('speaking');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to pick a natural voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const natural = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Natural')) || voices[0];
          if (natural) utterance.voice = natural;
        }

        utterance.onend = () => {
          this.setAudioState('listening');
          resolve();
        };
        utterance.onerror = () => {
          this.setAudioState('listening');
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    } else {
      // Fallback timer if speech synthesis is not supported
      await new Promise((r) => setTimeout(r, Math.min(text.length * 50, 3000)));
      this.setAudioState('listening');
    }
  }

  interrupt(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    if (this.audioState === 'speaking') {
      this.setAudioState('listening');
    }
  }

  sendText(text: string): void {
    if (this.onTranscriptFinalCb) {
      this.onTranscriptFinalCb(text);
    }
  }

  onTranscriptPartial(cb: (text: string) => void): void {
    this.onTranscriptPartialCb = cb;
  }

  onTranscriptFinal(cb: (text: string) => void): void {
    this.onTranscriptFinalCb = cb;
  }

  onAudioState(cb: (state: AudioState) => void): void {
    this.onAudioStateCb = cb;
    cb(this.audioState);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private setAudioState(state: AudioState): void {
    this.audioState = state;
    if (this.onAudioStateCb) {
      this.onAudioStateCb(state);
    }
  }
}

export class MockInterviewEngine implements InterviewEngine {
  private voiceProvider = new DemoVoiceProvider();

  async getPersonas(): Promise<Persona[]> {
    await delay(120);
    return SEED_PERSONAS;
  }

  async getPersona(id: string): Promise<Persona> {
    await delay(100);
    const persona = SEED_PERSONAS.find((p) => p.id === id);
    if (!persona) throw new Error(`Persona ${id} not found`);
    return persona;
  }

  getVoiceProvider(): VoiceProvider {
    return this.voiceProvider;
  }
}
