// Database row mappings for Supabase tables
export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  target_role: string;
  target_level: string;
  streak_days: number;
  credits: number;
  avatar_url: string | null;
  joined_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface PersonaRow {
  id: string;
  name: string;
  title: string;
  style: string;
  description: string;
  languages: string;
  voice_gender: 'female' | 'male';
  sample_line: string;
  p1_color: string;
  p2_color: string;
  is_active: boolean;
  is_demo: boolean;
  created_at?: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  persona_id: string;
  title: string;
  type: string;
  score: number | null;
  duration_mins: number;
  session_date: string;
  state: string;
  resumable_state: Record<string, unknown>;
  provider: string;
  demo_mode: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  topic: string;
  level: string;
  title: string;
  tags: string[];
  hint1: string;
  hint2: string;
  explanation: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface ReportRow {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  type: string;
  persona_id: string;
  report_date: string;
  duration: string;
  overall_score: number;
  label: string;
  confidence: string;
  score_delta: string;
  summary: string;
  delivery: Record<string, unknown>;
  questions_feedback: unknown[];
  drill_plan: unknown[];
  disclaimer: string;
  is_demo: boolean;
  created_at: string;
}

export interface ProgressSnapshotRow {
  id: string;
  user_id: string;
  snapshot_date: string;
  overall_score: number;
  technical_score: number;
  reasoning_score: number;
  communication_score: number;
  problem_solving_score: number;
  created_at: string;
}
