import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ATTEMPT_STATUS_LABELS,
  DIFFICULTY_LABELS,
  PROBLEM_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  type AttemptStatus,
  type Difficulty,
  type ProblemType,
  type SourceType,
} from "@/lib/enums";

const TYPE_COLORS: Record<ProblemType, string> = {
  dsa: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  read_code: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  write_code: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  debugging: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  optimization: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  system_design: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  low_level_design: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  quant_dev: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  databases: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  os_networking_concurrency: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
  ai_usage: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
  behavioral: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function TypeBadge({ type, className }: { type: ProblemType; className?: string }) {
  return (
    <Badge variant="outline" className={cn(TYPE_COLORS[type], className)}>
      {PROBLEM_TYPE_LABELS[type]}
    </Badge>
  );
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(DIFFICULTY_COLORS[difficulty], className)}>
      {DIFFICULTY_LABELS[difficulty]}
    </Badge>
  );
}

const STATUS_COLORS: Record<AttemptStatus, string> = {
  not_started: "bg-muted text-muted-foreground border-transparent",
  in_progress: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  solved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  needs_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  skipped: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AttemptStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_COLORS[status], className)}>
      {ATTEMPT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function SourceBadge({ sourceType }: { sourceType: SourceType }) {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {SOURCE_TYPE_LABELS[sourceType]}
    </Badge>
  );
}

/** 1–5 quality dots, filled according to score. */
export function QualityDots({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Quality ${score}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "size-1.5 rounded-full",
            i <= score ? "bg-primary" : "bg-muted-foreground/25"
          )}
        />
      ))}
    </span>
  );
}
