import { z } from 'zod';

// ==========================================
// CORE ENTITY SCHEMAS (Shared Frontend & Backend)
// ==========================================

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  style: z.enum(['Supportive', 'Balanced', 'Challenging']),
  description: z.string(),
  languages: z.string(),
  voiceGender: z.enum(['female', 'male']),
  sampleLine: z.string(),
  voiceId: z.string().optional(),
  p1: z.string(), // primary orb/mesh gradient color
  p2: z.string(), // secondary orb/mesh gradient color
  isDemo: z.boolean().default(true),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const InterviewTypeSchema = z.enum([
  'system-design',
  'coding',
  'behavioral',
  'technical',
  'hr',
  'dsa',
  'resume',
]);
export type InterviewType = z.infer<typeof InterviewTypeSchema>;

export const ExperienceLevelSchema = z.enum(['Fresher', 'Junior', 'Mid', 'Senior', 'Staff']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const DifficultySchema = z.enum(['Easy', 'Medium', 'Hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const InterviewPlanSchema = z.object({
  type: InterviewTypeSchema,
  targetRole: z.string(),
  experienceLevel: ExperienceLevelSchema,
  difficulty: DifficultySchema,
  durationMinutes: z.number().min(10).max(60),
  questionCount: z.number().min(3).max(15),
  language: z.string().default('English'),
  resumeText: z.string().optional(),
  resumeFileName: z.string().optional(),
  estimatedCredits: z.number().default(15),
  isDemo: z.boolean().default(true),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const DeliveryMetricsSchema = z.object({
  wpm: z.number(),
  wpmStatus: z.string(),
  fillersPerMin: z.number(),
  fillersStatus: z.string(),
  avgPauseSeconds: z.number(),
  pauseStatus: z.string(),
});
export type DeliveryMetrics = z.infer<typeof DeliveryMetricsSchema>;

export const AnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  transcript: z.string(),
  durationMs: z.number(),
  typed: z.boolean().default(false),
  deliveryMetrics: DeliveryMetricsSchema.optional(),
  isDemo: z.boolean().default(true),
});
export type Answer = z.infer<typeof AnswerSchema>;

export const RubricScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(5),
  max: z.number().default(5),
  confidence: z.enum(['Low', 'Medium', 'High']),
  quote: z.string(),
  why: z.string(),
  missingPoints: z.string().optional(),
  suggestion: z.string().optional(),
  isDemo: z.boolean().default(true),
});
export type RubricScore = z.infer<typeof RubricScoreSchema>;

export const QuestionFeedbackSchema = z.object({
  qIndex: z.number(),
  qText: z.string(),
  candidateTranscript: z.string(),
  evidence: z.string(),
  evidenceReason: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  modelAnswer: z.string(),
  isDemo: z.boolean().default(true),
});
export type QuestionFeedback = z.infer<typeof QuestionFeedbackSchema>;

export const DrillPlanItemSchema = z.object({
  day: z.string(),
  focus: z.string(),
  minutes: z.number(),
  task: z.string(),
  completed: z.boolean().optional(),
  isDemo: z.boolean().default(true),
});
export type DrillPlanItem = z.infer<typeof DrillPlanItemSchema>;

export const ReportSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  title: z.string(),
  type: z.string(),
  persona: PersonaSchema,
  date: z.string(),
  duration: z.string(),
  overallScore: z.number().min(0).max(100),
  confidence: z.string(),
  scoreDelta: z.string(),
  summary: z.string(),
  rubric: z.array(RubricScoreSchema),
  delivery: DeliveryMetricsSchema,
  questionsFeedback: z.array(QuestionFeedbackSchema),
  drillPlan: z.array(DrillPlanItemSchema),
  disclaimer: z.string().default(
    'AI estimate only. Content and delivery are scored separately. Does not score accent, gender, or appearance.'
  ),
  isDemo: z.boolean().default(true),
});
export type Report = z.infer<typeof ReportSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  personaId: z.string(),
  score: z.number(),
  durationMins: z.number(),
  date: z.string(),
  daysAgo: z.number().optional(),
  reportId: z.string().optional(),
  isDemo: z.boolean().default(true),
});
export type Session = z.infer<typeof SessionSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  level: z.enum(['Easy', 'Medium', 'Hard']),
  title: z.string(),
  tags: z.array(z.string()),
  saved: z.boolean().optional(),
  completed: z.boolean().optional(),
  hint1: z.string(),
  hint2: z.string(),
  explanation: z.string().optional(),
  isDemo: z.boolean().default(true),
});
export type Question = z.infer<typeof QuestionSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  targetRole: z.string(),
  targetLevel: z.string(),
  streakDays: z.number(),
  credits: z.number(),
  joinedDate: z.string(),
  avatarUrl: z.string().optional(),
  isDemo: z.boolean().default(true),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProgressSnapshotSchema = z.object({
  date: z.string(),
  overallScore: z.number(),
  technicalScore: z.number(),
  reasoningScore: z.number(),
  communicationScore: z.number(),
  problemSolvingScore: z.number(),
  isDemo: z.boolean().default(true),
});
export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

