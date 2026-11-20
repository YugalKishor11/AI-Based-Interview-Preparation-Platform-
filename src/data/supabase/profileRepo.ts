import { supabase, isSupabaseConfigured } from './client';
import { ProfileRepo } from '../repos/interfaces';
import { Profile } from '../contracts';
import { mapProfileRowToProfile } from './authRepo';
import { ProfileRow } from './types';
import { store, MockProfileRepo } from '../mock';

export class SupabaseProfileRepo implements ProfileRepo {
  async get(): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      return store.profile;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return store.profile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      return mapProfileRowToProfile({ id: user.id }, user.email, false);
    }

    return mapProfileRowToProfile(data, user.email, false);
  }

  async update(p: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      return store.profile;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const updates: Partial<ProfileRow> = {};
    if (p.name !== undefined) updates.name = p.name;
    if (p.targetRole !== undefined) updates.target_role = p.targetRole;
    if (p.targetLevel !== undefined) updates.target_level = p.targetLevel;
    if (p.streakDays !== undefined) updates.streak_days = p.streakDays;
    if (p.credits !== undefined) updates.credits = p.credits;
    if (p.avatarUrl !== undefined) updates.avatar_url = p.avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return mapProfileRowToProfile(data, user.email, false);
  }

  async deleteAllData(): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.resetAll();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Call Supabase Edge Function delete-account or cascade delete user's data
    try {
      await supabase.functions.invoke('delete-account', {
        body: { confirmed: true },
      });
    } catch {
      // Direct cascade cleanup if function not deployed
      await supabase.from('interview_sessions').delete().eq('user_id', user.id);
      await supabase.from('saved_questions').delete().eq('user_id', user.id);
    }
  }

  async exportData(): Promise<string> {
    if (!isSupabaseConfigured()) {
      return new MockProfileRepo().exportData();
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Try edge function first
    try {
      const { data } = await supabase.functions.invoke('export-data');
      if (data) return JSON.stringify(data, null, 2);
    } catch {
      // Fallback: direct table queries
    }

    const [profileRes, sessionsRes, questionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('interview_sessions').select('*').eq('user_id', user.id),
      supabase.from('saved_questions').select('question_id').eq('user_id', user.id),
    ]);

    return JSON.stringify(
      {
        profile: profileRes.data,
        sessions: sessionsRes.data || [],
        savedQuestionIds: questionsRes.data || [],
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}
