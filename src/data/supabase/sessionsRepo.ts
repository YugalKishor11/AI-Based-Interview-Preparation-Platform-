import { supabase, isSupabaseConfigured } from './client';
import { SessionsRepo } from '../repos/interfaces';
import { Session, SessionSchema, InterviewPlan, Report, ReportSchema } from '../contracts';
import { SessionRow } from './types';
import { store } from '../mock';
import { mapReportRow } from './reportsRepo';

function mapSessionRow(row: SessionRow): Session {
  const session: Session = {
    id: row.id,
    title: row.title || 'Technical Interview Simulation',
    type: row.type || 'System Design',
    personaId: row.persona_id || 'p4',
    score: row.score ?? 80,
    durationMins: row.duration_mins || 30,
    date: row.session_date || 'Recent',
    daysAgo: 0,
    reportId: `rep-${row.id}`,
    isDemo: Boolean(row.demo_mode),
  };
  return SessionSchema.parse(session);
}

function filterSessions(list: Session[], params?: { q?: string; type?: string; limit?: number }): Session[] {
  let result = [...list];
  if (params?.type && params.type !== 'all') {
    const t = params.type.toLowerCase();
    result = result.filter((s) => s.type.toLowerCase().includes(t));
  }
  if (params?.q) {
    const q = params.q.toLowerCase();
    result = result.filter((s) => s.title.toLowerCase().includes(q));
  }
  if (params?.limit) {
    result = result.slice(0, params.limit);
  }
  return result;
}

export class SupabaseSessionsRepo implements SessionsRepo {
  async list(params?: { q?: string; type?: string; limit?: number }): Promise<Session[]> {
    if (!isSupabaseConfigured()) {
      return filterSessions(store.sessions.map((s) => SessionSchema.parse(s)), params);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return filterSessions(store.sessions.map((s) => SessionSchema.parse(s)), params);
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
        return filterSessions(store.sessions.map((s) => SessionSchema.parse(s)), params);
      }

      return filterSessions((data as SessionRow[]).map(mapSessionRow), params);
    } catch {
      return filterSessions(store.sessions.map((s) => SessionSchema.parse(s)), params);
    }
  }

  async get(id: string): Promise<Session> {
    if (!isSupabaseConfigured()) {
      const s = store.sessions.find((item) => item.id === id);
      if (!s) throw new Error(`Session ${id} not found`);
      return SessionSchema.parse(s);
    }

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        const s = store.sessions.find((item) => item.id === id);
        if (s) return SessionSchema.parse(s);
        throw new Error(`Session ${id} not found: ${error?.message}`);
      }

      return mapSessionRow(data as SessionRow);
    } catch {
      const s = store.sessions.find((item) => item.id === id);
      if (s) return SessionSchema.parse(s);
      throw new Error(`Session ${id} not found`);
    }
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
      return SessionSchema.parse(newSession);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Create guest/demo session in store if unauthenticated
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
      return SessionSchema.parse(newSession);
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
      // Fallback to local session
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
      store.sessions.unshift(fallbackSession);
      store.saveSessions();
      return SessionSchema.parse(fallbackSession);
    }

    return mapSessionRow(data as SessionRow);
  }

  async complete(id: string): Promise<Report> {
    if (!isSupabaseConfigured()) {
      const rep = store.reports[`rep-${id}`] || store.reports['rep-101'];
      return ReportSchema.parse(rep);
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
      try {
        return mapReportRow(data);
      } catch {
        // Continue to fallback
      }
    }

    const rep = store.reports[`rep-${id}`] || store.reports['rep-101'];
    return ReportSchema.parse(rep);
  }
}
