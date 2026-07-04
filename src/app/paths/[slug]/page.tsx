import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock3, MapPin } from "lucide-react";
import { ConfidenceBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ROLE_LABELS, type ConfidenceLevel } from "@/lib/enums";
import { hydrateLearningModule, hydrateLearningPath, hydrateLesson } from "@/lib/learning";
import { completedProblemIds, progressPercent } from "@/lib/learning-progress";
import { hydrateProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

export default async function PathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [rawPath, rawProblems, attempts, submissions] = await Promise.all([
    db.learningPath.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
    }),
    db.problem.findMany(),
    db.attempt.findMany(),
    db.submission.findMany({ select: { problemId: true, status: true } }),
  ]);
  if (!rawPath || !rawPath.isPublished) notFound();

  const path = hydrateLearningPath(rawPath);
  const problems = rawProblems.map(hydrateProblem);
  const pathProblems = problems.filter((problem) => problem.pathIds.includes(path.id));
  const completed = completedProblemIds(attempts, submissions);
  const activityProblemIds = new Set([
    ...attempts.map((attempt) => attempt.problemId),
    ...submissions.map((submission) => submission.problemId),
  ]);
  const hasActivity = pathProblems.some((problem) => activityProblemIds.has(problem.id));
  const percent = progressPercent(pathProblems.map((problem) => problem.id), completed);
  const currentModule = rawPath.modules.find((learningModule) => {
    const moduleProblems = pathProblems.filter((problem) =>
      problem.moduleIds.includes(learningModule.id)
    );
    return (
      moduleProblems.length === 0 ||
      moduleProblems.some((problem) => !completed.has(problem.id))
    );
  }) ?? rawPath.modules.at(-1);
  const firstLesson = currentModule?.lessons[0];
  const confidenceCounts = (["warmup", "core", "challenge", "advanced"] as ConfidenceLevel[])
    .map((level) => ({ level, count: pathProblems.filter((problem) => problem.confidenceLevel === level).length }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <Link href="/paths" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All paths
      </Link>

      <section className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {path.targetRoles.map((role) => <Badge key={role} variant="secondary">{ROLE_LABELS[role]}</Badge>)}
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{path.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{path.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{path.estimatedHours} estimated hours</span>
          <span className="flex items-center gap-1"><BookOpen className="size-3.5" />{rawPath.modules.length} modules</span>
          <span>{pathProblems.length} linked problems</span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Problem completion</span><span>{percent}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
          </div>
          {firstLesson && <Link href={`/lessons/${firstLesson.slug}`} className={buttonVariants({ size: "lg" })}>{hasActivity ? "Continue path" : "Start path"}<ArrowRight /></Link>}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Your progression</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {confidenceCounts.map(({ level, count }) => <Card key={level} size="sm"><CardHeader><ConfidenceBadge level={level} /><CardTitle className="mt-2 text-2xl">{count}</CardTitle><CardDescription>linked problems</CardDescription></CardHeader></Card>)}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Modules</h3>
        <div className="mt-3 space-y-3">
          {rawPath.modules.map((rawModule, index) => {
            const learningModule = hydrateLearningModule(rawModule);
            const lessons = rawModule.lessons.map(hydrateLesson);
            const realCount = lessons.filter((lesson) => !lesson.isPlaceholder).length;
            return (
              <Link key={learningModule.id} href={`/paths/${path.slug}/modules/${learningModule.slug}`} className="group block">
                <Card className="transition-colors group-hover:bg-muted/30">
                  <CardContent className="flex gap-4 py-1">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs">{index + 1}</div>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><CardTitle>{learningModule.title}</CardTitle>{currentModule?.id === learningModule.id && <Badge variant="outline"><MapPin /> You are here</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{learningModule.description}</p><div className="mt-2 text-xs text-muted-foreground">{lessons.length} lessons · {realCount} ready · {learningModule.estimatedHours}h</div></div>
                    <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2"><CalendarDays className="size-4" /><h3 className="text-lg font-semibold">Recommended weekly plan</h3></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rawPath.modules.map((rawModule, index) => <div key={rawModule.id} className="rounded-xl border p-4"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Week {index + 1}</div><div className="mt-1 font-medium">{rawModule.title}</div><p className="mt-1 text-xs text-muted-foreground">Read lessons, complete one warmup and one core problem, then self-review.</p></div>)}
        </div>
      </section>
    </div>
  );
}