export const ConsentSchema = z.object({
  dataProcessing: z.boolean(),
  audioAnalysis: z.boolean(),
  retentionMonths: z.number().default(12),
  analytics: z.boolean().default(false),
});
export type Consent = z.infer<typeof ConsentSchema>;


// ==========================================
// EDGE FUNCTIONS CATALOG REQUEST / RESPONSE SCHEMAS
// ==========================================

// 1. session-token
export const SessionTokenRequestSchema = z.object({
  sessionId: z.string(),
  personaId: z.string(),
  expectedDurationMins: z.number().min(5).max(60).default(30),
});
export type SessionTokenRequest = z.infer<typeof SessionTokenRequestSchema>;

export const SessionTokenResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.number(),
  provider: z.enum(['livekit', 'gemini_live', 'openai_realtime', 'demo']),
  url: z.string().optional(),
  creditsRemaining: z.number(),
  voiceId: z.string().optional(),
});
export type SessionTokenResponse = z.infer<typeof SessionTokenResponseSchema>;

// 2. plan-interview (P1)
export const PlanInterviewRequestSchema = z.object({
  type: InterviewTypeSchema,
  targetRole: z.string().min(2),
  experienceLevel: ExperienceLevelSchema,
  difficulty: DifficultySchema,
  durationMinutes: z.number().min(10).max(60),
  questionCount: z.number().min(3).max(15),
  language: z.string().default('English'),
  focusAreas: z.array(z.string()).optional(),
  resumeSummary: z.string().optional(),
  personaId: z.string().optional(),
  voiceId: z.string().optional(),
});
export type PlanInterviewRequest = z.infer<typeof PlanInterviewRequestSchema>;

export const PlannedQuestionSchema = z.object({
  index: z.number(),
  category: z.string(),
  questionText: z.string(),
  coreConcepts: z.array(z.string()),
  anticipatedDepth: z.string(),
});
export type PlannedQuestion = z.infer<typeof PlannedQuestionSchema>;

export const PlanInterviewResponseSchema = z.object({
  planId: z.string(),
  sessionId: z.string(),
  title: z.string(),
  questions: z.array(PlannedQuestionSchema),
  estimatedCredits: z.number(),
});
export type PlanInterviewResponse = z.infer<typeof PlanInterviewResponseSchema>;

// 3. next-turn (P3)
export const NextTurnRequestSchema = z.object({
  sessionId: z.string(),
  currentQuestionIndex: z.number(),
  elapsedSeconds: z.number(),
  totalDurationSeconds: z.number(),
  lastCandidateAnswer: z.string(),
  dialogueHistory: z.array(z.object({
    role: z.enum(['interviewer', 'candidate']),
    text: z.string(),
  })).optional(),
});
export type NextTurnRequest = z.infer<typeof NextTurnRequestSchema>;

export const NextTurnResponseSchema = z.object({
  action: z.enum(['probe_deeper', 'pivot_topic', 'advance_question', 'conclude_session']),
  spokenText: z.string(),
  reason: z.string(),
  nextQuestionIndex: z.number(),
  timeRemainingSeconds: z.number(),
});
export type NextTurnResponse = z.infer<typeof NextTurnResponseSchema>;

// 4. evaluate-answer (P4)
export const EvaluateAnswerRequestSchema = z.object({
  sessionId: z.string(),
  questionIndex: z.number(),
  questionText: z.string(),
  transcript: z.string(),
  durationMs: z.number(),
  typed: z.boolean().default(false),
  deliveryMetrics: DeliveryMetricsSchema.optional(),
});
export type EvaluateAnswerRequest = z.infer<typeof EvaluateAnswerRequestSchema>;

