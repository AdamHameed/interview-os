import type { Attempt, Submission } from "@prisma/client";
import { latestAttemptByProblem } from "@/lib/problems";

export function completedProblemIds(
  attempts: Attempt[],
  submissions: Pick<Submission, "problemId" | "status">[]
): Set<string> {
  const completed = new Set<string>();
  for (const [problemId, attempt] of latestAttemptByProblem(attempts)) {
    if (attempt.status === "solved") completed.add(problemId);
  }
  for (const submission of submissions) {
    if (["passed", "reviewed"].includes(submission.status)) {
      completed.add(submission.problemId);
    }
  }
  return completed;
}

export function progressPercent(problemIds: string[], completed: Set<string>): number {
  if (problemIds.length === 0) return 0;
  const solved = problemIds.filter((id) => completed.has(id)).length;
  return Math.round((solved / problemIds.length) * 100);
}
