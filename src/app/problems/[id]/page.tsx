import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ExternalLink, Lightbulb, ListChecks, ShieldAlert } from "lucide-react";
import { ConfidenceBadge, DifficultyBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { SubmissionWorkspace } from "@/components/submission-workspace";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ROLE_LABELS, type AttemptStatus, type SubmissionStatus } from "@/lib/enums";
import { parseJsonArray } from "@/lib/json";
import { hydrateProblem } from "@/lib/problems";

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
  const isCoding = problem.testHarnessType === "function_call" && problem.supportedLanguages.length > 0;
  const learningPaths = problem.pathIds.length
    ? await db.learningPath.findMany({ where: { id: { in: problem.pathIds } } })
    : [];

  return (
    <div className="mx-auto flex max-w-[96rem] flex-col gap-5">
      <Link href="/problems" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Problems
      </Link>

      <header className="border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={problem.type} />
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.confidenceLevel && <ConfidenceBadge level={problem.confidenceLevel} />}
          <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{problem.estimatedMinutes} min</span>
        </div>
        <h2 className="mt-3 max-w-5xl text-2xl font-semibold tracking-tight md:text-3xl">{problem.title}</h2>
      </header>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)]">
        <Card className="xl:sticky xl:top-18 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
          <CardHeader className="border-b">
            <CardTitle>Problem statement</CardTitle>
            <CardDescription>Keep this pane visible while you work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {problem.context && <p className="text-sm leading-relaxed text-muted-foreground">{problem.context}</p>}
            <Markdown className="prose-base">{problem.prompt}</Markdown>

            {problem.constraints && (
              <div className="border-t pt-5">
                <h3 className="mb-3 text-sm font-semibold">Constraints and expectations</h3>
                <Markdown>{problem.constraints}</Markdown>
              </div>
            )}

            <div className="border-t pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="size-4" />
                <h3 className="text-sm font-semibold">Hints</h3>
              </div>
              <div className="space-y-2">
                {problem.hints.map((hint, index) => (
                  <details key={hint} className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">Hint {index + 1}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
                  </details>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
      </section>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-medium">
          <ListChecks className="size-4" /> Review and interview follow-ups
          <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Open after your attempt</span>
        </summary>
        <div className="grid gap-4 border-t p-4 lg:grid-cols-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4" /> Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{problem.commonMistakes.map((item) => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Follow-up questions</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">{problem.followUpQuestions.map((item, index) => <li key={item} className="flex gap-2"><span className="font-mono text-xs">{index + 1}.</span><span>{item}</span></li>)}</ol>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Interview rubric</h3>
            <div className="mt-3 space-y-2">{problem.rubric.map((item) => <div key={item.criterion} className="rounded-lg border p-3"><div className="text-sm font-medium">{item.criterion}</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p></div>)}</div>
          </div>
        </div>
      </details>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader><CardTitle>Study context</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">{problem.topics.map((topic) => <Link key={topic} href={`/problems?topic=${encodeURIComponent(topic)}`}><Badge variant="secondary">{topic}</Badge></Link>)}</div>
            {learningPaths.length > 0 && <div className="flex flex-wrap gap-2 border-t pt-3">{learningPaths.map((path) => <Link key={path.id} href={`/paths/${path.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{path.title}</Link>)}</div>}
            <p className="text-xs text-muted-foreground">Target roles: {problem.targetRoles.map((role) => ROLE_LABELS[role]).join(" · ")}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>Attempt and sources</CardTitle><CardDescription>{latestAttempt ? "Latest recorded attempt" : "No attempt recorded yet"}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {latestAttempt ? <div className="flex items-center gap-3"><StatusBadge status={latestAttempt.status as AttemptStatus} />{latestAttempt.notes && <span className="text-xs text-muted-foreground">{latestAttempt.notes}</span>}</div> : <Link href={`/practice?type=${problem.type}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Practice this format</Link>}
            <div className="space-y-2 border-t pt-3">
              {problem.sourceUrls.length > 0 ? problem.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-start gap-2 break-all text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="mt-0.5 size-3 shrink-0" />{url}</a>) : <p className="text-xs text-muted-foreground">Original Interview OS material.</p>}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
