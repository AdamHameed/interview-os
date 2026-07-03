import type { CompanyStyle, Difficulty, ProblemType, Role } from "@/lib/enums";
import type { InterviewConfig } from "@/lib/schemas";

/** The minimal problem shape the selector needs (keeps it easy to unit test). */
export type SelectableProblem = {
  id: string;
  slug: string;
  title: string;
  type: ProblemType;
  difficulty: Difficulty;
  topics: string[];
  targetRoles: Role[];
  companyStyles: CompanyStyle[];
  estimatedMinutes: number;
};

export type SelectOptions = {
  problems: SelectableProblem[];
  config: InterviewConfig;
  /** Problems already attempted — deprioritized, not excluded. */
  attemptedIds?: Set<string>;
  /** Weak topics get a bonus (used by weak-topic review mode). */
  weakTopics?: string[];
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number;
};

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/** Deterministic PRNG (mulberry32) so interview selection is reproducible in tests. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scoreProblem(
  p: SelectableProblem,
  opts: SelectOptions,
  rng: () => number
): number {
  const { config, attemptedIds, weakTopics } = opts;
  let score = 0;

  if (config.difficulty !== "mixed") {
    const distance = Math.abs(
      DIFFICULTY_ORDER[p.difficulty] - DIFFICULTY_ORDER[config.difficulty as Difficulty]
    );
    score += distance === 0 ? 4 : distance === 1 ? 0.5 : -4;
  }

  const topicOverlap = p.topics.filter((t) => config.topics.includes(t)).length;
  score += Math.min(topicOverlap * 3, 6);

  if (p.targetRoles.includes(config.targetRole)) score += 2;
  if (config.companyStyle && p.companyStyles.includes(config.companyStyle)) score += 1.5;
  if (attemptedIds && !attemptedIds.has(p.id)) score += 1.5;

  if (weakTopics?.length) {
    const weakOverlap = p.topics.filter((t) => weakTopics.includes(t)).length;
    score += Math.min(weakOverlap * 2, 4);
  }

  score += rng() * 2; // jitter so repeated interviews vary
  return score;
}

/**
 * Pick an ordered set of problems for a mock interview.
 *
 * Strategy: hard-filter by format, score every candidate on difficulty fit,
 * topic/role/style overlap, freshness, and weak-topic relevance, then greedily
 * fill the time budget from the top. Always returns at least one problem if
 * any candidate exists.
 */
export function selectInterviewProblems(opts: SelectOptions): SelectableProblem[] {
  const { problems, config } = opts;
  const rng = opts.rng ?? Math.random;

  const candidates =
    config.format === "mixed"
      ? problems
      : problems.filter((p) => p.type === config.format);
  if (candidates.length === 0) return [];

  const ranked = candidates
    .map((p) => ({ p, score: scoreProblem(p, opts, rng) }))
    .sort((a, b) => b.score - a.score);

  const budget = config.durationMinutes;
  const selected: SelectableProblem[] = [];
  let used = 0;
  const usedTypes = new Map<string, number>();

  for (const { p } of ranked) {
    if (used + p.estimatedMinutes > budget + 5) continue; // small overflow allowance
    // In mixed interviews, avoid three problems of the same format.
    if (config.format === "mixed" && (usedTypes.get(p.type) ?? 0) >= 2) continue;
    selected.push(p);
    used += p.estimatedMinutes;
    usedTypes.set(p.type, (usedTypes.get(p.type) ?? 0) + 1);
    if (budget - used < 10) break; // not enough room for anything meaningful
  }

  if (selected.length === 0) {
    // Everything is longer than the slot — take the best single problem anyway.
    selected.push(ranked[0].p);
  }

  // Order easy→hard so the interview ramps up like a real one.
  return selected.sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
  );
}
