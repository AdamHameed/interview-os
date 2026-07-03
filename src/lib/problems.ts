import type { Attempt, Problem } from "@prisma/client";
import { parseJsonArray } from "@/lib/json";
import type { RubricItem, TestCase } from "@/lib/schemas";
import type {
  AttemptStatus,
  CompanyStyle,
  Difficulty,
  ProblemType,
  Role,
  SourceType,
} from "@/lib/enums";

/** A Problem with its JSON-string columns parsed into real arrays/objects. */
export type HydratedProblem = Omit<
  Problem,
  | "topics"
  | "targetRoles"
  | "companyStyles"
  | "hints"
  | "commonMistakes"
  | "followUpQuestions"
  | "rubric"
  | "sourceUrls"
  | "tests"
  | "supportedLanguages"
  | "type"
  | "difficulty"
  | "sourceType"
> & {
  type: ProblemType;
  difficulty: Difficulty;
  sourceType: SourceType;
  topics: string[];
  targetRoles: Role[];
  companyStyles: CompanyStyle[];
  hints: string[];
  commonMistakes: string[];
  followUpQuestions: string[];
  rubric: RubricItem[];
  sourceUrls: string[];
  tests: TestCase[] | null;
  supportedLanguages: ("python" | "javascript" | "typescript")[];
};

export function hydrateProblem(p: Problem): HydratedProblem {
  return {
    ...p,
    type: p.type as ProblemType,
    difficulty: p.difficulty as Difficulty,
    sourceType: p.sourceType as SourceType,
    topics: parseJsonArray<string>(p.topics),
    targetRoles: parseJsonArray<Role>(p.targetRoles),
    companyStyles: parseJsonArray<CompanyStyle>(p.companyStyles),
    hints: parseJsonArray<string>(p.hints),
    commonMistakes: parseJsonArray<string>(p.commonMistakes),
    followUpQuestions: parseJsonArray<string>(p.followUpQuestions),
    rubric: parseJsonArray<RubricItem>(p.rubric),
    sourceUrls: parseJsonArray<string>(p.sourceUrls),
    tests: p.tests ? parseJsonArray<TestCase>(p.tests) : null,
    supportedLanguages: parseJsonArray<"python" | "javascript" | "typescript">(
      p.supportedLanguages
    ),
  };
}

export type ProblemFilters = {
  q?: string;
  type?: string;
  topic?: string;
  difficulty?: string;
  role?: string;
  companyStyle?: string;
  status?: string; // derived from latest attempt; "not_started" = no attempt
  maxMinutes?: number;
  language?: string;
};

/** Latest attempt per problem (attempts assumed sorted desc by createdAt, or not — we reduce). */
export function latestAttemptByProblem(attempts: Attempt[]): Map<string, Attempt> {
  const map = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const existing = map.get(attempt.problemId);
    if (!existing || attempt.createdAt > existing.createdAt) {
      map.set(attempt.problemId, attempt);
    }
  }
  return map;
}

export function problemStatus(
  problemId: string,
  latest: Map<string, Attempt>
): AttemptStatus {
  return (latest.get(problemId)?.status as AttemptStatus) ?? "not_started";
}

export function filterProblems(
  problems: HydratedProblem[],
  filters: ProblemFilters,
  latest: Map<string, Attempt>
): HydratedProblem[] {
  const q = filters.q?.trim().toLowerCase();
  return problems.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.difficulty && p.difficulty !== filters.difficulty) return false;
    if (filters.topic && !p.topics.includes(filters.topic)) return false;
    if (filters.role && !p.targetRoles.includes(filters.role as Role)) return false;
    if (
      filters.companyStyle &&
      !p.companyStyles.includes(filters.companyStyle as CompanyStyle)
    )
      return false;
    if (filters.language && p.language !== filters.language) return false;
    if (filters.maxMinutes && p.estimatedMinutes > filters.maxMinutes) return false;
    if (filters.status && problemStatus(p.id, latest) !== filters.status) return false;
    if (q) {
      const haystack = `${p.title} ${p.slug} ${p.topics.join(" ")} ${p.prompt}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** All distinct topics across the bank, sorted by frequency then name. */
export function collectTopics(problems: Pick<HydratedProblem, "topics">[]): string[] {
  const counts = new Map<string, number>();
  for (const p of problems) {
    for (const t of p.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([topic]) => topic);
}
