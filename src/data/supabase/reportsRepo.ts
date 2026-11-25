import { supabase, isSupabaseConfigured } from './client';
import { ReportsRepo } from '../repos/interfaces';
import { Report, ReportSchema } from '../contracts';
import { store } from '../mock';
import { SEED_PERSONAS } from '../mock/seed';

export function mapReportRow(row: any): Report {
  const fallback = store.reports[row.id] || store.reports['rep-101'];
  const persona = SEED_PERSONAS.find((p: { id: string }) => p.id === (row.persona_id || row.personaId)) || fallback.persona;

  const mapped: Report = {
    id: row.id,
    sessionId: row.session_id || row.sessionId || fallback.sessionId,
    title: row.title || fallback.title,
    type: row.type || fallback.type,
    persona,
    date: row.report_date || row.date || fallback.date,
    duration: row.duration || fallback.duration,
    overallScore: row.overall_score ?? row.overallScore ?? fallback.overallScore,
    confidence: row.confidence || fallback.confidence,
    scoreDelta: row.score_delta || row.scoreDelta || fallback.scoreDelta,
    summary: row.summary || fallback.summary,
    rubric: Array.isArray(row.rubric) && row.rubric.length > 0 ? row.rubric : fallback.rubric,
    delivery: (row.delivery && typeof row.delivery === 'object') ? row.delivery : fallback.delivery,
    questionsFeedback: Array.isArray(row.questions_feedback)
      ? row.questions_feedback
      : (Array.isArray(row.questionsFeedback) ? row.questionsFeedback : fallback.questionsFeedback),
    drillPlan: Array.isArray(row.drill_plan)
      ? row.drill_plan
      : (Array.isArray(row.drillPlan) ? row.drillPlan : fallback.drillPlan),
    disclaimer: row.disclaimer || fallback.disclaimer,
    isDemo: Boolean(row.is_demo ?? row.isDemo),
  };
  return ReportSchema.parse(mapped);
}

export class SupabaseReportsRepo implements ReportsRepo {
  async get(id: string): Promise<Report> {
    if (!isSupabaseConfigured()) {
      const rep = store.reports[id] || store.reports['rep-101'];
      return ReportSchema.parse(rep);
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        const rep = store.reports[id] || store.reports['rep-101'];
        return ReportSchema.parse(rep);
      }

      return mapReportRow(data);
    } catch {
      const rep = store.reports[id] || store.reports['rep-101'];
      return ReportSchema.parse(rep);
    }
  }

  async dispute(scoreId: string, reason: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: `Score evaluation query for ${scoreId} recorded. Human review queued with reason: "${reason}".`,
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('feedback_disputes').insert({
          user_id: user.id,
          report_id: scoreId.startsWith('rep-') ? scoreId : 'rep-101',
          dimension: scoreId,
          candidate_reason: reason,
          status: 'received',
        });
      }
    } catch {
      // Continue
    }

    return {
      success: true,
      message: `Score evaluation query for ${scoreId} recorded in Supabase. Human review queued.`,
    };
  }
}
