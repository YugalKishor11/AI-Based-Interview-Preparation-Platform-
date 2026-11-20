// Centralized Voice Configuration Registry for PrepSphere
// Maps all 4 AI interviewer personas to distinct vocal profiles with unique voice IDs,
// locale mappings, pitch, rate, and preferred system voice matches.

export interface VoiceConfig {
  id: string;
  personaId: string;
  name: string;
  title: string;
  gender: 'female' | 'male';
  lang: string;
  pitch: number;
  rate: number;
  styleDescription: string;
  preferredVoiceNames: string[];
}

export const SAMPLE_PREVIEW_TEXT =
  "Hello! I’m your AI interviewer. Let’s begin your interview and explore your skills.";

export const VOICE_REGISTRY: Record<string, VoiceConfig> = {
  // Voice 1: Aanya Rao - Supportive, warm, empathetic senior engineering manager
  'voice-aanya-supportive': {
    id: 'voice-aanya-supportive',
    personaId: 'p1',
    name: 'Aanya Rao',
    title: 'Senior Engineering Manager',
    gender: 'female',
    lang: 'en-US',
    pitch: 1.15, // Warm, gentle lift
    rate: 0.96,  // Deliberate, welcoming pacing
    styleDescription: 'Warm, supportive tone with measured clarity',
    preferredVoiceNames: [
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Zira',
      'Google US English',
      'Samantha',
      'Karen',
      'Victoria',
    ],
  },

  // Voice 2: Meera Kapoor - Balanced, conversational HR business partner with high clarity
  'voice-meera-balanced': {
    id: 'voice-meera-balanced',
    personaId: 'p2',
    name: 'Meera Kapoor',
    title: 'HR Business Partner',
    gender: 'female',
    lang: 'en-GB',
    pitch: 1.30, // Bright, melodic, high clarity
    rate: 1.05,  // Fluent, conversational cadence
    styleDescription: 'Poised, conversational executive cadence',
    preferredVoiceNames: [
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Hazel',
      'Google UK English Female',
      'Fiona',
      'Moira',
      'Aria',
      'Microsoft Zira',
    ],
  },

  // Voice 3: Rohan Mehta - Challenging, direct, fast-paced technical staff engineer
  'voice-rohan-challenging': {
    id: 'voice-rohan-challenging',
    personaId: 'p3',
    name: 'Rohan Mehta',
    title: 'Staff Software Engineer',
    gender: 'male',
    lang: 'en-US',
    pitch: 0.94, // Crisp, direct technical tenor
    rate: 1.12,  // Brisk, fast-paced technical tempo
    styleDescription: 'Crisp, fast-paced engineering rigor',
    preferredVoiceNames: [
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft David',
      'Google US English',
      'Alex',
      'Fred',
      'Mark',
    ],
  },

  // Voice 4: Daniel Brooks - Principal infrastructure architect, deep baritone, reflective
  'voice-daniel-architect': {
    id: 'voice-daniel-architect',
    personaId: 'p4',
    name: 'Daniel Brooks',
    title: 'Principal Infrastructure Architect',
    gender: 'male',
    lang: 'en-GB',
    pitch: 0.76, // Deep, authoritative baritone
    rate: 0.88,  // Measured, contemplative cadence
    styleDescription: 'Deep, authoritative baritone with deliberate pacing',
    preferredVoiceNames: [
      'Microsoft Ryan Online (Natural) - English (United Kingdom)',
      'Microsoft George',
      'Google UK English Male',
      'Daniel',
      'Oliver',
      'Microsoft David',
    ],
  },
};

// Aliases mapping persona IDs to voice configurations
export const PERSONA_TO_VOICE_MAP: Record<string, string> = {
  p1: 'voice-aanya-supportive',
  p2: 'voice-meera-balanced',
  p3: 'voice-rohan-challenging',
  p4: 'voice-daniel-architect',
  'aanya-rao': 'voice-aanya-supportive',
  'meera-kapoor': 'voice-meera-balanced',
  'rohan-mehta': 'voice-rohan-challenging',
  'daniel-brooks': 'voice-daniel-architect',
};

export const DEFAULT_VOICE_ID = 'voice-daniel-architect';

/**
 * Resolves a VoiceConfig from either a voiceId, personaId, or persona name.
 * Falls back gracefully to DEFAULT_VOICE_ID if unrecognized.
 */
export function getVoiceConfig(identifier?: string | null): VoiceConfig {
  if (!identifier) {
    return VOICE_REGISTRY[DEFAULT_VOICE_ID];
  }

  // Direct match on voice ID
  if (VOICE_REGISTRY[identifier]) {
    return VOICE_REGISTRY[identifier];
  }

  // Match via persona ID / alias
  const mappedVoiceId = PERSONA_TO_VOICE_MAP[identifier.toLowerCase()];
  if (mappedVoiceId && VOICE_REGISTRY[mappedVoiceId]) {
    return VOICE_REGISTRY[mappedVoiceId];
  }

  // Fallback to default
  return VOICE_REGISTRY[DEFAULT_VOICE_ID];
}
