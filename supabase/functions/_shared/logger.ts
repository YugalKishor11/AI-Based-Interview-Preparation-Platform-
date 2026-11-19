// Structured, privacy-preserving logger
// Zero transcripts, resumes, or tokens in logs

const SENSITIVE_KEYS = new Set([
  'transcript',
  'candidatetranscript',
  'lastcandidateanswer',
  'spokentext',
  'resumetext',
  'filecontentbase64',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'apikey',
  'secret',
  'password',
  'cookie',
  'sessiontoken',
]);

export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]';
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeLogData(val, depth + 1);
    } else if (typeof val === 'string' && val.length > 500) {
      sanitized[key] = `${val.substring(0, 100)}... [TRUNCATED]`;
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  requestId: string;
  functionName: string;
  message: string;
  meta?: unknown;
}

export class Logger {
  constructor(
    private readonly requestId: string,
    private readonly functionName: string
  ) {}

  private write(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      functionName: this.functionName,
      message,
      ...(meta !== undefined ? { meta: sanitizeLogData(meta) } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(line);
    } else if (level === 'WARN') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  info(message: string, meta?: unknown) {
    this.write('INFO', message, meta);
  }

  warn(message: string, meta?: unknown) {
    this.write('WARN', message, meta);
  }

  error(message: string, meta?: unknown) {
    this.write('ERROR', message, meta);
  }
}

export function createRequestLogger(requestId: string, functionName: string): Logger {
  return new Logger(requestId, functionName);
}
