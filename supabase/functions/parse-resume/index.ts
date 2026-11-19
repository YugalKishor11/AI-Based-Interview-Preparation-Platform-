// parse-resume: Untrusted resume parser and skill extractor
import { createEdgeFunction } from '../_shared/handler.ts';
import { requireUserAuth } from '../_shared/auth.ts';
import { enforceRateLimit } from '../_shared/rateLimit.ts';
import { ParseResumeRequestSchema, ParseResumeResponseSchema, ParseResumeResponse } from '../_shared/contracts/index.ts';
import { createSupabaseAdminClient } from '../_shared/supabaseClient.ts';
import { LlmClient } from '../_shared/llm/llmClient.ts';
import { BadRequestError } from '../_shared/error.ts';

function sanitizeResumeText(raw: string): string {
  // Strip control chars, null bytes, HTML tags, script tags
  return raw
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\x20-\x7E\t\n\r]/g, ' ') // printable ASCII + whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export const handleParseResume = async (req: Request): Promise<Response> => {
  const user = await requireUserAuth(req);

  await enforceRateLimit({
    key: `parse-resume:${user.id}`,
    capacity: 5,
    refillRatePerSec: 0.1,
  });

  const body = await req.json();
  const parsed = ParseResumeRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(`Invalid resume upload: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const { fileName, fileSize, fileContentBase64, storagePath } = parsed.data;

  // File extension validation
  const lowerName = fileName.toLowerCase();
  const isAllowedExt = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt');
  if (!isAllowedExt) {
    throw new BadRequestError('Unsupported file type. Please upload a PDF, DOCX, or TXT document.');
  }

  // Max 5MB size limit
  if (fileSize > 5 * 1024 * 1024) {
    throw new BadRequestError('File size exceeds the 5MB maximum limit.');
  }

  let extractedRawText = '';
  if (fileContentBase64) {
    try {
      const decoded = atob(fileContentBase64);
      extractedRawText = sanitizeResumeText(decoded);
    } catch (_e) {
      extractedRawText = `Resume parsed for file: ${fileName}`;
    }
  } else {
    extractedRawText = `Resume uploaded at path: ${storagePath || fileName}`;
  }

  const prompt = `
Extract neutral technical capabilities from the following candidate resume snippet:
"${extractedRawText.substring(0, 3000)}"

Return a strictly formatted JSON object:
- sanitizedSummary: 2-3 sentence neutral overview of engineering background.
- keyTechnologies: array of 4-8 languages, frameworks, or cloud technologies.
- notableProjects: array of 2-3 engineering initiatives or systems built.
- suggestedFocusAreas: array of 2-3 technical interview topics relevant to their depth.
Do NOT include personality assessments, age, gender, accent, or subjective score estimates.
`;

  const llm = new LlmClient();
  const { data: parsedResume } = await llm.generateJson(ParseResumeResponseSchema, prompt, {
    functionName: 'parse-resume',
    userId: user.id,
    temperature: 0.2,
  });

  // Persist record to resumes table
  try {
    const admin = createSupabaseAdminClient();
    await admin.from('resumes').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      file_name: fileName,
      file_path: storagePath || `${user.id}/${fileName}`,
      file_size: fileSize,
      parsed_summary: parsedResume.sanitizedSummary,
      technologies: parsedResume.keyTechnologies,
    });
  } catch (_e) {
    // Continue
  }

  return new Response(JSON.stringify(parsedResume), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default createEdgeFunction('parse-resume', handleParseResume);
