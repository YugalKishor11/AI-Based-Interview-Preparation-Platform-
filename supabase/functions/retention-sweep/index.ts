// retention-sweep: Automated retention policy enforcement
// Purges expired Storage objects and database records safely via Storage API
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireServiceRoleAuth } from '../_shared/auth.ts';
import { RetentionSweepRequestSchema, RetentionSweepResponseSchema, RetentionSweepResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';

export const handleRetentionSweep = async (req: Request): Promise<Response> => {
  requireServiceRoleAuth(req);

  const startTime = Date.now();
  const body = await req.json().catch(() => ({}));
  const parsed = RetentionSweepRequestSchema.safeParse(body);
  const {
    transcriptRetentionDays = 365,
    resumeRetentionDays = 90,
    recordingRetentionDays = 30,
    dryRun = false,
  } = parsed.success ? parsed.data : {};

  const admin = createSupabaseAdminClient();
  let purgedResumesCount = 0;
  let purgedRecordingsCount = 0;
  let purgedTranscriptsCount = 0;

  const now = new Date();
  const resumeThreshold = new Date(now.getTime() - resumeRetentionDays * 86400 * 1000).toISOString();
  const recordingThreshold = new Date(now.getTime() - recordingRetentionDays * 86400 * 1000).toISOString();
  const transcriptThreshold = new Date(now.getTime() - transcriptRetentionDays * 86400 * 1000).toISOString();

  // 1. Sweep expired resumes
  try {
    const { data: expiredResumes } = await admin
      .from('resumes')
      .select('id, file_path')
      .lt('created_at', resumeThreshold);

    if (expiredResumes && expiredResumes.length > 0) {
      purgedResumesCount = expiredResumes.length;
      if (!dryRun) {
        const paths = expiredResumes.map((r) => r.file_path).filter(Boolean);
        if (paths.length > 0) {
          await admin.storage.from('resumes').remove(paths);
        }
        await admin.from('resumes').delete().in('id', expiredResumes.map((r) => r.id));
      }
    }
  } catch (_e) {
    // Continue
  }

  // 2. Sweep expired recordings from Storage
  try {
    const { data: buckets } = await admin.storage.listBuckets();
    if (buckets?.some((b) => b.name === 'recordings')) {
      const { data: files } = await admin.storage.from('recordings').list('', { limit: 100 });
      if (files && files.length > 0) {
        const toDelete = files.filter((f) => new Date(f.created_at).toISOString() < recordingThreshold);
        purgedRecordingsCount = toDelete.length;
        if (!dryRun && toDelete.length > 0) {
          await admin.storage.from('recordings').remove(toDelete.map((f) => f.name));
        }
      }
    }
  } catch (_e) {
    // Continue
  }

  // 3. Sweep expired answers / transcripts
  try {
    const { data: expiredAnswers } = await admin
      .from('answers')
      .select('id')
      .lt('created_at', transcriptThreshold);

    if (expiredAnswers && expiredAnswers.length > 0) {
      purgedTranscriptsCount = expiredAnswers.length;
      if (!dryRun) {
        await admin.from('answers').delete().in('id', expiredAnswers.map((a) => a.id));
      }
    }
  } catch (_e) {
    // Continue
  }

  // Record audit log
  if (!dryRun) {
    try {
      await admin.from('audit_logs').insert({
        action: 'retention_sweep_completed',
        details: {
          purgedResumesCount,
          purgedRecordingsCount,
          purgedTranscriptsCount,
        },
      });
    } catch (_e) {
      // Continue
    }
  }

  const responsePayload: RetentionSweepResponse = {
    purgedTranscriptsCount,
    purgedResumesCount,
    purgedRecordingsCount,
    durationMs: Date.now() - startTime,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('retention-sweep', handleRetentionSweep);
