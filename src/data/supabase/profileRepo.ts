import { supabase, isSupabaseConfigured } from './client';
import { ProfileRepo } from '../repos/interfaces';
import { Profile, ProfileSchema } from '../contracts';
import { mapProfileRowToProfile } from './authRepo';
import { ProfileRow } from './types';
import { store, MockProfileRepo } from '../mock';

export class SupabaseProfileRepo implements ProfileRepo {
  async get(): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      return ProfileSchema.parse(store.profile);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return ProfileSchema.parse(store.profile);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        return ProfileSchema.parse(mapProfileRowToProfile({ id: user.id }, user.email, false));
      }

      return ProfileSchema.parse(mapProfileRowToProfile(data, user.email, false));
    } catch {
      return ProfileSchema.parse(store.profile);
    }
  }

  async update(p: Partial<Profile>): Promise<Profile> {
    if (!isSupabaseConfigured()) {
      store.profile = { ...store.profile, ...p };
      store.saveProfile();
      return ProfileSchema.parse(store.profile);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback gracefully to local mock store when unauthenticated
        store.profile = {
          ...store.profile,
          ...(p.name ? { name: p.name } : {}),
          ...(p.targetRole ? { targetRole: p.targetRole } : {}),
          ...(p.targetLevel ? { targetLevel: p.targetLevel } : {}),
          ...(p.streakDays !== undefined ? { streakDays: p.streakDays } : {}),
          ...(p.credits !== undefined ? { credits: p.credits } : {}),
          ...(p.avatarUrl !== undefined ? { avatarUrl: p.avatarUrl } : {}),
          ...(p.onboardingCompleted !== undefined ? { onboardingCompleted: p.onboardingCompleted } : {}),
        };
        store.saveProfile();
        return ProfileSchema.parse(store.profile);
      }

      const updates: Partial<ProfileRow> = {};
      if (p.name !== undefined) updates.name = p.name;
      if (p.targetRole !== undefined) updates.target_role = p.targetRole;
      if (p.targetLevel !== undefined) updates.target_level = p.targetLevel;
      if (p.streakDays !== undefined) updates.streak_days = p.streakDays;
      if (p.credits !== undefined) updates.credits = p.credits;
      if (p.avatarUrl !== undefined) updates.avatar_url = p.avatarUrl;
      if (p.onboardingCompleted !== undefined) {
        (updates as Record<string, unknown>).onboarding_completed_at = p.onboardingCompleted ? new Date().toISOString() : null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error || !data) {
        store.profile = { ...store.profile, ...p };
        store.saveProfile();
        return ProfileSchema.parse(store.profile);
      }

      return ProfileSchema.parse(mapProfileRowToProfile(data, user.email, false));
    } catch {
      store.profile = { ...store.profile, ...p };
      store.saveProfile();
      return ProfileSchema.parse(store.profile);
    }
  }

  async deleteAllData(): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.resetAll();
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Audit deletion entry
      try {
        await supabase.from('deletion_audit').insert({
          kind: 'data',
          counts: { user_id: user.id },
          completed_at: new Date().toISOString(),
        });
      } catch {}

      // 2. Cascade delete database records
      await supabase.from('interview_sessions').delete().eq('user_id', user.id);
      await supabase.from('saved_questions').delete().eq('user_id', user.id);
      store.resetAll();
    } catch {
      store.resetAll();
    }
  }

  async exportData(): Promise<string> {
    if (!isSupabaseConfigured()) {
      return new MockProfileRepo().exportData();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new MockProfileRepo().exportData();
      }

      const [profileRes, sessionsRes, questionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('interview_sessions').select('*').eq('user_id', user.id),
        supabase.from('saved_questions').select('question_id').eq('user_id', user.id),
      ]);

      return JSON.stringify(
        {
          profile: profileRes.data || store.profile,
          sessions: sessionsRes.data || store.sessions,
          savedQuestionIds: questionsRes.data || [],
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
    } catch {
      return new MockProfileRepo().exportData();
    }
  }
}
