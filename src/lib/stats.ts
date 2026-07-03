import type { Attempt } from "@prisma/client";
import { PROBLEM_TYPES, type ProblemType, type Role } from "@/lib/enums";
import { latestAttemptByProblem, type HydratedProblem } from "@/lib/problems";

/**
 * Pure stat/scoring functions powering the dashboard and review pages.
 * All time-dependent functions accept `now` for testability.
 */

export type FormatProgress = {
  type: ProblemType;
  total: number;
  attempted: number;
  solved: number;
};

export function formatProgress(
  problems: Pick<HydratedProblem, "id" | "type">[],
  attempts: Attempt[]
): FormatProgress[] {
  const latest = latestAttemptByProblem(attempts);
  const byType = new Map<ProblemType, FormatProgress>(
    PROBLEM_TYPES.map((t) => [t, { type: t, total: 0, attempted: 0, solved: 0 }])
  );
  for (const p of problems) {
    const bucket = byType.get(p.type as ProblemType);
    if (!bucket) continue;
    bucket.total += 1;
    const attempt = latest.get(p.id);
    if (attempt && attempt.status !== "not_started") bucket.attempted += 1;
    if (attempt?.status === "solved") bucket.solved += 1;
  }
  return [...byType.values()];
}

export type TopicStrength = {
  topic: string;
  attempts: number;
  avgScore: number; // 1..5, needs_review counts as 2 when unscored
};

export function topicStrengths(
  problems: Pick<HydratedProblem, "id" | "topics">[],
  attempts: Attempt[]
): TopicStrength[] {
  const topicsByProblem = new Map(problems.map((p) => [p.id, p.topics]));
  const agg = new Map<string, { total: number; count: number }>();
  for (const attempt of attempts) {
    const topics = topicsByProblem.get(attempt.problemId);
    if (!topics) continue;
    const score =
      attempt.selfScore ?? (attempt.status === "needs_review" ? 2 : attempt.status === "solved" ? 4 : 3);
    for (const topic of topics) {
      const bucket = agg.get(topic) ?? { total: 0, count: 0 };
      bucket.total += score;
      bucket.count += 1;
      agg.set(topic, bucket);
    }
  }
  return [...agg.entries()]
    .map(([topic, { total, count }]) => ({
      topic,
      attempts: count,
      avgScore: Math.round((total / count) * 10) / 10,
    }))
    .sort((a, b) => a.avgScore - b.avgScore || b.attempts - a.attempts);
}

