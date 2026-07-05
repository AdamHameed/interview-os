import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Dumbbell, ExternalLink, Route } from "lucide-react";
import { ConfidenceBadge, DifficultyBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { type ConfidenceLevel } from "@/lib/enums";
import { hydrateLearningModule, hydrateLesson } from "@/lib/learning";
import { hydrateProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";
const LEVELS: ConfidenceLevel[] = ["warmup", "core", "challenge", "advanced"];

export default async function StandaloneModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [record, rawProblems] = await Promise.all([
    db.learningModule.findUnique({
      where: { slug },
      include: {
        lessons: { orderBy: { order: "asc" } },
        paths: { orderBy: { order: "asc" }, include: { path: true } },
      },
    }),
    db.problem.findMany(),
  ]);
  if (!record || !record.isPublished) notFound();
  const learningModule = hydrateLearningModule(record);
  const lessons = record.lessons.map(hydrateLesson);
  const linkedIds = new Set(lessons.flatMap((lesson) => lesson.linkedProblemIds));
  const problems = rawProblems.map(hydrateProblem).filter((problem) => problem.moduleIds.includes(record.id) || linkedIds.has(problem.id));
  const prerequisites = learningModule.prerequisites.length ? await db.learningModule.findMany({ where: { slug: { in: learningModule.prerequisites }, isPublished: true } }) : [];
  const related = await db.learningModule.findMany({ where: { category: record.category, isPublished: true, id: { not: record.id } }, orderBy: { title: "asc" }, take: 4 });
  const readyCount = lessons.filter((lesson) => !lesson.isPlaceholder).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <Link href="/modules" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All modules</Link>
      <section className="rounded-2xl border bg-card p-6 md:p-8"><div className="flex flex-wrap gap-2"><Badge variant="secondary">{learningModule.category.replaceAll("_", " ")}</Badge><Badge variant="outline">{learningModule.difficulty}</Badge>{record.isPlaceholder ? <Badge variant="outline">Scaffold</Badge> : <Badge variant="secondary">Instructional available</Badge>}</div><h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{record.title}</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{record.description}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{record.estimatedHours} estimated hours</span><span>{lessons.length} lessons · {readyCount} ready</span><span>{problems.length} linked problems</span></div></section>

      <section className="rounded-2xl border bg-card p-6 md:p-8"><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Module motivation</p><div className="mt-4 max-w-4xl"><Markdown className="prose-base">{learningModule.motivationMarkdown}</Markdown></div>{lessons[0] && <Link href={`/lessons/${lessons[0].slug}`} className={buttonVariants({ className: "mt-6" })}>Start Lesson 1 <ArrowRight /></Link>}</section>

      <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Prerequisites</CardTitle></CardHeader><CardContent>{prerequisites.length ? <div className="flex flex-wrap gap-2">{prerequisites.map((item) => <Link key={item.id} href={`/modules/${item.slug}`}><Badge variant="outline">{item.title}</Badge></Link>)}</div> : <p className="text-sm text-muted-foreground">No module prerequisite. Jump in directly.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Outcomes</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{learningModule.outcomes.map((outcome) => <li key={outcome} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{outcome}</li>)}</ul></CardContent></Card></section>

      <section><h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="size-4" /> Lessons</h3><div className="mt-3 space-y-3">{lessons.map((lesson, index) => <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="group block"><Card className="transition-colors group-hover:bg-muted/30"><CardContent className="flex items-start gap-4 py-1"><div className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs">{index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><CardTitle>{lesson.title}</CardTitle>{lesson.isPlaceholder ? <Badge variant="outline">Scaffold</Badge> : <Badge variant="secondary">Ready</Badge>}</div><CardDescription className="mt-1">{lesson.lessonType.replaceAll("_", " ")} · {lesson.estimatedMinutes} min · {lesson.difficulty}</CardDescription></div><ArrowRight className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardContent></Card></Link>)}</div></section>

      <section><h3 className="flex items-center gap-2 text-lg font-semibold"><Dumbbell className="size-4" /> Practice progression</h3><div className="mt-3 grid gap-4 lg:grid-cols-2">{LEVELS.map((level) => { const levelProblems = problems.filter((problem) => problem.confidenceLevel === level); return <Card key={level} size="sm"><CardHeader><ConfidenceBadge level={level} /><CardDescription>{levelProblems.length} linked problems</CardDescription></CardHeader><CardContent className="space-y-2">{levelProblems.length ? levelProblems.map((problem) => <Link key={problem.id} href={`/problems/${problem.slug}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40"><span className="font-medium">{problem.title}</span><span className="flex gap-1"><TypeBadge type={problem.type} /><DifficultyBadge difficulty={problem.difficulty} /></span></Link>) : <p className="text-sm text-muted-foreground">Scaffold slot ready for a future interview problem.</p>}</CardContent></Card>; })}</div></section>

      <section className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Interview cram checklist</CardTitle><CardDescription>Use this module independently when the interview is close.</CardDescription></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{["Explain the core model without notes", "Work through one concrete example", "Name two common failure modes or mistakes", "Complete the hardest available linked problem", "Summarize tradeoffs aloud in five minutes"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Route className="size-4" /> Included in paths</CardTitle></CardHeader><CardContent className="space-y-2">{record.paths.length ? record.paths.map(({ path, label }) => <Link key={path.id} href={`/paths/${path.slug}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40"><span>{path.title}</span><Badge variant="outline">{label ?? "optional"}</Badge></Link>) : <p className="text-sm text-muted-foreground">Standalone only. No guided path is required.</p>}</CardContent></Card></section>

      <section><h3 className="text-lg font-semibold">Related modules</h3><div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{related.map((item) => <Link key={item.id} href={`/modules/${item.slug}`} className="rounded-xl border p-4 hover:bg-muted/40"><div className="font-medium">{item.title}</div><div className="mt-1 text-xs text-muted-foreground">{item.difficulty} · {item.estimatedHours}h</div></Link>)}</div></section>
      {learningModule.sourceUrls.length > 0 && <Card size="sm"><CardHeader><CardTitle>Starting sources</CardTitle></CardHeader><CardContent className="space-y-2">{learningModule.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3" />{url}</a>)}</CardContent></Card>}
    </div>
  );
}
