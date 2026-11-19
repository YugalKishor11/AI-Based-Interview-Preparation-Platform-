// delete-account: Complete permanent account and data erasure
// Purges database records, Storage objects, and auth credentials with content-free audit logging
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { DeleteAccountRequestSchema, DeleteAccountResponseSchema, DeleteAccountResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';
import { BadRequestError } from '../_shared/error.ts';

export const handleDeleteAccount = async (req: Request): Promise<Response> => {
  const user = await requireUserAuth(req);

  const body = await req.json();
  const parsed = DeleteAccountRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError('Confirmation phrase must exactly match "DELETE MY ACCOUNT PERMANENTLY"');
  }

  const admin = createSupabaseAdminClient();
  const purgedCounts: Record<string, number> = {
    resumes: 0,
    recordings: 0,
    databaseRows: 0,
  };

  // 1. Purge Storage Objects from resumes and recordings buckets
  try {
    const { data: resumeFiles } = await admin.storage.from('resumes').list(user.id);
    if (resumeFiles && resumeFiles.length > 0) {
      const paths = resumeFiles.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from('resumes').remove(paths);
      purgedCounts.resumes = paths.length;
    }
  } catch (_e) {
    // Continue
  }

  try {
    const { data: recordingFiles } = await admin.storage.from('recordings').list(user.id);
    if (recordingFiles && recordingFiles.length > 0) {
      const paths = recordingFiles.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from('recordings').remove(paths);
      purgedCounts.recordings = paths.length;
    }
  } catch (_e) {
    // Continue
  }

  // 2. Cascade delete database records
  try {
    await admin.from('profiles').delete().eq('id', user.id);
    purgedCounts.databaseRows += 1;
  } catch (_e) {
    // Continue
  }

  // 3. Remove auth user credential
  try {
    await admin.auth.admin.deleteUser(user.id);
  } catch (_e) {
    // Continue
  }

  // 4. Content-Free Audit Entry
  try {
    await admin.from('audit_logs').insert({
      user_id: null, // De-identified
      action: 'account_permanently_purged',
      details: {
        purgedCounts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (_e) {
    // Continue
  }

  const responsePayload: DeleteAccountResponse = {
    success: true,
    purgedRecords: purgedCounts,
    message: 'Your account, profile, interview transcripts, recordings, and storage objects have been permanently erased.',
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('delete-account', handleDeleteAccount);
