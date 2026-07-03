import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/json";
import { submissionInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = submissionInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { submissionId, problemId, answerText, language, status, selfScore } = parsed.data;
  const problem = await db.problem.findUnique({
    where: { id: problemId },
    select: { id: true, testHarnessType: true, supportedLanguages: true },
  });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }
  if (problem.testHarnessType === "function_call") {
    const supported = parseJsonArray<string>(problem.supportedLanguages);
    if (!language || !supported.includes(language)) {
      return NextResponse.json(
        { error: "A supported language is required for this coding problem" },
        { status: 400 }
      );
    }
  }

  if (submissionId) {
    const existing = await db.submission.findUnique({ where: { id: submissionId } });
    if (!existing || existing.problemId !== problemId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    const submission = await db.submission.update({
      where: { id: submissionId },
      data: { answerText, language, status, selfScore },
    });
    return NextResponse.json({ submission });
  }

  const submission = await db.submission.create({
    data: { problemId, answerText, language, status, selfScore },
  });
  return NextResponse.json({ submission }, { status: 201 });
}
