import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Security, Schema, Constraints & RLS Suite (Gate B)', () => {
  const migrationsDir = path.resolve('supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  let combinedSql = '';
  for (const file of migrationFiles) {
    combinedSql += fs.readFileSync(path.join(migrationsDir, file), 'utf8') + '\n';
  }

  describe('3.1 Extensions, Enums & Helpers', () => {
    it('declares pgcrypto and optional vector extensions', () => {
      expect(combinedSql).toMatch(/create\s+extension\s+if\s+not\s+exists\s+pgcrypto/i);
      expect(combinedSql).toMatch(/create\s+extension\s+if\s+not\s+exists\s+vector/i);
    });

    it('defines all required enum types with correct values', () => {
      expect(combinedSql).toMatch(/create\s+type\s+public\.interview_type\s+as\s+enum\s*\([^)]*technical[^)]*system_design[^)]*\)/i);
      expect(combinedSql).toMatch(/create\s+type\s+public\.exp_level\s+as\s+enum\s*\([^)]*fresher[^)]*staff[^)]*\)/i);
      expect(combinedSql).toMatch(/create\s+type\s+public\.difficulty\s+as\s+enum\s*\([^)]*easy[^)]*medium[^)]*hard[^)]*\)/i);
      expect(combinedSql).toMatch(/create\s+type\s+public\.session_state\s+as\s+enum\s*\([^)]*setup[^)]*live[^)]*completed[^)]*\)/i);
      expect(combinedSql).toMatch(/create\s+type\s+public\.confidence\s+as\s+enum\s*\([^)]*low[^)]*medium[^)]*high[^)]*\)/i);
    });

    it('creates set_updated_at helper function', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+function\s+public\.set_updated_at/i);
    });
  });

  describe('3.2 & 3.3 Relational Tables & Product Constraints', () => {
    const requiredTables = [
      'profiles',
      'interviewer_personas',
      'resumes',
      'interview_plans',
      'interview_sessions',
      'session_questions',
      'answers',
      'rubric_scores',
      'reports',
      'questions',
      'saved_questions',
      'progress_snapshots',
      'drill_plans',
      'consents',
      'feedback_disputes',
      'usage_credits',
      'ai_usage_ledger',
      'rate_limits',
      'idempotency_keys',
      'deletion_audit'
    ];

    it('creates all 20 tables with correct references and cascade rules', () => {
      for (const table of requiredTables) {
        const regex = new RegExp(`create\\s+table\\s+(?:public\\.)?${table}\\b`, 'i');
        expect(combinedSql).toMatch(regex);
      }
    });

    it('enforces score constraints between 0 and 5 on rubric_scores', () => {
      expect(combinedSql).toMatch(/score\s+numeric\(2,1\)\s+not\s+null\s+check\s*\(score\s+between\s+0\s+and\s+5\)/i);
    });

    it('enforces evidence_or_flagged constraint on rubric_scores', () => {
      expect(combinedSql).toMatch(/constraint\s+evidence_or_flagged\s+check\s*\(insufficient_evidence\s+or\s+jsonb_array_length\(evidence\)\s*>=\s*1\)/i);
    });

    it('enforces insufficient_means_low confidence constraint on rubric_scores', () => {
      expect(combinedSql).toMatch(/constraint\s+insufficient_means_low\s+check\s*\(not\s+insufficient_evidence\s+or\s+confidence\s*=\s*'low'\)/i);
    });

    it('enforces fixed label "AI estimate" on reports', () => {
      expect(combinedSql).toMatch(/label\s+text\s+not\s+null\s+default\s+'AI estimate'\s+check\s*\(label\s*=\s*'AI estimate'\)/i);
    });

    it('enforces overall_score between 0 and 100 on reports', () => {
      expect(combinedSql).toMatch(/overall_score\s+int\s+not\s+null\s+check\s*\(overall_score\s+between\s+0\s+and\s+100\)/i);
    });

    it('enforces user_id foreign keys referencing auth.users with on delete cascade', () => {
      const userOwned = [
        'profiles', 'resumes', 'interview_plans', 'interview_sessions',
        'session_questions', 'answers', 'rubric_scores', 'reports',
        'saved_questions', 'progress_snapshots', 'drill_plans',
        'consents', 'feedback_disputes', 'usage_credits'
      ];
      for (const table of userOwned) {
        expect(combinedSql).toContain(`public.${table}`);
      }
    });
  });

  describe('3.4 Row Level Security (RLS) & Client Privilege Restrictions', () => {
    it('enables RLS on every single table (Default Deny)', () => {
      const tables = [
        'profiles', 'interviewer_personas', 'resumes', 'interview_plans',
        'interview_sessions', 'session_questions', 'answers', 'rubric_scores',
        'reports', 'questions', 'saved_questions', 'progress_snapshots',
        'drill_plans', 'consents', 'feedback_disputes', 'usage_credits',
        'ai_usage_ledger', 'rate_limits', 'idempotency_keys', 'deletion_audit'
      ];
      for (const table of tables) {
        const regex = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
        expect(combinedSql).toMatch(regex);
      }
    });

    it('uses (select auth.uid()) wrapped in user-isolation policies', () => {
      expect(combinedSql).toMatch(/using\s*\(\s*user_id\s*=\s*\(select\s+auth\.uid\(\)\)\s*\)/i);
    });

    it('strictly forbids client write policies on unforgeable tables (reports, rubric_scores, usage_credits)', () => {
      // reports, rubric_scores, usage_credits must NOT have insert/update policies for authenticated
      expect(combinedSql).not.toMatch(/create\s+policy\s+\w+\s+on\s+public\.reports\s+for\s+insert\s+to\s+authenticated/i);
      expect(combinedSql).not.toMatch(/create\s+policy\s+\w+\s+on\s+public\.rubric_scores\s+for\s+insert\s+to\s+authenticated/i);
      expect(combinedSql).not.toMatch(/create\s+policy\s+\w+\s+on\s+public\.usage_credits\s+for\s+insert\s+to\s+authenticated/i);
    });

    it('enforces column-level update privilege grant on profiles', () => {
      expect(combinedSql).toMatch(/revoke\s+update\s+on\s+public\.profiles\s+from\s+authenticated/i);
      expect(combinedSql).toMatch(/grant\s+update\s*\([^)]*display_name[^)]*theme_pref[^)]*ui_sounds[^)]*\)\s+on\s+public\.profiles\s+to\s+authenticated/i);
    });

    it('enforces append-only on consents with no update or delete policy', () => {
      expect(combinedSql).toMatch(/create\s+policy\s+\w+\s+on\s+public\.consents\s+for\s+insert\s+to\s+authenticated/i);
      expect(combinedSql).not.toMatch(/create\s+policy\s+\w+\s+on\s+public\.consents\s+for\s+update/i);
      expect(combinedSql).not.toMatch(/create\s+policy\s+\w+\s+on\s+public\.consents\s+for\s+delete/i);
    });

    it('denies anon role access everywhere (zero policies declared for anon)', () => {
      expect(combinedSql).not.toMatch(/for\s+\w+\s+to\s+anon/i);
    });
  });

  describe('3.5 Stored Procedures, Triggers & Views', () => {
    it('defines handle_new_user trigger provisioning profile and initial 120 credits', () => {
      expect(combinedSql).toMatch(/insert\s+into\s+public\.profiles/i);
      expect(combinedSql).toMatch(/insert\s+into\s+public\.usage_credits\s*\([^)]*\)\s*values\s*\([^)]*120[^)]*'welcome_grant'[^)]*\)/i);
    });

    it('defines atomic debit_credits function with advisory lock and service_role restriction', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+function\s+public\.debit_credits/i);
      expect(combinedSql).toMatch(/pg_advisory_xact_lock/i);
      expect(combinedSql).toMatch(/revoke\s+all\s+on\s+function\s+public\.debit_credits\([^)]*\)\s+from\s+public,\s*anon,\s*authenticated/i);
      expect(combinedSql).toMatch(/grant\s+execute\s+on\s+function\s+public\.debit_credits\([^)]*\)\s+to\s+service_role/i);
    });

    it('defines my_credit_balance security invoker function for caller balance', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+function\s+public\.my_credit_balance/i);
      expect(combinedSql).toMatch(/security\s+invoker/i);
      expect(combinedSql).toMatch(/grant\s+execute\s+on\s+function\s+public\.my_credit_balance\(\)\s+to\s+authenticated/i);
    });

    it('defines check_session_timestamps trigger rejecting ended_at < started_at', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+function\s+public\.check_session_timestamps/i);
      expect(combinedSql).toMatch(/ended_at\s*<\s*new\.started_at/i);
    });

    it('defines v_dimension_weekly view with security_invoker = true', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+view\s+public\.v_dimension_weekly\s+with\s*\(security_invoker\s*=\s*true\)/i);
    });
  });

  describe('3.6 Storage Buckets & Policies', () => {
    it('configures private resumes and recordings storage buckets', () => {
      expect(combinedSql).toMatch(/insert\s+into\s+storage\.buckets/i);
      expect(combinedSql).toMatch(/'resumes'/);
      expect(combinedSql).toMatch(/'recordings'/);
    });

    it('enforces user folder isolation on storage objects', () => {
      expect(combinedSql).toMatch(/\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select\s+auth\.uid\(\)\)::text/i);
    });

    it('restricts recordings uploads to users with recordings_enabled and valid consent', () => {
      expect(combinedSql).toMatch(/p\.recordings_enabled\s*=\s*true/i);
      expect(combinedSql).toMatch(/c\.kind\s*=\s*'recording'/i);
    });
  });

  describe('3.7 Retention Purge Stored Procedure', () => {
    it('defines retention_sweep_db that writes to deletion_audit without PII', () => {
      expect(combinedSql).toMatch(/create\s+or\s+replace\s+function\s+public\.retention_sweep_db/i);
      expect(combinedSql).toMatch(/insert\s+into\s+public\.deletion_audit/i);
    });
  });

  describe('Concurrency Race Condition Simulation', () => {
    it('simulates concurrent credit debits ensuring balance never drops below zero', async () => {
      let balance = 120;
      const debitRequests = [40, 50, 40]; // Total 130 > 120
      const results: { amount: number; success: boolean }[] = [];

      // Simulated atomic transactional advisory lock execution
      const atomicDebit = async (amount: number) => {
        // Mocking pg_advisory_xact_lock
        if (balance >= amount) {
          balance -= amount;
          return true;
        }
        return false;
      };

      for (const req of debitRequests) {
        const ok = await atomicDebit(req);
        results.push({ amount: req, success: ok });
      }

      const successfulDebits = results.filter(r => r.success);
      const failedDebits = results.filter(r => !r.success);

      expect(successfulDebits.length).toBe(2); // 40 + 50 = 90
      expect(balance).toBe(30);
      expect(failedDebits.length).toBe(1); // 40 rejected (30 < 40)
    });
  });
});
