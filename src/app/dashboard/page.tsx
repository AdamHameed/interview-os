import Link from "next/link";
import { ArrowRight, BookOpenCheck, CircleAlert, GraduationCap, Shapes, Target, Trophy } from "lucide-react";
import { TypeBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { PROBLEM_TYPE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/enums";
import { hydrateProblem } from "@/lib/problems";
import { formatProgress, recommendNext, reviewQueue, weakTopics } from "@/lib/stats";
import { completedProblemIds, progressPercent } from "@/lib/learning-progress";

export const dynamic = "force-dynamic";

const TRACKS: { role: Role; description: string }[] = [
  { role: "backend_swe", description: "APIs, data, reliability, and coding rounds" },
  { role: "infrastructure_swe", description: "Concurrency, debugging, systems, and performance" },
  { role: "quant_developer", description: "Latency, market systems, C++, and probability-aware engineering" },
  { role: "platform_engineer", description: "AI-assisted engineering, developer systems, and operations" },
];

export default async function DashboardPage() {
  const [rawProblems, attempts, submissions, learningPaths, quickModules] = await Promise.all([
    db.problem.findMany({ orderBy: [{ qualityScore: "desc" }, { title: "asc" }] }),
    db.attempt.findMany({ orderBy: { updatedAt: "desc" } }),
    db.submission.findMany({ select: { problemId: true, status: true } }),
    db.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { module: { include: { lessons: { orderBy: { order: "asc" } } } } },
        },
      },
    }),
    db.learningModule.findMany({
      where: { slug: { in: ["kubernetes-fundamentals", "docker-fundamentals", "threading-synchronization", "raii-resource-ownership", "sql-indexes", "system-design-interview-framework", "market-data-feeds", "token-efficient-prompting"] }, isPublished: true },
      orderBy: { title: "asc" },
    }),
  ]);
  const problems = rawProblems.map(hydrateProblem);
  const progress = formatProgress(problems, attempts).filter((item) => item.total > 0);
  const modeRecommendations = [...progress]
    .sort((a, b) => a.solved / a.total - b.solved / b.total || b.total - a.total)
    .slice(0, 3);
  const weak = weakTopics(problems, attempts);
  const reviews = reviewQueue(problems, attempts);
  const recommendations = recommendNext(problems, attempts, 4);
  const attemptedCount = new Set(attempts.map((attempt) => attempt.problemId)).size;
  const solvedCount = progress.reduce((total, item) => total + item.solved, 0);
  const completed = completedProblemIds(attempts, submissions);
  const activityProblemIds = new Set([
    ...attempts.map((attempt) => attempt.problemId),
    ...submissions.map((submission) => submission.problemId),
  ]);
  const activePaths = learningPaths.filter((path) =>
    problems.some(
      (problem) =>
        problem.pathIds.includes(path.id) && activityProblemIds.has(problem.id)
    )
  );
  const continuePaths = (activePaths.length > 0 ? activePaths : learningPaths).slice(0, 2);
  const nextLesson = continuePaths
    .flatMap((path) => path.modules.flatMap((membership) => membership.module.lessons))
    .find((lesson) => !lesson.isPlaceholder);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Preparation overview
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Train with intent.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Use the bank to balance format coverage, revisit weak areas, and choose the next
            interview-sized exercise.
          </p>
        </div>
        <Link href="/practice" className={buttonVariants({ size: "lg" })}>
          Start a practice round <ArrowRight />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Problem bank", value: problems.length, icon: BookOpenCheck },
          { label: "Attempted", value: attemptedCount, icon: Target },
          { label: "Solved", value: solvedCount, icon: Trophy },
          { label: "Needs review", value: reviews.length, icon: CircleAlert },
        ].map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader className="grid-cols-[1fr_auto] items-center">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="size-5" /> Continue learning
            </h3>
            <p className="text-sm text-muted-foreground">
              {activePaths.length > 0
                ? "Resume the paths connected to your completed practice."
                : "Start with a guided sequence instead of browsing the entire bank."}
            </p>
          </div>
          <Link href="/paths" className="text-sm text-muted-foreground hover:text-foreground">
            View all paths
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr]">
          {continuePaths.map((path) => {
            const pathProblems = problems.filter((problem) => problem.pathIds.includes(path.id));
            const percent = progressPercent(pathProblems.map((problem) => problem.id), completed);
            return (
              <Link key={path.id} href={`/paths/${path.slug}`} className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-3"><span className="font-medium">{path.title}</span><span className="text-xs text-muted-foreground">{percent}%</span></div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{path.description}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
              </Link>
            );
          })}
          {nextLesson && (
            <Link href={`/lessons/${nextLesson.slug}`} className="rounded-xl border border-dashed p-4 transition-colors hover:bg-muted/40">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next recommended lesson</div>
              <div className="mt-2 font-medium">{nextLesson.title}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">Continue <ArrowRight className="size-3" /></div>
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Coverage by interview format</CardTitle>
            <CardDescription>Bank size and current completion across every populated format.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {progress.map((item) => (
              <Link
                key={item.type}
                href={`/problems?type=${item.type}`}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <TypeBadge type={item.type} />
                  <span className="text-xs text-muted-foreground">
                    {item.solved}/{item.total} solved
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.total ? (item.solved / item.total) * 100 : 0}%` }}
                  />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{weak.length > 0 ? "Weak topics" : "Build your signal"}</CardTitle>
            <CardDescription>
              {weak.length > 0
                ? "Topics averaging below 3.5 across recorded attempts."
                : "Complete and score attempts to unlock weakness tracking."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weak.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weak.map((topic) => (
                  <Link key={topic.topic} href={`/problems?topic=${encodeURIComponent(topic.topic)}`}>
                    <Badge variant="outline">
                      {topic.topic} · {topic.avgScore}/5
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Start with a focused practice round, then record honest self-scores and review flags.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="flex items-center gap-2 text-lg font-semibold"><Shapes className="size-5" /> Interview cram by topic</h3><p className="text-sm text-muted-foreground">Jump into a standalone module without following a path.</p></div><Link href="/modules" className="text-sm text-muted-foreground hover:text-foreground">Browse modules</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickModules.map((learningModule) => <Link key={learningModule.id} href={`/modules/${learningModule.slug}`} className="rounded-xl border p-4 transition-colors hover:bg-muted/40"><div className="font-medium">{learningModule.title}</div><div className="mt-1 text-xs text-muted-foreground">{learningModule.category.replaceAll("_", " ")} · {learningModule.estimatedHours}h</div></Link>)}</div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Recommended practice modes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Formats with the lowest solved coverage in the current bank.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {modeRecommendations.map((item) => (
            <Link
              key={item.type}
              href={`/problems?type=${item.type}`}
              className="rounded-xl border p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-3">
                <TypeBadge type={item.type} />
                <span className="text-xs text-muted-foreground">
                  {item.solved}/{item.total} solved
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {PROBLEM_TYPE_DESCRIPTIONS[item.type]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recommended next</h3>
            <p className="text-sm text-muted-foreground">Fresh problems chosen for quality and format spread.</p>
          </div>
          <Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground">
            Browse all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recommendations.map(({ problem, reason }) => (
            <Link key={problem.id} href={`/problems/${problem.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/30" size="sm">
                <CardHeader>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <TypeBadge type={problem.type} />
                    <span className="text-xs text-muted-foreground">{problem.estimatedMinutes} min</span>
                  </div>
                  <CardTitle>{problem.title}</CardTitle>
                  <CardDescription>{reason}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Quick prep tracks</h3>
        <p className="mt-1 text-sm text-muted-foreground">Jump into role-relevant bank views without rebuilding filters.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TRACKS.map((track) => {
            const label = track.role === "platform_engineer" ? "AI Usage" : ROLE_LABELS[track.role];
            const href = track.role === "platform_engineer" ? "/ai-usage" : `/problems?role=${track.role}`;
            return (
              <Link key={track.role} href={href} className="rounded-xl border p-4 hover:bg-muted/40">
                <div className="font-medium">{label}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{track.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
