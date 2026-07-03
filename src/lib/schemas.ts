import { z } from "zod";
import {
  ATTEMPT_STATUSES,
  COMPANY_STYLES,
  DIFFICULTIES,
  INTERVIEW_DURATIONS,
  INTERVIEW_FORMATS,
  PROBLEM_TYPES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  ROLES,
  SOURCE_TYPES,
  SUBMISSION_STATUSES,
} from "@/lib/enums";

export const rubricItemSchema = z.object({
  criterion: z.string().min(3),
  description: z.string().min(10),
});
export type RubricItem = z.infer<typeof rubricItemSchema>;

export const testCaseSchema = z.object({
  name: z.string().min(1),
  input: z.string().optional(),
  expected: z.string().min(1),
  note: z.string().optional(),
  args: z.array(z.unknown()).optional(),
  expectedValue: z.unknown().optional(),
  hidden: z.boolean().optional(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Canonical problem shape used by seed files, the admin form, and JSON import.
 * Arrays stay real arrays here; serialization to SQLite JSON strings happens
 * at the Prisma boundary.
 */
export const problemInputSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(slugRegex, "slug must be kebab-case (a-z, 0-9, hyphens)"),
    title: z.string().min(5).max(120),
    type: z.enum(PROBLEM_TYPES),
    difficulty: z.enum(DIFFICULTIES),
    topics: z.array(z.string().min(2)).min(1, "at least one topic required"),
    targetRoles: z.array(z.enum(ROLES)).min(1, "at least one target role"),
    companyStyles: z.array(z.enum(COMPANY_STYLES)).min(1),
    estimatedMinutes: z.number().int().min(5).max(120),
    language: z.string().optional(),
    functionName: z.string().regex(/^[A-Za-z_$][\w$]*$/).optional(),
    testHarnessType: z.enum(["function_call", "stdin_stdout", "custom"]).optional(),
    supportedLanguages: z
      .array(z.enum(["python", "javascript", "typescript"]))
      .optional(),
    prompt: z.string().min(80, "prompt must be a real problem, not a stub"),
    context: z.string().optional(),
    constraints: z.string().optional(),
    starterCode: z.string().optional(),
    tests: z.array(testCaseSchema).optional(),
    hints: z.array(z.string().min(10)).min(1, "at least one hint required"),
    solutionOutline: z.string().optional(),
    fullSolution: z.string().optional(),
    commonMistakes: z.array(z.string().min(10)).min(1),
    followUpQuestions: z.array(z.string().min(10)).min(1),
    rubric: z.array(rubricItemSchema).min(2, "rubric needs at least 2 criteria"),
    sourceType: z.enum(SOURCE_TYPES),
    sourceUrls: z.array(z.string().url()).default([]),
    licenseNote: z.string().optional(),
    qualityScore: z.number().int().min(1).max(5).default(4),
  })
  .superRefine((p, ctx) => {
    if (p.sourceType !== "original" && p.sourceUrls.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrls"],
        message: `sourceType "${p.sourceType}" requires at least one source URL`,
      });
    }
    if (p.sourceType === "original" && p.sourceUrls.length === 0 && !p.licenseNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["licenseNote"],
        message:
          "original problems without sources must carry a licenseNote explaining the problem is original and concept-based",
      });
    }
  });

export type ProblemInput = z.infer<typeof problemInputSchema>;

export const resourceInputSchema = z.object({
  title: z.string().min(3).max(160),
  url: z.string().url(),
  type: z.enum(RESOURCE_TYPES),
  topics: z.array(z.string().min(2)).min(1),
  targetRoles: z.array(z.enum(ROLES)).min(1),
  notes: z.string().optional(),
  status: z.enum(RESOURCE_STATUSES).default("not_started"),
});
export type ResourceInput = z.infer<typeof resourceInputSchema>;

export const attemptInputSchema = z.object({
  problemId: z.string().min(1),
  mockInterviewId: z.string().optional(),
  status: z.enum(ATTEMPT_STATUSES),
  notes: z.string().optional(),
  selfScore: z.number().int().min(1).max(5).optional(),
  timeSpentMinutes: z.number().int().min(0).max(600).default(0),
});
export type AttemptInput = z.infer<typeof attemptInputSchema>;

export const submissionInputSchema = z.object({
  problemId: z.string().min(1),
  submissionId: z.string().min(1).optional(),
  answerText: z.string().max(500_000),
  language: z.enum(["python", "javascript", "typescript"]).optional(),
  status: z.enum(SUBMISSION_STATUSES),
  selfScore: z.number().int().min(1).max(5).optional(),
});
export type SubmissionInput = z.infer<typeof submissionInputSchema>;

export const interviewConfigSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  targetRole: z.enum(ROLES),
  format: z.enum(INTERVIEW_FORMATS),
  durationMinutes: z
    .number()
    .int()
    .refine((d) => (INTERVIEW_DURATIONS as readonly number[]).includes(d), {
      message: `duration must be one of ${INTERVIEW_DURATIONS.join(", ")}`,
    }),
  difficulty: z.union([z.enum(DIFFICULTIES), z.literal("mixed")]),
  topics: z.array(z.string()).default([]),
  companyStyle: z.enum(COMPANY_STYLES).optional(),
});
export type InterviewConfig = z.infer<typeof interviewConfigSchema>;

/** Words that indicate unfinished placeholder content in seed data. */
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\blorem ipsum\b/i,
  /\bplaceholder\b/i,
  /\bcoming soon\b/i,
  /\bTBD\b/,
  /\bxxx\b/i,
];

export function findPlaceholder(text: string | undefined | null): string | null {
  if (!text) return null;
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}
