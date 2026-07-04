import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Dumbbell } from "lucide-react";
import { ConfidenceBadge, DifficultyBadge, TypeBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { hydrateLearningModule, hydrateLesson } from "@/lib/learning";
import { hydrateProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

const PRACTICE_ORDER = { warmup: 0, core: 1, challenge: 2, advanced: 3 } as const;

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string; moduleSlug: string }>;
}) {
  const { slug, moduleSlug } = await params;
  const [record, rawProblems] = await Promise.all([
    db.learningModule.findFirst({
      where: { slug: moduleSlug, path: { slug, isPublished: true } },
      include: {
        path: true,
        lessons: { orderBy: { order: "asc" } },
      },
    }),
    db.problem.findMany(),
  ]);
  if (!record) notFound();

  const learningModule = hydrateLearningModule(record);
  const lessons = record.lessons.map(hydrateLesson);
  const linkedIds = new Set(lessons.flatMap((lesson) => lesson.linkedProblemIds));
  const problems = rawProblems
    .map(hydrateProblem)
    .filter((problem) => problem.moduleIds.includes(learningModule.id) || linkedIds.has(problem.id))
    .sort(
      (a, b) =>
        (PRACTICE_ORDER[a.confidenceLevel ?? "advanced"] ?? 4) -
          (PRACTICE_ORDER[b.confidenceLevel ?? "advanced"] ?? 4) ||
        a.title.localeCompare(b.title)
    );
  const firstLesson = lessons[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <Link href={`/paths/${record.path.slug}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {record.path.title}
      </Link>

      <section className="rounded-2xl border bg-card p-6 md:p-8">
        <Badge variant="outline">Module {learningModule.order}</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">{learningModule.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{learningModule.description}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{learningModule.estimatedHours} hours</span><span>{lessons.length} lessons</span><span>{problems.length} linked problems</span></div>
        {firstLesson && <Link href={`/lessons/${firstLesson.slug}`} className={buttonVariants({ className: "mt-6" })}>Start module <ArrowRight /></Link>}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Prerequisites</CardTitle></CardHeader>
          <CardContent>{learningModule.prerequisites.length > 0 ? <ul className="space-y-2 text-sm text-muted-foreground">{learningModule.prerequisites.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="text-sm text-muted-foreground">No prior module required. Start here.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Outcomes</CardTitle></CardHeader>
          <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{learningModule.outcomes.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></CardContent>
        </Card>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="size-4" /> Lessons</h3>
        <div className="mt-3 space-y-3">
          {lessons.map((lesson, index) => <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="group block"><Card className="transition-colors group-hover:bg-muted/30"><CardContent className="flex items-start gap-4 py-1"><div className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs">{index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><CardTitle>{lesson.title}</CardTitle>{lesson.isPlaceholder ? <Badge variant="outline">Scaffold</Badge> : <Badge variant="secondary">Ready</Badge>}</div><CardDescription className="mt-1">{lesson.lessonType.replaceAll("_", " ")} · {lesson.estimatedMinutes} min · {lesson.difficulty}</CardDescription></div><ArrowRight className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardContent></Card></Link>)}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Dumbbell className="size-4" /> Suggested practice order</h3>
        <div className="mt-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Read lesson → do warmup → do core problem → do challenge problem → self-review against the rubric.</div>
        {problems.length > 0 ? <div className="mt-3 grid gap-3 md:grid-cols-2">{problems.map((problem) => <Link key={problem.id} href={`/problems/${problem.slug}`} className="group"><Card className="h-full transition-colors group-hover:bg-muted/30" size="sm"><CardHeader><div className="flex flex-wrap gap-2"><TypeBadge type={problem.type} /><DifficultyBadge difficulty={problem.difficulty} />{problem.confidenceLevel && <ConfidenceBadge level={problem.confidenceLevel} />}</div><CardTitle className="mt-2">{problem.title}</CardTitle><CardDescription>{problem.estimatedMinutes} minutes</CardDescription></CardHeader></Card></Link>)}</div> : <div className="mt-3 rounded-xl border p-4 text-sm text-muted-foreground">Problem links are intentionally empty in this scaffold. This is a clear content task for the next expansion pass.</div>}
      </section>
    </div>
  );
}
