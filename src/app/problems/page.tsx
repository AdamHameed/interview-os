import Link from "next/link";
import { ChevronDown, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { ConfidenceBadge, DifficultyBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import {
  ATTEMPT_STATUS_LABELS,
  ATTEMPT_STATUSES,
  CONFIDENCE_LEVELS,
  CONFIDENCE_LEVEL_LABELS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  PROBLEM_TYPES,
  PROBLEM_TYPE_LABELS,
  ROLES,
  ROLE_LABELS,
} from "@/lib/enums";
import { collectTopics, filterProblems, hydrateProblem, latestAttemptByProblem, problemStatus } from "@/lib/problems";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function param(params: SearchParams, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [rawProblems, attempts, learningPaths, learningModules] = await Promise.all([
    db.problem.findMany({ orderBy: [{ qualityScore: "desc" }, { title: "asc" }] }),
    db.attempt.findMany(),
    db.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
    }),
    db.learningModule.findMany({ where: { isPublished: true }, orderBy: { title: "asc" } }),
  ]);
  const problems = rawProblems.map(hydrateProblem);
  const latest = latestAttemptByProblem(attempts);
  const filters = {
    q: param(params, "q"),
    type: param(params, "type"),
    topic: param(params, "topic"),
    difficulty: param(params, "difficulty"),
    role: param(params, "role"),
    status: param(params, "status"),
    pathId: param(params, "path"),
    moduleId: param(params, "module"),
    confidenceLevel: param(params, "confidence"),
    maxMinutes: Number(param(params, "maxMinutes")) || undefined,
  };
  const visible = filterProblems(problems, filters, latest);
  const topics = collectTopics(problems);
  const hasAdvancedFilters = Boolean(
    filters.topic || filters.role || filters.status || filters.pathId ||
    filters.moduleId || filters.confidenceLevel || filters.maxMinutes
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Problem bank</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Find the right next rep.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Search realistic interview scenarios, then narrow by format, level, role, topic, or status.
        </p>
      </div>

      <form className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Search title, topic, or prompt"
                className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <select name="type" defaultValue={filters.type} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All formats</option>
              {PROBLEM_TYPES.map((type) => <option key={type} value={type}>{PROBLEM_TYPE_LABELS[type]}</option>)}
            </select>
            <select name="difficulty" defaultValue={filters.difficulty} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All difficulties</option>
              {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>)}
            </select>
            <button className={buttonVariants()} type="submit">Search</button>
        </div>

        <details className="group mt-3 border-t pt-3" open={hasAdvancedFilters}>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="size-4" /> More filters
            {hasAdvancedFilters && <Badge variant="secondary">Active</Badge>}
            <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select name="role" defaultValue={filters.role} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All target roles</option>
              {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </select>
            <select name="topic" defaultValue={filters.topic} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All topics</option>
              {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
            <select name="status" defaultValue={filters.status} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All statuses</option>
              {ATTEMPT_STATUSES.map((status) => <option key={status} value={status}>{ATTEMPT_STATUS_LABELS[status]}</option>)}
            </select>
            <select name="maxMinutes" defaultValue={filters.maxMinutes ?? ""} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">Any duration</option>
              <option value="20">20 minutes or less</option>
              <option value="30">30 minutes or less</option>
              <option value="45">45 minutes or less</option>
              <option value="60">60 minutes or less</option>
            </select>
            <select name="path" defaultValue={filters.pathId} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All learning paths</option>
              {learningPaths.map((path) => <option key={path.id} value={path.id}>{path.title}</option>)}
            </select>
            <select name="module" defaultValue={filters.moduleId} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All modules</option>
              {learningModules.map((learningModule) => <option key={learningModule.id} value={learningModule.id}>{learningModule.title}</option>)}
            </select>
            <select name="confidence" defaultValue={filters.confidenceLevel} className="h-9 rounded-lg border bg-background px-3 text-sm">
              <option value="">All confidence levels</option>
              {CONFIDENCE_LEVELS.map((level) => <option key={level} value={level}>{CONFIDENCE_LEVEL_LABELS[level]}</option>)}
            </select>
            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <button className={buttonVariants({ variant: "secondary" })} type="submit">Apply all filters</button>
              <Link href="/problems" className={buttonVariants({ variant: "outline" })}>Clear</Link>
            </div>
          </div>
        </details>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{visible.length}</span> of {problems.length} problems</p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h3 className="font-medium">No problems match these filters.</h3>
          <p className="mt-1 text-sm text-muted-foreground">Clear one or two constraints and try again.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((problem) => {
            const status = problemStatus(problem.id, latest);
            return (
              <Link key={problem.id} href={`/problems/${problem.slug}`} className="group">
                <Card size="sm" className="transition-colors group-hover:bg-muted/30">
                  <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={problem.type} />
                        <DifficultyBadge difficulty={problem.difficulty} />
                        {problem.confidenceLevel && <ConfidenceBadge level={problem.confidenceLevel} />}
                      </div>
                      <CardTitle className="mt-2 text-base group-hover:underline group-hover:underline-offset-4">{problem.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-1">{problem.context ?? problem.prompt}</CardDescription>
                      <p className="mt-2 truncate text-xs text-muted-foreground">{problem.topics.slice(0, 3).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground md:flex-col md:items-end">
                      <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{problem.estimatedMinutes} min</span>
                      {status !== "not_started" && <StatusBadge status={status} />}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
