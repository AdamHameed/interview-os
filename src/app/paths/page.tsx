import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/enums";
import { hydrateLearningPath } from "@/lib/learning";
import { completedProblemIds, progressPercent } from "@/lib/learning-progress";
import { hydrateProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

export default async function PathsPage() {
  const [rawPaths, rawProblems, attempts, submissions] = await Promise.all([
    db.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: { modules: { include: { module: { include: { lessons: true } } } } },
    }),
    db.problem.findMany(),
    db.attempt.findMany(),
    db.submission.findMany({ select: { problemId: true, status: true } }),
  ]);
  const problems = rawProblems.map(hydrateProblem);
  const completed = completedProblemIds(attempts, submissions);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      <section className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Guided learning
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Follow a path instead of guessing what to study next.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each path orders lessons and practice from confidence-building warmups into core,
          challenge, and advanced interview work. Finished lesson content is mixed with clearly
          marked scaffolds for future expansion.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rawPaths.map((rawPath) => {
          const path = hydrateLearningPath(rawPath);
          const pathProblems = problems.filter((problem) => problem.pathIds.includes(path.id));
          const percent = progressPercent(pathProblems.map((problem) => problem.id), completed);
          const lessons = rawPath.modules.flatMap((membership) => membership.module.lessons);
          const realLessons = lessons.filter((lesson) => !lesson.isPlaceholder).length;
          return (
            <Link key={path.id} href={`/paths/${path.slug}`} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:bg-muted/30">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Route className="size-4" />
                    </div>
                    <Badge variant="outline">{path.difficulty.replaceAll("-", " ")}</Badge>
                  </div>
                  <CardTitle className="text-lg">{path.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{path.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {path.targetRoles.slice(0, 3).map((role) => (
                      <Badge key={role} variant="secondary">{ROLE_LABELS[role]}</Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock3 className="size-3" />{path.estimatedHours}h</span>
                    <span className="flex items-center gap-1"><BookOpen className="size-3" />{realLessons} ready</span>
                    <span>{pathProblems.length} problems</span>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Problem progress</span><span>{percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    Open path <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
