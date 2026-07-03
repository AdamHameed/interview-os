import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { runLocalTests, type RunnableTest } from "@/lib/local-runner";
import type { TestCase } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(["python", "javascript", "typescript"]),
  code: z.string().min(1).max(500_000),
});

function isRunnable(test: TestCase): test is TestCase & RunnableTest {
  return (
    Array.isArray(test.args) &&
    Object.prototype.hasOwnProperty.call(test, "expectedValue")
  );
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
  if (problem.testHarnessType !== "function_call") {
    return NextResponse.json({ error: "This problem has no function-call harness" }, { status: 400 });
  }

  const supportedLanguages = parseJsonArray<string>(problem.supportedLanguages);
  if (!supportedLanguages.includes(parsed.data.language)) {
    return NextResponse.json({ error: "Language is not supported for this problem" }, { status: 400 });
  }

  const tests = parseJsonArray<TestCase>(problem.tests).filter(isRunnable);
  if (tests.length === 0) {
    return NextResponse.json({ error: "No runnable tests are configured" }, { status: 400 });
  }

  const results = await runLocalTests({
    language: parsed.data.language,
    code: parsed.data.code,
    functionName: problem.functionName ?? "solve",
    tests,
  });
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
