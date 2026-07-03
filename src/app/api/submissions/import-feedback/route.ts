import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const requestSchema = z.object({
  submissionId: z.string().regex(/^[A-Za-z0-9_-]+$/),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
  }

  const submission = await db.submission.findUnique({ where: { id: parsed.data.submissionId } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const relativePath = `.codex-reviews/submission-${submission.id}-feedback.md`;
  try {
    const feedback = await readFile(path.join(process.cwd(), relativePath), "utf8");
    const updated = await db.submission.update({
      where: { id: submission.id },
      data: { reviewFeedback: feedback, status: "reviewed" },
    });
    return NextResponse.json({ feedback: updated.reviewFeedback, status: updated.status });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "ENOENT") {
      return NextResponse.json({ error: `Feedback file not found: ${relativePath}` }, { status: 404 });
    }
    throw error;
  }
}
