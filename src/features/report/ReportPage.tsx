import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScoreRing } from '../../shared/ui/ScoreRing';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../shared/ui/Tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/Sheet';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../shared/ui/Accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shared/ui/Dialog';
import { SEED_REPORTS } from '../../data/mock/seed';
import { reportsRepo } from '../../data';
import { RubricScore } from '../../data/contracts';
import {
  Printer,
  Share2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
  Shield,
  Activity,
  Check,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const report = (id && SEED_REPORTS[id]) || SEED_REPORTS['rep-101'];

  // Why this score drawer state
  const [activeWhyRubric, setActiveWhyRubric] = useState<RubricScore | null>(null);

  // Dispute / Report an error dialog state
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason) return;
    const res = await reportsRepo.dispute(activeWhyRubric?.dimension || 'general', disputeReason);
    setDisputeSuccess(res.message);
    setDisputeReason('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <Badge variant="demo">Demo Report</Badge>
          <span className="text-xs text-txt-muted">Session ID: {report.sessionId}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick toggle between high-confidence and low-confidence demo reports */}
          <Link
            to={report.id === 'rep-101' ? '/app/reports/rep-103' : '/app/reports/rep-101'}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border/20 text-txt hover:bg-elevated transition-colors"
          >
            Switch to {report.id === 'rep-101' ? 'Low-Confidence Demo' : 'Standard Demo'}
          </Link>

          <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-4 h-4" /> Export PDF
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisputeOpen(true)}
            className="gap-1.5 text-xs text-txt-muted hover:text-txt"
          >
            <AlertCircle className="w-4 h-4" /> Report Score Error
          </Button>
        </div>
      </div>

      {/* Summary Row Card (Report Body: Solid card, clean typography) */}
      <div className="report-card">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                {report.type}
              </span>
              <span className="text-xs text-txt-muted">· {report.date}</span>
              <span className="text-xs text-txt-muted">· {report.duration}</span>
              <Badge variant="ai">Virtual AI: {report.persona.name}</Badge>
            </div>

            <h1 className="font-head text-2xl font-bold text-txt">{report.title}</h1>
            <p className="text-xs text-txt-2 leading-relaxed">{report.summary}</p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-elevated text-emerald-400 font-mono">
                {report.scoreDelta}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-elevated text-secondary font-mono">
                Confidence: {report.confidence}
              </span>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border/15 pt-4 md:pt-0">
            <ScoreRing score={report.overallScore} size={130} strokeWidth={10} label="AI Estimate" />
          </div>
        </div>

        {/* Limitations & Privacy Disclaimer Note */}
        <div className="mt-6 pt-4 border-t border-border/15 flex items-start gap-2.5 text-xs text-txt-muted">
          <Shield className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fairness Guarantee:</strong> Scores are AI estimates with inherent limitations. Content mastery and verbal delivery are evaluated strictly separately. Accents, gender, appearance, or physical traits are never scored.
          </p>
        </div>
      </div>

      {/* Report Tabs: Overview / Questions / Transcript / Delivery */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-border/20 rounded-none bg-transparent p-0 h-auto gap-4">
          <TabsTrigger value="overview" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
            Overview & 7-Day Drill
          </TabsTrigger>
          <TabsTrigger value="questions" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
            Question Feedback ({report.questionsFeedback.length})
          </TabsTrigger>
          <TabsTrigger value="transcript" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
            Searchable Transcript
          </TabsTrigger>
          <TabsTrigger value="delivery" className="pb-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm">
            Delivery & Pacing Metrics
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Rubric Breakdown */}
          <div className="report-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/15">
              <h3 className="font-head font-bold text-sm text-txt">
                Rubric Dimension Breakdown (0.0 to 5.0)
              </h3>
              <span className="text-[11px] text-txt-muted">Click dimension for evidence quote</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.rubric.map((item) => {
                const percentage = (item.score / item.max) * 100;
                return (
                  <div
                    key={item.dimension}
                    onClick={() => setActiveWhyRubric(item)}
                    className="p-3.5 rounded-xl bg-elevated/40 hover:bg-elevated/80 border border-border/15 cursor-pointer transition-colors space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-txt">{item.dimension}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-txt">
                          {item.score} / {item.max}
                        </span>
                        <Badge
                          variant={
                            item.confidence === 'High'
                              ? 'success'
                              : item.confidence === 'Medium'
                              ? 'neutral'
                              : 'warning'
                          }
                          className="text-[9px] py-0"
                        >
                          {item.confidence}
                        </Badge>
                      </div>
                    </div>

                    <div className="rubric-track">
                      <div
                        className={`rubric-fill ${
                          item.score >= 4
                            ? 'bg-emerald-400'
                            : item.score >= 3.5
                            ? 'bg-secondary'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-txt-muted line-clamp-1 italic">
                      "{item.quote}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Drill Plan */}
          <div className="report-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/15">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-head font-bold text-sm text-txt">Targeted 7-Day Drill Plan</h3>
                <span className="text-xs text-txt-muted">
                  Customized practice schedule to address structural gaps before re-interviewing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.drillPlan.map((drill, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface border border-border/20 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary">{drill.day}</span>
                    <span className="text-[11px] text-txt-muted font-mono">{drill.minutes} mins</span>
                  </div>
                  <h4 className="text-xs font-bold text-txt">{drill.focus}</h4>
                  <p className="text-xs text-txt-2 leading-relaxed">{drill.task}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Link to="/app/practice" className="btn btn-primary text-xs py-2 px-4 gap-1.5">
                Launch Recommended Practice Drills <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </TabsContent>

        {/* 2. Questions Tab */}
        <TabsContent value="questions" className="space-y-4 pt-4">
          {report.questionsFeedback.map((q) => (
            <div key={q.qIndex} className="report-card space-y-4 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-border/15">
                <span className="text-xs font-bold text-secondary uppercase font-mono">
                  Question {q.qIndex}
                </span>
                <Badge variant="demo">Evidence Inspected</Badge>
              </div>

              <h3 className="font-head font-bold text-base text-txt">{q.qText}</h3>

              {/* Verbatim Transcript */}
              <div className="p-3.5 rounded-xl bg-elevated/50 text-xs text-txt-2 leading-relaxed">
                <span className="text-[10px] font-bold uppercase tracking-wider text-txt-muted block mb-1">
                  Your Answer Transcript:
                </span>
                <p>"{q.candidateTranscript}"</p>
              </div>

              {/* Evidence Quote Callout */}
              <div className="evidence-quote text-xs">
                <span className="font-bold text-txt block not-italic mb-0.5">
                  Evaluator Transcript Evidence:
                </span>
                "{q.evidence}"
                <p className="text-[11px] text-secondary not-italic mt-1">
                  Reasoning: {q.evidenceReason}
                </p>
              </div>

              {/* Strengths & Missing Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-txt-2">
                  <span className="font-bold text-emerald-400 block mb-1">Key Strengths:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {q.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-txt-2">
                  <span className="font-bold text-amber-400 block mb-1">Areas to Deepen:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {q.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Answer */}
              <div className="p-3.5 rounded-xl bg-surface border border-primary/25 text-xs text-txt-2 leading-relaxed">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                  Staff Exemplar / Model Answer:
                </span>
                <p>{q.modelAnswer}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* 3. Transcript Tab */}
        <TabsContent value="transcript" className="pt-4">
          <div className="report-card space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border/15">
              <h3 className="font-head font-bold text-sm text-txt">Full Verbatim Transcript</h3>
              <span className="text-[11px] text-txt-muted">Generated from live speech stream</span>
            </div>

            <div className="space-y-4 text-xs">
              {report.questionsFeedback.map((turn, i) => (
                <div key={i} className="space-y-2">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-txt">
                    <span className="font-bold text-primary block mb-1">
                      {report.persona.name} (Virtual AI):
                    </span>
                    <p>{turn.qText}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface border border-border/20 text-txt-2 ml-4">
                    <span className="font-bold text-secondary block mb-1">Alex Chen (Candidate):</span>
                    <p>{turn.candidateTranscript}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 4. Delivery Metrics Tab */}
        <TabsContent value="delivery" className="pt-4">
          <div className="report-card space-y-5 text-left">
            <div>
              <h3 className="font-head font-bold text-sm text-txt">
                Speech Delivery & Pacing Telemetry
              </h3>
              <p className="text-xs text-txt-2 mt-0.5">
                Delivery metrics are reported independently and strictly never impact technical rubric scores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border/20">
                <span className="text-[11px] text-txt-muted">Speaking Pace</span>
                <div className="text-2xl font-mono font-bold text-txt my-1">{report.delivery.wpm} WPM</div>
                <span className="text-xs text-emerald-400 font-semibold">{report.delivery.wpmStatus}</span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border/20">
                <span className="text-[11px] text-txt-muted">Filler Words</span>
                <div className="text-2xl font-mono font-bold text-txt my-1">{report.delivery.fillersPerMin} / min</div>
                <span className="text-xs text-emerald-400 font-semibold">{report.delivery.fillersStatus}</span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border/20">
                <span className="text-[11px] text-txt-muted">Average Thoughtful Pause</span>
                <div className="text-2xl font-mono font-bold text-txt my-1">{report.delivery.avgPauseSeconds} s</div>
                <span className="text-xs text-secondary font-semibold">{report.delivery.pauseStatus}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* "Why This Score?" Detail Drawer */}
      {activeWhyRubric && (
        <Sheet open={Boolean(activeWhyRubric)} onOpenChange={() => setActiveWhyRubric(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Rubric Evaluation Detail</SheetTitle>
              <SheetDescription>
                Dimension: <strong>{activeWhyRubric.dimension}</strong>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 mt-6 text-xs text-left">
              <div className="p-4 rounded-xl bg-surface border border-border/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted">Score:</span>
                  <span className="text-lg font-mono font-bold text-txt">
                    {activeWhyRubric.score} / {activeWhyRubric.max}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted">Confidence Level:</span>
                  <Badge variant="success">{activeWhyRubric.confidence}</Badge>
                </div>
              </div>

              <div>
                <span className="font-bold text-txt block mb-1">Verbatim Transcript Proof:</span>
                <div className="evidence-quote">"{activeWhyRubric.quote}"</div>
              </div>

              <div>
                <span className="font-bold text-txt block mb-1">Evaluator Explanation:</span>
                <p className="text-txt-2 leading-relaxed p-3 rounded-lg bg-elevated/50">
                  {activeWhyRubric.why}
                </p>
              </div>

              {activeWhyRubric.missingPoints && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-txt-2">
                  <span className="font-bold text-amber-400 block mb-1">Missing Elements:</span>
                  <p>{activeWhyRubric.missingPoints}</p>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDisputeOpen(true)}
                className="w-full mt-4"
              >
                Dispute this score
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Report An Error / Dispute Dialog */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute Evaluation Score</DialogTitle>
            <DialogDescription>
              We treat transparent evaluation seriously. State your technical reasoning if you believe the AI evaluator missed transcript evidence.
            </DialogDescription>
          </DialogHeader>

          {disputeSuccess ? (
            <div className="py-4 space-y-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs text-txt">{disputeSuccess}</p>
              <Button variant="primary" size="sm" onClick={() => setDisputeOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleDispute} className="space-y-4">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this score was inaccurate or cite missed transcript sentences..."
                rows={4}
                className="input textarea text-xs"
                required
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDisputeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Submit Dispute
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
