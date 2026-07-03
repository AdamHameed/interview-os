import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ExternalLink, Lightbulb, ListChecks, ShieldAlert } from "lucide-react";
import { DifficultyBadge, QualityDots, SourceBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { SubmissionWorkspace } from "@/components/submission-workspace";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ROLE_LABELS, type AttemptStatus } from "@/lib/enums";
import { hydrateProblem } from "@/lib/problems";
import { parseJsonArray } from "@/lib/json";
import type { SubmissionStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await db.problem.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      attempts: { orderBy: { updatedAt: "desc" }, take: 1 },
      submissions: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!record) notFound();

  const { attempts, submissions, ...rawProblem } = record;
  const problem = hydrateProblem(rawProblem);
  const latestAttempt = attempts[0];
  const latestSubmission = submissions[0];
  const isCoding =
    problem.testHarnessType === "function_call" &&
    problem.supportedLanguages.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link href="/problems" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to problems
      </Link>

      <section className="rounded-2xl border bg-card p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={problem.type} />
          <DifficultyBadge difficulty={problem.difficulty} />
          <SourceBadge sourceType={problem.sourceType} />
        </div>
        <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">{problem.title}</h2>
        {problem.context && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{problem.context}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {problem.estimatedMinutes} minutes</span>
          <span className="flex items-center gap-1.5"><QualityDots score={problem.qualityScore} /> source quality</span>
          {problem.language && <Badge variant="outline">{problem.language}</Badge>}
          {problem.targetRoles.map((role) => <Badge key={role} variant="secondary">{ROLE_LABELS[role]}</Badge>)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Prompt</CardTitle></CardHeader>
            <CardContent><Markdown>{problem.prompt}</Markdown></CardContent>
          </Card>

          {problem.constraints && (
            <Card>
              <CardHeader><CardTitle>Constraints and expectations</CardTitle></CardHeader>
              <CardContent><Markdown>{problem.constraints}</Markdown></CardContent>
            </Card>
          )}

          <SubmissionWorkspace
            problemId={problem.id}
            isCoding={isCoding}
            functionName={problem.functionName ?? "solve"}
            supportedLanguages={problem.supportedLanguages}
            starterCode={problem.starterCode ?? ""}
            rubric={problem.rubric}
            solutionOutline={problem.solutionOutline}
            initialSubmission={latestSubmission ? {
              id: latestSubmission.id,
              answerText: latestSubmission.answerText,
              language: latestSubmission.language,
              status: latestSubmission.status as SubmissionStatus,
              selfScore: latestSubmission.selfScore,
              reviewFeedback: latestSubmission.reviewFeedback,
              testResults: parseJsonArray(latestSubmission.testResults),
            } : null}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="size-4" /> Hints</CardTitle>
              <CardDescription>Reveal one at a time before reading the outline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {problem.hints.map((hint, index) => (
                <details key={hint} className="group rounded-lg border p-3">
                  <summary className="cursor-pointer text-sm font-medium">Hint {index + 1}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
                </details>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4" /> Common mistakes</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{problem.commonMistakes.map((item) => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}</ul></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Follow-up questions</CardTitle></CardHeader>
              <CardContent><ol className="space-y-3 text-sm text-muted-foreground">{problem.followUpQuestions.map((item, index) => <li key={item} className="flex gap-2"><span className="font-mono text-xs">{index + 1}.</span><span>{item}</span></li>)}</ol></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-4" /> Interview rubric</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {problem.rubric.map((item) => <div key={item.criterion} className="rounded-lg border p-3"><div className="font-medium">{item.criterion}</div><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p></div>)}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card size="sm">
            <CardHeader><CardTitle>Topics</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">{problem.topics.map((topic) => <Link key={topic} href={`/problems?topic=${encodeURIComponent(topic)}`}><Badge variant="secondary">{topic}</Badge></Link>)}</CardContent>
          </Card>

          <Card size="sm">
            <CardHeader><CardTitle>Attempt status</CardTitle><CardDescription>{latestAttempt ? "Latest recorded attempt" : "No attempt recorded yet"}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {latestAttempt ? <><StatusBadge status={latestAttempt.status as AttemptStatus} />{latestAttempt.notes && <p className="text-xs leading-relaxed text-muted-foreground">{latestAttempt.notes}</p>}</> : <Link href={`/practice?type=${problem.type}`} className={buttonVariants({ size: "sm", className: "w-full" })}>Practice this format</Link>}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader><CardTitle>Sources and provenance</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {problem.sourceUrls.length > 0 ? problem.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-start gap-2 break-all text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="mt-0.5 size-3 shrink-0" />{url}</a>) : <p className="text-xs text-muted-foreground">Original Interview OS material.</p>}
              {problem.licenseNote && <p className="border-t pt-2 text-xs leading-relaxed text-muted-foreground">{problem.licenseNote}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
