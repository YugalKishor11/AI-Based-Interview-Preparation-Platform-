import {
  Profile,
  Persona,
  InterviewPlan,
  Session,
  Report,
  Question,
  ProgressSnapshot,
} from '../contracts';

export interface SessionsRepo {
  list(params?: { q?: string; type?: string; limit?: number }): Promise<Session[]>;
  get(id: string): Promise<Session>;
  create(plan: InterviewPlan, personaId: string): Promise<Session>;
  complete(id: string): Promise<Report>;
}

export interface ReportsRepo {
  get(id: string): Promise<Report>;
  dispute(scoreId: string, reason: string): Promise<{ success: boolean; message: string }>;
}

export interface QuestionsRepo {
  search(params?: { query?: string; topic?: string; level?: string; savedOnly?: boolean }): Promise<Question[]>;
  get(id: string): Promise<Question>;
  toggleSave(id: string): Promise<boolean>;
  toggleComplete(id: string): Promise<boolean>;
}

export interface ProfileRepo {
  get(): Promise<Profile>;
  update(p: Partial<Profile>): Promise<Profile>;
  deleteAllData(): Promise<void>;
  exportData(): Promise<string>;
}

export interface AuthRepo {
  getUser(): Promise<Profile | null>;
  signIn(email: string): Promise<Profile>;
  signUp(name: string, email: string): Promise<Profile>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export interface ProgressRepo {
  getSnapshots(): Promise<ProgressSnapshot[]>;
}

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';
export type AudioState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceProvider {
  connect(sessionToken: string): Promise<void>;
  disconnect(): Promise<void>;
  setVoice?(voiceId: string): void;
  speak(text: string, voiceId?: string): Promise<void>;
  interrupt(): void;
  sendText(text: string): void;
  onTranscriptPartial(cb: (text: string) => void): void;
  onTranscriptFinal(cb: (text: string) => void): void;
  onAudioState(cb: (state: AudioState) => void): void;
  getConnectionState(): ConnectionState;
}

export interface InterviewEngine {
  getPersonas(): Promise<Persona[]>;
  getPersona(id: string): Promise<Persona>;
  getVoiceProvider(): VoiceProvider;
}
