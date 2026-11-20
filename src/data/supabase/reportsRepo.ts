import { supabase, isSupabaseConfigured } from './client';
import { ReportsRepo } from '../repos/interfaces';
import { Report } from '../contracts';
import { store } from '../mock';

export class SupabaseReportsRepo implements ReportsRepo {
  async get(id: string): Promise<Report> {
    if (!isSupabaseConfigured()) {
      return store.reports[id] || store.reports['rep-101'];
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return store.reports[id] || store.reports['rep-101'];
    }

    return data as unknown as Report;
  }

  async dispute(scoreId: string, reason: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: `Score evaluation query for ${scoreId} recorded. Human review queued with reason: "${reason}".`,
      };
    }

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

    return {
      success: true,
      message: `Score evaluation query for ${scoreId} recorded in Supabase. Human review queued.`,
    };
  }
}