export const EvaluateAnswerResponseSchema = z.object({
  questionIndex: z.number(),
  rubricScores: z.array(RubricScoreSchema),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  modelAnswer: z.string(),
  quoteVerified: z.boolean(),
});
export type EvaluateAnswerResponse = z.infer<typeof EvaluateAnswerResponseSchema>;

// 5. generate-report (P5 + P6)
export const GenerateReportRequestSchema = z.object({
  sessionId: z.string(),
  overallDurationMins: z.number(),
});
export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;

export const GenerateReportResponseSchema = z.object({
  report: ReportSchema,
  idempotent: z.boolean(),
});
export type GenerateReportResponse = z.infer<typeof GenerateReportResponseSchema>;

// 6. progress-snapshot
export const ProgressSnapshotRequestSchema = z.object({
  userId: z.string().optional(),
});
export type ProgressSnapshotRequest = z.infer<typeof ProgressSnapshotRequestSchema>;

export const ProgressSnapshotResponseSchema = z.object({
  latestSnapshot: ProgressSnapshotSchema,
  streakDays: z.number(),
  weakestDimension: z.string(),
  recommendedTopic: z.string(),
});
export type ProgressSnapshotResponse = z.infer<typeof ProgressSnapshotResponseSchema>;

// 7. parse-resume
export const ParseResumeRequestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size must be <= 5MB'),
  fileContentBase64: z.string().optional(),
  storagePath: z.string().optional(),
});
export type ParseResumeRequest = z.infer<typeof ParseResumeRequestSchema>;

export const ParseResumeResponseSchema = z.object({
  sanitizedSummary: z.string(),
  keyTechnologies: z.array(z.string()),
  notableProjects: z.array(z.string()),
  suggestedFocusAreas: z.array(z.string()),
});
export type ParseResumeResponse = z.infer<typeof ParseResumeResponseSchema>;

// 8. report-dispute
export const ReportDisputeRequestSchema = z.object({
  reportId: z.string(),
  dimension: z.string(),
  candidateReason: z.string().min(10, 'Please state at least 10 characters explaining your technical reasoning'),
});
export type ReportDisputeRequest = z.infer<typeof ReportDisputeRequestSchema>;

export const ReportDisputeResponseSchema = z.object({
  disputeId: z.string(),
  status: z.enum(['received', 'under_review', 'resolved']),
  message: z.string(),
});
export type ReportDisputeResponse = z.infer<typeof ReportDisputeResponseSchema>;

// 9. export-data
export const ExportDataRequestSchema = z.object({
  format: z.enum(['json', 'archive']).default('json'),
});
export type ExportDataRequest = z.infer<typeof ExportDataRequestSchema>;

export const ExportDataResponseSchema = z.object({
  downloadUrl: z.string().url().optional(),
  payload: z.record(z.unknown()).optional(),
  expiresAt: z.number(),
});
export type ExportDataResponse = z.infer<typeof ExportDataResponseSchema>;

// 10. delete-account
export const DeleteAccountRequestSchema = z.object({
  confirmationPhrase: z.literal('DELETE MY ACCOUNT PERMANENTLY'),
});
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

export const DeleteAccountResponseSchema = z.object({
  success: z.boolean(),
  purgedRecords: z.record(z.number()),
  message: z.string(),
});
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;

// 11. retention-sweep
export const RetentionSweepRequestSchema = z.object({
  transcriptRetentionDays: z.number().default(365),
  resumeRetentionDays: z.number().default(90),
  recordingRetentionDays: z.number().default(30),
  dryRun: z.boolean().default(false),
});
export type RetentionSweepRequest = z.infer<typeof RetentionSweepRequestSchema>;

export const RetentionSweepResponseSchema = z.object({
  purgedTranscriptsCount: z.number(),
  purgedResumesCount: z.number(),
  purgedRecordingsCount: z.number(),
  durationMs: z.number(),
});
export type RetentionSweepResponse = z.infer<typeof RetentionSweepResponseSchema>;

// 12. credits-debit
export const CreditsDebitRequestSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  sessionId: z.string(),
  reason: z.string(),
});
export type CreditsDebitRequest = z.infer<typeof CreditsDebitRequestSchema>;

export const CreditsDebitResponseSchema = z.object({
  success: z.boolean(),
  debitedAmount: z.number(),
  newBalance: z.number(),
});
export type CreditsDebitResponse = z.infer<typeof CreditsDebitResponseSchema>;

// 13. health
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  version: z.string(),
  database: z.enum(['connected', 'degraded', 'error']),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// Uniform Error Envelope
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    retryAfter: z.number().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
