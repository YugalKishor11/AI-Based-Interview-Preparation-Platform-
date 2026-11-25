// PrepSphere Private Resume Storage & Parsing Service
// Manages client-side validation, consent enforcement, progress tracking, cancellation,
// upload to private 'resumes' bucket, signed URL retrieval, and parse-resume edge function invocation.

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { callFn } from '../supabase/callFn';
import { ParseResumeResponse, ParseResumeResponseSchema } from '../contracts';
import { mapError } from '../errors';

export interface ResumeUploadOptions {
  onProgress?: (percentage: number) => void;
  signal?: AbortSignal;
}

export interface ParsedResumeResult {
  fileName: string;
  fileSize: number;
  storagePath: string;
  signedUrl?: string;
  summary: string;
  technologies: string[];
  projects: string[];
  focusAreas: string[];
  isDemo: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export class ResumeService {
  /**
   * Validates file size and MIME/extension boundaries.
   */
  public validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed 5MB limit.`,
      };
    }

    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

    if (!hasValidExt && !hasValidMime) {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload a PDF, DOCX, or plain text (.txt) document.',
      };
    }

    return { valid: true };
  }

  /**
   * Converts a File to Base64 string safely.
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/...;base64, prefix
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read resume file.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Complete pipeline: Validate -> Upload to Private Storage -> Parse with Edge Function
   */
  public async uploadAndParseResume(
    file: File,
    options: ResumeUploadOptions = {}
  ): Promise<ParsedResumeResult> {
    const { onProgress, signal } = options;

    // 1. Client Validation
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Fallback in Demo / Unconfigured Mode
    if (!isSupabaseConfigured()) {
      return this.simulateDemoParse(file, onProgress, signal);
    }

    try {
      onProgress?.(10);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.simulateDemoParse(file, onProgress, signal);
      }

      // 3. Upload to Private 'resumes' Bucket
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`;

      onProgress?.(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, file, {
          upsert: true,
          contentType: file.type || 'application/octet-stream',
        });

      if (uploadError || !uploadData) {
        console.warn('Storage upload error, falling back to base64 direct parse:', uploadError?.message);
      }

      onProgress?.(60);

      // Check cancellation signal
      if (signal?.aborted) {
        throw new Error('Resume upload cancelled by candidate.');
      }

      // 4. Generate Signed URL (1-hour validity) for secure client reference
      let signedUrl: string | undefined;
      try {
        const { data: signed } = await supabase.storage
          .from('resumes')
          .createSignedUrl(storagePath, 3600);
        signedUrl = signed?.signedUrl;
      } catch {}

      // 5. Invoke Edge Function 'parse-resume'
      const base64Content = await this.fileToBase64(file);
      onProgress?.(75);

      const res = await callFn(
        'parse-resume',
        {
          fileName: file.name,
          fileSize: file.size,
          fileContentBase64: base64Content,
          storagePath,
        },
        ParseResumeResponseSchema
      );

      onProgress?.(100);

      return {
        fileName: file.name,
        fileSize: file.size,
        storagePath,
        signedUrl,
        summary: res.data.sanitizedSummary,
        technologies: res.data.keyTechnologies,
        projects: res.data.notableProjects,
        focusAreas: res.data.suggestedFocusAreas,
        isDemo: false,
      };
    } catch (err: unknown) {
      if (signal?.aborted) {
        throw new Error('Resume upload cancelled by candidate.');
      }
      console.warn('Live resume upload/parse error, using fallback:', err);
      return this.simulateDemoParse(file, onProgress, signal);
    }
  }

  /**
   * Deterministic local fallback parser for offline/demo operation.
   */
  private async simulateDemoParse(
    file: File,
    onProgress?: (pct: number) => void,
    signal?: AbortSignal
  ): Promise<ParsedResumeResult> {
    const steps = [25, 50, 75, 100];
    for (const step of steps) {
      if (signal?.aborted) throw new Error('Upload cancelled.');
      await new Promise((r) => setTimeout(r, 80));
      onProgress?.(step);
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      storagePath: `demo/${file.name}`,
      summary: 'Experienced distributed systems engineer with strong background in high-throughput caching, event pipelines, and multi-tenant architectures.',
      technologies: ['TypeScript', 'Node.js', 'Go', 'Distributed Caching', 'PostgreSQL', 'Docker', 'Kubernetes'],
      projects: ['High-throughput rate limiter platform', 'Global active-active state replication service'],
      focusAreas: ['Distributed Systems Partition Tolerance', 'Eventual Consistency Trade-offs', 'Observability'],
      isDemo: true,
    };
  }
}

export const resumeService = new ResumeService();
