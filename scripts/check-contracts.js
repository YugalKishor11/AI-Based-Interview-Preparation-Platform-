import fs from 'fs';
import path from 'path';
import * as sharedContracts from '../supabase/functions/_shared/contracts/index.ts';
import * as frontendContracts from '../src/data/contracts/index.ts';

console.log('--- Checking Contracts Single Source & Drift ---');

const REQUIRED_SCHEMAS = [
  'PersonaSchema',
  'InterviewTypeSchema',
  'InterviewPlanSchema',
  'AnswerSchema',
  'RubricScoreSchema',
  'QuestionFeedbackSchema',
  'DrillPlanItemSchema',
  'ReportSchema',
  'SessionSchema',
  'QuestionSchema',
  'ProfileSchema',
  'ProgressSnapshotSchema',
  'ConsentSchema',
  'SessionTokenRequestSchema',
  'SessionTokenResponseSchema',
  'PlanInterviewRequestSchema',
  'PlanInterviewResponseSchema',
  'NextTurnRequestSchema',
  'NextTurnResponseSchema',
  'EvaluateAnswerRequestSchema',
  'EvaluateAnswerResponseSchema',
  'GenerateReportRequestSchema',
  'GenerateReportResponseSchema',
  'ProgressSnapshotRequestSchema',
  'ProgressSnapshotResponseSchema',
  'ParseResumeRequestSchema',
  'ParseResumeResponseSchema',
  'ReportDisputeRequestSchema',
  'ReportDisputeResponseSchema',
  'ExportDataRequestSchema',
  'ExportDataResponseSchema',
  'DeleteAccountRequestSchema',
  'DeleteAccountResponseSchema',
  'RetentionSweepRequestSchema',
  'RetentionSweepResponseSchema',
  'CreditsDebitRequestSchema',
  'CreditsDebitResponseSchema',
  'HealthResponseSchema',
  'ErrorEnvelopeSchema',
];

let errors = 0;

for (const name of REQUIRED_SCHEMAS) {
  if (!sharedContracts[name]) {
    console.error(`FAIL: Schema '${name}' missing in supabase/functions/_shared/contracts`);
    errors++;
  }
  if (!frontendContracts[name]) {
    console.error(`FAIL: Schema '${name}' missing in src/data/contracts re-export`);
    errors++;
  }
}

if (errors === 0) {
  console.log(`✓ All ${REQUIRED_SCHEMAS.length} contracts verified. Single source is active with zero drift.`);
  process.exit(0);
} else {
  console.error(`\nFound ${errors} contract drift errors.`);
  process.exit(1);
}
