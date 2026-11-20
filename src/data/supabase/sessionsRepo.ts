import { supabase, isSupabaseConfigured } from './client';
import { SessionsRepo } from '../repos/interfaces';
import { Session, InterviewPlan, Report } from '../contracts';
import { SessionRow } from './types';
import { store } from '../mock';

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    personaId: row.persona_id,
    score: row.score ?? 80,
    durationMins: row.duration_mins,
    date: row.session_date,
    daysAgo: 0,
    reportId: `rep-${row.id}`,
    isDemo: row.demo_mode,
  };
}

export class SupabaseSessionsRepo implements SessionsRepo {
  async list(params?: { q?: string; type?: string; limit?: number }): Promise<Session[]> {
    if (!isSupabaseConfigured()) {
      return store.sessions;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return store.sessions;
    }

    let query = supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (params?.type && params.type !== 'all') {
      query = query.ilike('type', `%${params.type}%`);
    }

    if (params?.q) {
      query = query.ilike('title', `%${params.q}%`);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Fallback to store if DB has no sessions yet
      return store.sessions;
    }

    return (data as SessionRow[]).map(mapSessionRow);
  }

  async get(id: string): Promise<Session> {
    if (!isSupabaseConfigured()) {
      const s = store.sessions.find((item) => item.id === id);
      if (!s) throw new Error(`Session ${id} not found`);
      return s;
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      const s = store.sessions.find((item) => item.id === id);
      if (s) return s;
      throw new Error(`Session ${id} not found: ${error?.message}`);
    }

    return mapSessionRow(data as SessionRow);
  }

  async create(plan: InterviewPlan, personaId: string): Promise<Session> {
    if (!isSupabaseConfigured()) {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Candidate must be authenticated to create a session.');
    }

    const newId = `s-${Date.now()}`;
    const insertRow = {
      id: newId,
      user_id: user.id,
      persona_id: personaId,
      title: `${plan.targetRole} (${plan.type})`,
      type: plan.type,
      duration_mins: plan.durationMinutes,
      session_date: 'Just now',
      state: 'active',
      provider: 'supabase',
      demo_mode: false,
      score: 82,
    };

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert(insertRow)
      .select()
      .single();

    if (error || !data) {
      // Fallback to mock session
      const fallbackSession: Session = {
        id: newId,
        title: `${plan.targetRole} (${plan.type})`,
        type: plan.type,
        personaId,
        score: 82,
        durationMins: plan.durationMinutes,
        date: 'Just now',
        daysAgo: 0,
        reportId: `rep-${newId}`,
        isDemo: false,
      };
      return fallbackSession;
    }

    return mapSessionRow(data as SessionRow);
  }

  async complete(id: string): Promise<Report> {
    if (!isSupabaseConfigured()) {
      return store.reports[`rep-${id}`] || store.reports['rep-101'];
    }

    await supabase
      .from('interview_sessions')
      .update({ state: 'completed', ended_at: new Date().toISOString() })
      .eq('id', id);

    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', id)
      .maybeSingle();

    if (data) {
      return data as unknown as Report;
    }

    return store.reports[`rep-${id}`] || store.reports['rep-101'];
  }
}
