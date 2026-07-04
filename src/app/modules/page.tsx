import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Search, Shapes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/enums";
import { MODULE_CATEGORIES, MODULE_DIFFICULTIES, hydrateLearningModule } from "@/lib/learning";
import { parseJsonArray } from "@/lib/json";

export const dynamic = "force-dynamic";
type SearchParams = Record<string, string | string[] | undefined>;
const param = (params: SearchParams, key: string) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export default async function ModulesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = {
    q: param(params, "q").toLowerCase(),
    category: param(params, "category"),
    difficulty: param(params, "difficulty"),
    role: param(params, "role"),
    maxHours: Number(param(params, "maxHours")) || undefined,
    content: param(params, "content"),
  };
  const records = await db.learningModule.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: {
      lessons: true,
      paths: { include: { path: true } },
    },
  });
  const modules = records.filter((record) => {
    if (filters.q && !`${record.title} ${record.description} ${record.category}`.toLowerCase().includes(filters.q)) return false;
    if (filters.category && record.category !== filters.category) return false;
    if (filters.difficulty && record.difficulty !== filters.difficulty) return false;
    if (filters.maxHours && record.estimatedHours > filters.maxHours) return false;
    if (filters.content === "ready" && record.isPlaceholder) return false;
    if (filters.content === "scaffold" && !record.isPlaceholder) return false;
    if (filters.role && !record.paths.some(({ path }) => parseJsonArray<Role>(path.targetRoles).includes(filters.role as Role))) return false;
    return true;
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Knowledge base</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Jump directly to the interview topic you need.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Modules stand alone and can also appear in multiple guided paths. Browse Kubernetes, threading, C++, page tables, indexes, TCP, or another focused topic without enrolling in a track.</p>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="size-4" /> Find a module</CardTitle><CardDescription>Filter the knowledge base by interview need. Scaffolds identify content Claude can deepen later.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input name="q" defaultValue={param(params, "q")} placeholder="Search title or topic" className="h-9 rounded-lg border bg-background px-3 text-sm" />
            <select name="category" defaultValue={filters.category} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="">All categories</option>{MODULE_CATEGORIES.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}</select>
            <select name="difficulty" defaultValue={filters.difficulty} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="">All difficulties</option>{MODULE_DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</select>
            <select name="role" defaultValue={filters.role} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="">All target roles</option>{ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select>
            <select name="maxHours" defaultValue={filters.maxHours ?? ""} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="">Any estimated time</option><option value="3">3 hours or less</option><option value="5">5 hours or less</option></select>
            <select name="content" defaultValue={filters.content} className="h-9 rounded-lg border bg-background px-3 text-sm"><option value="">Ready and scaffolded</option><option value="ready">Has a real lesson</option><option value="scaffold">Placeholder scaffold</option></select>
            <div className="flex gap-2 md:col-span-2"><button className={buttonVariants()} type="submit">Apply filters</button><Link href="/modules" className={buttonVariants({ variant: "outline" })}>Clear</Link></div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{modules.length}</span> of {records.length} modules</p><Link href="/paths" className="text-sm text-muted-foreground hover:text-foreground">Prefer a guided path?</Link></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((record) => {
          const learningModule = hydrateLearningModule(record);
          const ready = record.lessons.filter((lesson) => !lesson.isPlaceholder).length;
          return <Link key={record.id} href={`/modules/${record.slug}`} className="group"><Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:bg-muted/30"><CardHeader><div className="mb-2 flex items-center justify-between gap-2"><Badge variant="secondary">{learningModule.category.replaceAll("_", " ")}</Badge><Badge variant="outline">{learningModule.difficulty}</Badge></div><CardTitle className="flex items-start justify-between gap-3">{record.title}<ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardTitle><CardDescription className="line-clamp-2">{record.description}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3"><div className="flex flex-wrap gap-1.5">{record.paths.slice(0, 3).map(({ path }) => <Badge key={path.id} variant="outline">{path.title}</Badge>)}</div><div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3" />{record.estimatedHours}h</span><span className="flex items-center gap-1"><BookOpen className="size-3" />{ready} ready</span><span className="flex items-center gap-1"><Shapes className="size-3" />{record.lessons.length} lessons</span></div></CardContent></Card></Link>;
        })}
      </div>
    </div>
  );
}
