import Link from "next/link";
import { ArrowRight, Bot, Bug, ChartNoAxesCombined, Code2, Gauge, Network, Sigma } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import type { ProblemType } from "@/lib/enums";
import { hydrateProblem } from "@/lib/problems";
import { learningPathId } from "@/lib/learning";

export const dynamic = "force-dynamic";

const ROUNDS: { title: string; type: ProblemType; description: string; focus: string; icon: typeof Code2 }[] = [
  { title: "DSA round", type: "dsa", description: "Practice adapting core structures and algorithms to production-shaped constraints.", focus: "Data structures · complexity · correctness", icon: Sigma },
  { title: "Read-code round", type: "read_code", description: "Trace unfamiliar code, explain runtime behavior, and identify subtle language traps.", focus: "Comprehension · semantics · communication", icon: Code2 },
  { title: "Debugging round", type: "debugging", description: "Move from symptoms to a defensible root cause and a fix that survives failure modes.", focus: "Diagnosis · evidence · remediation", icon: Bug },
  { title: "Optimization round", type: "optimization", description: "Profile bottlenecks, quantify tradeoffs, and improve systems without hand-waving.", focus: "Measurement · complexity · performance", icon: Gauge },
  { title: "System design round", type: "system_design", description: "Frame requirements, choose boundaries, and reason through scale and failure.", focus: "APIs · data · reliability", icon: Network },
  { title: "Quant-dev technical round", type: "quant_dev", description: "Review language internals, low-latency systems, networking, and market mechanics.", focus: "C++ · Python · market infrastructure", icon: ChartNoAxesCombined },
  { title: "AI usage drill", type: "ai_usage", description: "Use coding agents efficiently while retaining verification and engineering judgment.", focus: "Context · prompting · verification", icon: Bot },
];

export default async function PracticePage() {
  const [rawProblems, learningPaths] = await Promise.all([
    db.problem.findMany(),
    db.learningPath.findMany({ where: { isPublished: true }, orderBy: { order: "asc" } }),
  ]);
  const problems = rawProblems.map(hydrateProblem);
  const countByType = new Map<string, number>();
  for (const problem of problems) {
    countByType.set(problem.type, (countByType.get(problem.type) ?? 0) + 1);
  }
  const confidencePathId = learningPathId("dsa-confidence-builder");
  const confidenceProblems = problems.filter((problem) => problem.pathIds.includes(confidencePathId));
  const confidenceCounts = {
    warmup: confidenceProblems.filter((problem) => problem.confidenceLevel === "warmup").length,
    core: confidenceProblems.filter((problem) => problem.confidenceLevel === "core").length,
    challenge: confidenceProblems.filter((problem) => problem.confidenceLevel === "challenge").length,
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Practice modes</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Choose the skill, then do the rep.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Each mode maps to a common interview format. Pick one based on the signal you need to strengthen, not just the topic you enjoy.</p>
      </div>

      <section className="mt-7 rounded-2xl border bg-card p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge variant="secondary">Confidence Builder</Badge>
            <h3 className="mt-3 text-xl font-semibold">Warmup → core → challenge</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Begin with genuinely easy coding reps, then branch into the same patterns under
              backend, quant, and performance constraints. The progression is explicit so you
              are not dropped into the entire bank at once.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{confidenceCounts.warmup} warmups</Badge>
              <Badge variant="outline">{confidenceCounts.core} core</Badge>
              <Badge variant="outline">{confidenceCounts.challenge} challenges</Badge>
            </div>
          </div>
          <Link href="/paths/dsa-confidence-builder" className="inline-flex items-center gap-1 text-sm font-medium">
            Start confidence path <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-lg font-semibold">Practice by path</h3>
        <p className="mt-1 text-sm text-muted-foreground">Keep each practice session connected to a larger study sequence.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => {
            const count = problems.filter((problem) => problem.pathIds.includes(path.id)).length;
            return <Link key={path.id} href={`/problems?path=${encodeURIComponent(path.id)}`} className="rounded-xl border p-4 transition-colors hover:bg-muted/40"><div className="flex items-center justify-between gap-3"><span className="font-medium">{path.title}</span><Badge variant="outline">{count}</Badge></div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{path.description}</p></Link>;
          })}
        </div>
      </section>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROUNDS.map((round) => {
          const count = countByType.get(round.type) ?? 0;
          return (
            <Link key={round.type} href={`/problems?type=${round.type}`} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:bg-muted/30">
                <CardHeader>
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><round.icon className="size-4" /></div>
                  <CardTitle className="flex items-center justify-between gap-3">{round.title}<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardTitle>
                  <CardDescription>{round.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
                  <span className="text-xs text-muted-foreground">{round.focus}</span>
                  <Badge variant={count > 0 ? "secondary" : "outline"}>{count} problems</Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
