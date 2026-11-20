import { supabase, isSupabaseConfigured } from './client';
import { ProgressRepo } from '../repos/interfaces';
import { ProgressSnapshot } from '../contracts';
import { SEED_PROGRESS_SNAPSHOTS } from '../mock/seed';
import { ProgressSnapshotRow } from './types';

export class SupabaseProgressRepo implements ProgressRepo {
  async getSnapshots(): Promise<ProgressSnapshot[]> {
    if (!isSupabaseConfigured()) {
      return SEED_PROGRESS_SNAPSHOTS;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return SEED_PROGRESS_SNAPSHOTS;
    }

    const { data, error } = await supabase
      .from('progress_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return SEED_PROGRESS_SNAPSHOTS;
    }

    return (data as ProgressSnapshotRow[]).map((row) => ({
      date: row.snapshot_date,
      overallScore: row.overall_score,
      technicalScore: Number(row.technical_score),
      reasoningScore: Number(row.reasoning_score),
      communicationScore: Number(row.communication_score),
      problemSolvingScore: Number(row.problem_solving_score),
      isDemo: false,
    }));
  }
}
