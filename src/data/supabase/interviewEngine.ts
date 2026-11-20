import { supabase, isSupabaseConfigured } from './client';
import { InterviewEngine, VoiceProvider } from '../repos/interfaces';
import { Persona } from '../contracts';
import { SEED_PERSONAS } from '../mock/seed';
import { DemoVoiceProvider } from '../mock';
import { PersonaRow } from './types';

export class SupabaseInterviewEngine implements InterviewEngine {
  private voiceProvider: VoiceProvider;

  constructor() {
    this.voiceProvider = new DemoVoiceProvider();
  }

  async getPersonas(): Promise<Persona[]> {
    if (!isSupabaseConfigured()) {
      return SEED_PERSONAS;
    }

    try {
      const { data, error } = await supabase
        .from('interviewer_personas')
        .select('*')
        .eq('is_active', true);

      if (error || !data || data.length === 0) {
        return SEED_PERSONAS;
      }

      return (data as PersonaRow[]).map((row) => {
        // Map to known seed persona voiceId
        const matchSeed = SEED_PERSONAS.find((p) => p.id === row.id);
        return {
          id: row.id,
          name: row.name,
          title: row.title,
          style: (row.style as 'Supportive' | 'Balanced' | 'Challenging') || 'Balanced',
          description: row.description,
          languages: row.languages,
          voiceGender: row.voice_gender,
          sampleLine: row.sample_line,
          voiceId: matchSeed?.voiceId || 'voice-daniel-architect',
          p1: row.p1_color,
          p2: row.p2_color,
          isDemo: row.is_demo,
        };
      });
    } catch {
      return SEED_PERSONAS;
    }
  }

  async getPersona(id: string): Promise<Persona> {
    const list = await this.getPersonas();
    const found = list.find((p) => p.id === id);
    if (!found) {
      return SEED_PERSONAS[0];
    }
    return found;
  }

  getVoiceProvider(): VoiceProvider {
    return this.voiceProvider;
  }
}
