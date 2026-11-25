# PrepSphere Product Analytics Specification

## 1. Privacy-First Principles
PrepSphere product analytics follows strict privacy-by-design standards:
- **Consent-Gated**: Controlled by the `analytics` consent flag recorded in `public.consents`. If the candidate declines or revokes analytics consent, all telemetry is disabled (`Off`).
- **Zero-Transcript Guarantee**: No spoken words, transcribed candidate responses, LLM evaluation details, resume text, or candidate identifiers are ever collected in analytics events.
- **Aggregated & Content-Free**: Only high-level event taxonomy with numerical durations, categories, and technical types.

---

## 2. Event Catalog

| Event Name | Trigger Condition | Properties Recorded | Omitted / Scrubbed |
| :--- | :--- | :--- | :--- |
| `session_started` | Candidate launches interview room | `sessionId`, `interviewType` | Resume text, persona prompt |
| `session_completed` | Candidate concludes session and generates report | `sessionId`, `durationSeconds`, `score` | Audio, transcripts, verbatim feedback |
| `session_cancelled` | Candidate aborts interview before completion | `sessionId`, `durationSeconds` | Partial transcripts |
| `turn_completed` | Turn completes with follow-up or next question | `sessionId`, `turnSeq` | Spoken lines, typed answer text |
| `question_saved` | Candidate bookmarks question in Practice Bank | `questionId`, `topic` | User notes, solutions |
| `question_completed` | Candidate marks question complete | `questionId`, `topic` | Solution code or text |
| `resume_uploaded` | Resume file parsed in setup wizard | `fileSize`, `fileType` | Resume text, personal identifiers, candidate name |
| `report_viewed` | Candidate views evaluation report | `reportId`, `overallScore` | Detailed rubrics, evidence quotes |
| `dispute_filed` | Candidate submits feedback review query | `reportId`, `dimension` | Candidate justification message |
| `settings_updated` | Candidate modifies retention or preferences | `theme`, `locale` | Passwords, emails |
| `theme_changed` | Candidate toggles dark/light theme | `theme` | None |

---

## 3. Compliance Verification
- Automated tests verify that calling `analytics.track()` when `consent === false` performs zero network requests.
- Contract checks verify that `properties` never contain keys matching `transcript`, `answer`, `resume`, or `token`.
