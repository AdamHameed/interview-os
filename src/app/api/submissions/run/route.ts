import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { runLocalTests, type RunnableTest, type RunnerLanguage } from "@/lib/local-runner";
import { runSqlPlanTests } from "@/lib/sql-plan-runner";
import type { SqlPlanSpec, TestCase } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(["python", "javascript", "typescript", "sql"]),
  code: z.string().min(1).max(500_000),
});

function isRunnable(test: TestCase): test is TestCase & RunnableTest {
  return (
    Array.isArray(test.args) &&
    Object.prototype.hasOwnProperty.call(test, "expectedValue")
  );
}

function isSqlPlan(test: TestCase): test is TestCase & { sqlPlan: SqlPlanSpec } {
  return Boolean(test.sqlPlan);
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const problem = await db.problem.findUnique({ where: { id: parsed.data.problemId } });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }
  if (problem.testHarnessType !== "function_call" && problem.testHarnessType !== "sql_plan") {
    return NextResponse.json({ error: "This problem has no runnable harness" }, { status: 400 });
  }

  const supportedLanguages = parseJsonArray<string>(problem.supportedLanguages);
  if (!supportedLanguages.includes(parsed.data.language)) {
    return NextResponse.json({ error: "Language is not supported for this problem" }, { status: 400 });
  }

  const allTests = parseJsonArray<TestCase>(problem.tests);

  let results;
  if (problem.testHarnessType === "sql_plan") {
    const sqlTests = allTests
      .filter(isSqlPlan)
      .map((test) => ({ name: test.name, hidden: test.hidden, ...test.sqlPlan }));
    if (sqlTests.length === 0) {
      return NextResponse.json({ error: "No SQL-plan tests are configured" }, { status: 400 });
    }
    results = await runSqlPlanTests({ candidateSql: parsed.data.code, tests: sqlTests });
  } else {
    if (parsed.data.language === "sql") {
      return NextResponse.json({ error: "SQL is only valid for SQL-plan problems" }, { status: 400 });
    }
    const language: RunnerLanguage = parsed.data.language;
    const tests = allTests.filter(isRunnable);
    if (tests.length === 0) {
      return NextResponse.json({ error: "No runnable tests are configured" }, { status: 400 });
    }
    results = await runLocalTests({
      language,
      code: parsed.data.code,
      functionName: problem.functionName ?? "solve",
      tests,
    });
  }
  const passed = results.every((result) => result.passed);
  const submission = await db.submission.create({
    data: {
      problemId: problem.id,
      answerText: parsed.data.code,
      language: parsed.data.language,
      status: passed ? "passed" : "failed",
      testResults: JSON.stringify(results),
    },
  });

  return NextResponse.json({
    submissionId: submission.id,
    status: submission.status,
    passed,
    results,
  });
}
