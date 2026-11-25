import { supabase, isSupabaseConfigured } from './client';
import { QuestionsRepo } from '../repos/interfaces';
import { Question, QuestionSchema } from '../contracts';
import { store } from '../mock';
import { offlineQueue } from '../offlineQueue';
import { QuestionRow } from './types';

export class SupabaseQuestionsRepo implements QuestionsRepo {
  async search(params?: { query?: string; topic?: string; level?: string; savedOnly?: boolean }): Promise<Question[]> {
    if (!isSupabaseConfigured()) {
      return this.searchMock(params).map((q) => QuestionSchema.parse(q));
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase.from('questions').select('*');

      if (params?.topic && params.topic !== 'all') {
        query = query.eq('topic', params.topic);
      }
      if (params?.level && params.level !== 'all') {
        query = query.eq('level', params.level);
      }
      if (params?.query) {
        query = query.or(`title.ilike.%${params.query}%,topic.ilike.%${params.query}%`);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.searchMock(params).map((q) => QuestionSchema.parse(q));
      }

      // Check saved and completed status for user
      let savedIds = new Set<string>();
      let completedIds = new Set<string>();
      if (user) {
        const { data: savedRows } = await supabase
          .from('saved_questions')
          .select('question_id, done_at')
          .eq('user_id', user.id);
        if (savedRows) {
          savedIds = new Set(savedRows.map((r: { question_id: string }) => r.question_id));
          completedIds = new Set(
            savedRows
              .filter((r: { done_at?: string | null }) => Boolean(r.done_at))
              .map((r: { question_id: string }) => r.question_id)
          );
        }
      }

      const questions: Question[] = (data as QuestionRow[]).map((row) =>
        QuestionSchema.parse({
          id: row.id,
          topic: row.topic,
          level: (row.level as 'Easy' | 'Medium' | 'Hard') || 'Medium',
          title: row.title,
          tags: row.tags || [],
          hint1: row.hint1 || '',
          hint2: row.hint2 || '',
          explanation: row.explanation || undefined,
          saved: savedIds.has(row.id),
          completed: completedIds.has(row.id),
          isDemo: Boolean(row.is_demo),
        })
      );

      if (params?.savedOnly) {
        return questions.filter((q) => q.saved);
      }

      return questions;
    } catch {
      return this.searchMock(params).map((q) => QuestionSchema.parse(q));
    }
  }

  private searchMock(params?: { query?: string; topic?: string; level?: string; savedOnly?: boolean }): Question[] {
    let list = [...store.questions];
    if (params?.topic && params.topic !== 'all') {
      list = list.filter((q) => q.topic.toLowerCase() === params.topic!.toLowerCase());
    }
    if (params?.level && params.level !== 'all') {
      list = list.filter((q) => q.level.toLowerCase() === params.level!.toLowerCase());
    }
    if (params?.savedOnly) {
      list = list.filter((q) => q.saved);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async get(id: string): Promise<Question> {
    if (!isSupabaseConfigured()) {
      const q = store.questions.find((item) => item.id === id);
      if (!q) throw new Error(`Question ${id} not found`);
      return QuestionSchema.parse(q);
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        const q = store.questions.find((item) => item.id === id);
        if (q) return QuestionSchema.parse(q);
        throw new Error(`Question ${id} not found`);
      }

      const row = data as QuestionRow;
      return QuestionSchema.parse({
        id: row.id,
        topic: row.topic,
        level: (row.level as 'Easy' | 'Medium' | 'Hard') || 'Medium',
        title: row.title,
        tags: row.tags || [],
        hint1: row.hint1 || '',
        hint2: row.hint2 || '',
        explanation: row.explanation || undefined,
        saved: false,
        completed: false,
        isDemo: Boolean(row.is_demo),
      });
    } catch {
      const q = store.questions.find((item) => item.id === id);
      if (q) return QuestionSchema.parse(q);
      throw new Error(`Question ${id} not found`);
    }
  }

  async toggleSave(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const q = store.questions.find((item) => item.id === id);
      if (q) {
        q.saved = !q.saved;
        store.saveQuestions();
        return q.saved;
      }
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const q = store.questions.find((item) => item.id === id);
        if (q) {
          q.saved = !q.saved;
          store.saveQuestions();
          return q.saved;
        }
        return false;
      }

      const { data: existing } = await supabase
        .from('saved_questions')
        .select('question_id')
        .eq('user_id', user.id)
        .eq('question_id', id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('saved_questions')
          .delete()
          .eq('user_id', user.id)
          .eq('question_id', id);
        return false;
      } else {
        await supabase
          .from('saved_questions')
          .insert({ user_id: user.id, question_id: id });
        return true;
      }
    } catch {
      try {
        offlineQueue.enqueue('toggle_save_question', { questionId: id });
      } catch {}
      const q = store.questions.find((item) => item.id === id);
      if (q) {
        q.saved = !q.saved;
        store.saveQuestions();
        return q.saved;
      }
      return false;
    }
  }

  async toggleComplete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const q = store.questions.find((item) => item.id === id);
      if (q) {
        q.completed = !q.completed;
        store.saveQuestions();
        return q.completed;
      }
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const q = store.questions.find((item) => item.id === id);
        if (q) {
          q.completed = !q.completed;
          store.saveQuestions();
          return q.completed;
        }
        return false;
      }

      const { data: existing } = await supabase
        .from('saved_questions')
        .select('done_at')
        .eq('user_id', user.id)
        .eq('question_id', id)
        .maybeSingle();

      const newDoneAt = existing?.done_at ? null : new Date().toISOString();
      if (existing) {
        await supabase
          .from('saved_questions')
          .update({ done_at: newDoneAt })
          .eq('user_id', user.id)
          .eq('question_id', id);
      } else {
        await supabase
          .from('saved_questions')
          .insert({ user_id: user.id, question_id: id, done_at: newDoneAt });
      }
      return Boolean(newDoneAt);
    } catch {
      try {
        offlineQueue.enqueue('toggle_complete_question', { questionId: id });
      } catch {}
      const q = store.questions.find((item) => item.id === id);
      if (q) {
        q.completed = !q.completed;
        store.saveQuestions();
        return q.completed;
      }
      return false;
    }
  }
}
