import { z } from 'zod';

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  style: z.enum(['Supportive', 'Balanced', 'Challenging']),
  description: z.string(),
  languages: z.string(),
  voiceGender: z.enum(['female', 'male']),
  sampleLine: z.string(),
  p1: z.string(), // primary orb/mesh gradient color
  p2: z.string(), // secondary orb/mesh gradient color
  isDemo: z.literal(true).default(true),
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

export const InterviewPlanSchema = z.object({
  type: InterviewTypeSchema,
  targetRole: z.string(),
  experienceLevel: z.enum(['Fresher', 'Junior', 'Mid', 'Senior', 'Staff']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  durationMinutes: z.number().min(10).max(60),
  questionCount: z.number().min(3).max(15),
  language: z.string().default('English'),
  resumeText: z.string().optional(),
  resumeFileName: z.string().optional(),
  estimatedCredits: z.number().default(15),
  isDemo: z.literal(true).default(true),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const AnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  transcript: z.string(),
  durationMs: z.number(),
  typed: z.boolean().default(false),
  deliveryMetrics: z.object({
    wpm: z.number(),
    wpmStatus: z.string(),
    fillersPerMin: z.number(),
    fillersStatus: z.string(),
    avgPauseSeconds: z.number(),
    pauseStatus: z.string(),
  }).optional(),
  isDemo: z.literal(true).default(true),
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
  isDemo: z.literal(true).default(true),
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
  isDemo: z.literal(true).default(true),
});
export type QuestionFeedback = z.infer<typeof QuestionFeedbackSchema>;

export const DrillPlanItemSchema = z.object({
  day: z.string(),
  focus: z.string(),
  minutes: z.number(),
  task: z.string(),
  isDemo: z.literal(true).default(true),
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
  delivery: z.object({
    wpm: z.number(),
    wpmStatus: z.string(),
    fillersPerMin: z.number(),
    fillersStatus: z.string(),
    avgPauseSeconds: z.number(),
    pauseStatus: z.string(),
  }),
  questionsFeedback: z.array(QuestionFeedbackSchema),
  drillPlan: z.array(DrillPlanItemSchema),
  disclaimer: z.string().default('AI estimate only. Content and delivery are scored separately. Does not score accent, gender, or appearance.'),
  isDemo: z.literal(true).default(true),
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
  daysAgo: z.number(),
  reportId: z.string().optional(),
  isDemo: z.literal(true).default(true),
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
  isDemo: z.literal(true).default(true),
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
  isDemo: z.literal(true).default(true),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProgressSnapshotSchema = z.object({
  date: z.string(),
  overallScore: z.number(),
  technicalScore: z.number(),
  reasoningScore: z.number(),
  communicationScore: z.number(),
  problemSolvingScore: z.number(),
  isDemo: z.literal(true).default(true),
});
export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

export const ConsentSchema = z.object({
  dataProcessing: z.boolean(),
  audioAnalysis: z.boolean(),
  retentionMonths: z.number().default(12),
  analytics: z.boolean().default(false),
});
export type Consent = z.infer<typeof ConsentSchema>;
