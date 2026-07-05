import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, ExternalLink } from "lucide-react";
import { ConfidenceBadge, DifficultyBadge, TypeBadge } from "@/components/badges";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { hydrateLearningModule, hydrateLesson } from "@/lib/learning";
import { hydrateProblem } from "@/lib/problems";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await db.lesson.findUnique({
    where: { slug },
    include: {
      module: {
        include: {
          paths: { include: { path: true }, orderBy: { order: "asc" } },
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!record || !record.module.isPublished) notFound();

  const lesson = hydrateLesson(record);
  const learningModule = hydrateLearningModule(record.module);
  const siblings = record.module.lessons;
  const index = siblings.findIndex((item) => item.id === lesson.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;
  const linkedProblems = lesson.linkedProblemIds.length > 0
    ? (await db.problem.findMany({ where: { id: { in: lesson.linkedProblemIds } } })).map(hydrateProblem)
    : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href={`/modules/${record.module.slug}`} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{learningModule.title}</Link>

      <section className="rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{lesson.lessonType.replaceAll("_", " ")}</Badge><Badge variant="outline">{lesson.difficulty}</Badge>{lesson.isPlaceholder && <Badge variant="outline">Content scaffold</Badge>}</div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{lesson.title}</h2>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{lesson.estimatedMinutes} minutes</span><span>Lesson {lesson.order} of {siblings.length}</span></div>
      </section>

      {lesson.isPlaceholder && <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">This lesson is intentionally scaffolded.</strong> The path position, outcomes, and future content brief exist, but Claude should replace this brief with a reviewed instructional before treating it as complete.</div>}

      {lesson.order === 1 && <Card><CardHeader><CardTitle>Module Motivation</CardTitle><CardDescription>Why this topic exists before the technical details begin.</CardDescription></CardHeader><CardContent><Markdown>{learningModule.motivationMarkdown}</Markdown></CardContent></Card>}

      <Card><CardContent className="pt-2"><Markdown>{lesson.contentMarkdown}</Markdown></CardContent></Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Key takeaways</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{lesson.keyTakeaways.map((item) => <li key={item} className="flex gap-2"><BookOpenCheck className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></CardContent></Card>
        <Card><CardHeader><CardTitle>Examples and checkpoints</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-muted-foreground">{lesson.examples.map((item) => <li key={item}>• {item}</li>)}</ul></CardContent></Card>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Practice now</h3><p className="text-sm text-muted-foreground">Move from explanation into a confidence-graded problem.</p></div>{linkedProblems[0] && <Link href={`/problems/${linkedProblems[0].slug}`} className={buttonVariants()}>Start practice <ArrowRight /></Link>}</div>
        {linkedProblems.length > 0 ? <div className="mt-3 grid gap-3 md:grid-cols-2">{linkedProblems.map((problem) => <Link key={problem.id} href={`/problems/${problem.slug}`}><Card className="h-full hover:bg-muted/30" size="sm"><CardHeader><div className="flex flex-wrap gap-2"><TypeBadge type={problem.type} /><DifficultyBadge difficulty={problem.difficulty} />{problem.confidenceLevel && <ConfidenceBadge level={problem.confidenceLevel} />}</div><CardTitle className="mt-2">{problem.title}</CardTitle><CardDescription>{problem.estimatedMinutes} minutes</CardDescription></CardHeader></Card></Link>)}</div> : <div className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No linked problems yet. This placeholder identifies a concrete content-linking task for the next pass.</div>}
      </section>

      {lesson.sourceUrls.length > 0 && <Card size="sm"><CardHeader><CardTitle>Public sources</CardTitle></CardHeader><CardContent className="space-y-2">{lesson.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3" />{url}</a>)}</CardContent></Card>}

      <nav className="grid gap-3 border-t pt-5 sm:grid-cols-2">{previous ? <Link href={`/lessons/${previous.slug}`} className="rounded-xl border p-4 hover:bg-muted/40"><div className="text-xs text-muted-foreground">Previous lesson</div><div className="mt-1 font-medium">← {previous.title}</div></Link> : <div />}{next ? <Link href={`/lessons/${next.slug}`} className="rounded-xl border p-4 text-right hover:bg-muted/40"><div className="text-xs text-muted-foreground">Next lesson</div><div className="mt-1 font-medium">{next.title} →</div></Link> : <Link href={`/modules/${record.module.slug}`} className="rounded-xl border p-4 text-right hover:bg-muted/40"><div className="text-xs text-muted-foreground">Module complete</div><div className="mt-1 font-medium">Return to module →</div></Link>}</nav>
    </div>
  );
}
