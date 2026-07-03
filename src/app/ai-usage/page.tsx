import Link from "next/link";
import { ArrowRight, Blocks, Bot, CheckCheck, FileSearch, FlaskConical, Scale, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  { title: "Token-efficient prompting", icon: Bot, summary: "State the outcome, constraints, validation target, and stopping point before supplying context.", actions: ["Lead with the task and non-goals.", "Reference files by path instead of pasting the repository.", "Ask for a narrow diff and explicit validation commands."] },
  { title: "Select repo context", icon: FileSearch, summary: "Give the model the dependency path for the change—not every nearby file.", actions: ["Start with entrypoint, types, and the closest existing analogue.", "Include schema or contract files when behavior crosses a boundary.", "Let the agent search for call sites before adding more context."] },
  { title: "Review generated code", icon: CheckCheck, summary: "Treat output as an untrusted patch that must fit local conventions and invariants.", actions: ["Read the diff, not just the summary.", "Check error paths, concurrency, data migrations, and destructive operations.", "Reject duplicated abstractions and unexplained dependencies."] },
  { title: "Detect hallucinations", icon: ShieldQuestion, summary: "Require evidence for APIs, versions, and repository claims that may not exist.", actions: ["Search the installed package or official docs for named APIs.", "Verify imported symbols and configuration keys locally.", "Ask the model to distinguish observed facts from assumptions."] },
  { title: "Write tests before acceptance", icon: FlaskConical, summary: "Convert the intended behavior into executable checks before trusting a plausible implementation.", actions: ["Cover the reported failure and one boundary case.", "Prefer focused contract tests over snapshots.", "Run lint, types, tests, and the production build after the patch."] },
  { title: "Respect interview boundaries", icon: Scale, summary: "Use AI only within the explicit rules of the interview or take-home exercise.", actions: ["Ask whether tools are allowed before the session.", "Disclose assistance when the rules require it.", "Be able to explain and modify every submitted line without the tool."] },
];

export default function AiUsagePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <section className="overflow-hidden rounded-2xl border bg-card p-6 md:p-10">
        <Badge variant="secondary"><Blocks /> AI-assisted engineering</Badge>
        <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">Use AI to shorten feedback loops, not skip judgment.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">The useful skill is not producing the largest prompt. It is selecting enough context, defining a verifiable outcome, and reviewing the result like any other risky code change.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/problems?type=ai_usage" className={buttonVariants({ size: "lg" })}>Practice AI usage drills <ArrowRight /></Link>
          <Link href="/problems?role=platform_engineer" className={buttonVariants({ variant: "outline", size: "lg" })}>Platform track</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((section, index) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="mb-3 flex items-center justify-between"><div className="flex size-9 items-center justify-center rounded-lg border bg-muted"><section.icon className="size-4" /></div><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></div>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.summary}</CardDescription>
            </CardHeader>
            <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{section.actions.map((action) => <li key={action} className="flex gap-2"><span className="text-foreground">✓</span><span>{action}</span></li>)}</ul></CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed p-6 md:p-8">
        <h3 className="text-lg font-semibold">A compact repo-task prompt</h3>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-xs leading-relaxed">{`Goal: <one observable outcome>\nConstraints: <what must stay unchanged>\nInspect first: <entrypoint, types, closest analogue>\nValidation: <specific commands and behavior>\nStop after: <the narrow completed slice>`}</pre>
        <p className="mt-3 text-sm text-muted-foreground">This structure makes scope, evidence, and completion testable while leaving implementation details open to inspection.</p>
      </section>
    </div>
  );
}