/** Topics with a below-par average score (< 3.5), weakest first. */
export function weakTopics(
  problems: Pick<HydratedProblem, "id" | "topics">[],
  attempts: Attempt[],
  limit = 8
): TopicStrength[] {
  return topicStrengths(problems, attempts)
    .filter((t) => t.avgScore < 3.5)
    .slice(0, limit);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Consecutive days (ending today or yesterday) with at least one attempt.
 * A streak survives until a full calendar day is missed.
 */
export function computeStreak(attemptDates: Date[], now: Date = new Date()): number {
  const days = new Set(attemptDates.map(dayKey));
  if (days.size === 0) return 0;
  const cursor = new Date(now);
  // Streak can start today or yesterday (today's practice may not have happened yet).
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * How much each interview format matters per role, used for readiness scores.
 * Values are relative weights; they are normalized before use.
 */
export const ROLE_FORMAT_WEIGHTS: Record<Role, Partial<Record<ProblemType, number>>> = {
  backend_swe: {
    dsa: 3, write_code: 3, debugging: 3, system_design: 3, databases: 3,
    optimization: 2, read_code: 2, low_level_design: 2, os_networking_concurrency: 2,
    ai_usage: 1, behavioral: 1,
  },
  fullstack_swe: {
    dsa: 3, write_code: 3, read_code: 3, debugging: 3, system_design: 2,
    databases: 2, low_level_design: 2, optimization: 2, ai_usage: 1, behavioral: 1,
  },
  infrastructure_swe: {
    system_design: 3, os_networking_concurrency: 3, debugging: 3, optimization: 3,
    dsa: 2, databases: 2, write_code: 2, read_code: 1, ai_usage: 1, behavioral: 1,
  },
  quant_developer: {
    quant_dev: 4, dsa: 3, os_networking_concurrency: 3, optimization: 3,
    write_code: 2, debugging: 2, low_level_design: 2, read_code: 2,
    databases: 1, behavioral: 1,
  },
  hft_swe: {
    quant_dev: 4, os_networking_concurrency: 4, optimization: 4, dsa: 3,
    low_level_design: 2, debugging: 2, write_code: 2, read_code: 1, behavioral: 1,
  },
  platform_engineer: {
    system_design: 3, debugging: 3, os_networking_concurrency: 3, optimization: 2,
    databases: 2, write_code: 2, dsa: 2, ai_usage: 2, read_code: 1, behavioral: 1,
  },
  distributed_systems_engineer: {
    system_design: 4, os_networking_concurrency: 3, databases: 3, optimization: 2,
    dsa: 2, debugging: 2, write_code: 2, read_code: 1, behavioral: 1,
  },
  new_grad_swe: {
    dsa: 4, write_code: 3, read_code: 2, debugging: 2, low_level_design: 2,
    databases: 1, os_networking_concurrency: 1, system_design: 1, behavioral: 2, ai_usage: 1,
  },
  mid_level_swe: {
    dsa: 3, system_design: 3, debugging: 3, write_code: 2, databases: 2,
    low_level_design: 2, optimization: 2, read_code: 1, behavioral: 2, ai_usage: 1,
  },
};

export type FormatReadiness = {
  type: ProblemType;
  weight: number; // normalized 0..1
  coverage: number; // solved / relevant total, 0..1
  quality: number; // avg self score / 5 on attempted, 0..1 (0.6 default if unscored)
  score: number; // 0..100
};

export type Readiness = {
  overall: number; // 0..100
  formats: FormatReadiness[];
};

/**
 * Role readiness = weighted blend of per-format scores.
 * Per-format score = 100 * (0.6 * coverage + 0.4 * quality).
 * Coverage saturates at 6 solved problems per format so a deep bank
 * doesn't make readiness unreachable.
 */
export function readinessForRole(
  role: Role,
  problems: Pick<HydratedProblem, "id" | "type" | "targetRoles">[],
  attempts: Attempt[]
): Readiness {
  const weights = ROLE_FORMAT_WEIGHTS[role];
  const latest = latestAttemptByProblem(attempts);
  const totalWeight = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0);

  const formats: FormatReadiness[] = Object.entries(weights).map(([type, rawWeight]) => {
    const t = type as ProblemType;
    const relevant = problems.filter(
      (p) => p.type === t && (p.targetRoles as Role[]).includes(role)
    );
    const solved = relevant.filter((p) => latest.get(p.id)?.status === "solved");
    const scored = relevant
      .map((p) => latest.get(p.id))
      .filter((a): a is Attempt => !!a && a.selfScore != null);

    const coverageDenominator = Math.min(relevant.length, 6) || 1;
    const coverage = Math.min(solved.length / coverageDenominator, 1);
    const quality =
      scored.length > 0
        ? scored.reduce((sum, a) => sum + (a.selfScore ?? 3), 0) / scored.length / 5
        : solved.length > 0
          ? 0.6
          : 0;
    const score = Math.round(100 * (0.6 * coverage + 0.4 * quality));
    return { type: t, weight: (rawWeight ?? 0) / totalWeight, coverage, quality, score };
  });

  const overall = Math.round(formats.reduce((sum, f) => sum + f.score * f.weight, 0));
  return { overall, formats: formats.sort((a, b) => b.weight - a.weight) };
}

/**
 * Problems worth reviewing again: latest attempt flagged needs_review, or
 * solved with a low self-score more than `staleDays` ago.
 */
export function reviewQueue(
  problems: HydratedProblem[],
  attempts: Attempt[],
  now: Date = new Date(),
  staleDays = 7
): { problem: HydratedProblem; reason: string; attempt: Attempt }[] {
  const latest = latestAttemptByProblem(attempts);
  const staleCutoff = now.getTime() - staleDays * 24 * 60 * 60 * 1000;
  const out: { problem: HydratedProblem; reason: string; attempt: Attempt }[] = [];
  for (const p of problems) {
    const attempt = latest.get(p.id);
    if (!attempt) continue;
    if (attempt.status === "needs_review") {
      out.push({ problem: p, reason: "Marked for review", attempt });
    } else if (
      attempt.status === "solved" &&
      (attempt.selfScore ?? 5) <= 3 &&
      attempt.createdAt.getTime() < staleCutoff
    ) {
      out.push({ problem: p, reason: "Solved shakily — worth a rep", attempt });
    }
  }
  return out.sort((a, b) => a.attempt.createdAt.getTime() - b.attempt.createdAt.getTime());
}

/**
 * Recommend unattempted problems, preferring the user's weak topics, then
 * spreading across formats. Falls back to a starter mix when no history exists.
 */
export function recommendNext(
  problems: HydratedProblem[],
  attempts: Attempt[],
  limit = 4
): { problem: HydratedProblem; reason: string }[] {
  const latest = latestAttemptByProblem(attempts);
  const fresh = problems.filter((p) => !latest.has(p.id));
  const weak = weakTopics(problems, attempts);
  const weakSet = new Set(weak.map((w) => w.topic));

  const scored = fresh
    .map((p) => {
      const weakHits = p.topics.filter((t) => weakSet.has(t));
      return { problem: p, weakHits };
    })
    .sort((a, b) => b.weakHits.length - a.weakHits.length || (b.problem.qualityScore - a.problem.qualityScore));

  const picked: { problem: HydratedProblem; reason: string }[] = [];
  const usedTypes = new Set<string>();
  for (const { problem, weakHits } of scored) {
    if (picked.length >= limit) break;
    // Spread across formats unless it targets a weak topic.
    if (weakHits.length === 0 && usedTypes.has(problem.type)) continue;
    usedTypes.add(problem.type);
    picked.push({
      problem,
      reason:
        weakHits.length > 0
          ? `Targets weak topic: ${weakHits[0]}`
          : attempts.length === 0
            ? "Good starting point"
            : "Broadens format coverage",
    });
  }
  return picked;
}
