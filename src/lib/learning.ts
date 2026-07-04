import type { LearningModule, LearningPath, Lesson } from "@prisma/client";
import { z } from "zod";
import { DIFFICULTIES, ROLES, type Role } from "@/lib/enums";
import { parseJsonArray } from "@/lib/json";

export const LESSON_TYPES = [
  "concept",
  "walkthrough",
  "pattern",
  "system_design",
  "debugging",
  "optimization",
  "ai_usage",
  "project_deep_dive",
] as const;

export const lessonSeedSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(5),
  lessonType: z.enum(LESSON_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  estimatedMinutes: z.number().int().min(5).max(180),
  contentMarkdown: z.string().min(20),
  keyTakeaways: z.array(z.string().min(5)).min(1),
  examples: z.array(z.string().min(5)),
  linkedProblemSlugs: z.array(z.string()),
  sourceUrls: z.array(z.string().url()),
  order: z.number().int().min(1),
  isPlaceholder: z.boolean(),
});
export type LessonSeed = z.infer<typeof lessonSeedSchema>;

export const moduleSeedSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(5),
  description: z.string().min(20),
  order: z.number().int().min(1),
  estimatedHours: z.number().int().min(1).max(100),
  prerequisites: z.array(z.string()),
  outcomes: z.array(z.string().min(5)).min(1),
  lessons: z.array(lessonSeedSchema).min(2),
});
export type ModuleSeed = z.infer<typeof moduleSeedSchema>;

export const learningPathSeedSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(5),
  description: z.string().min(30),
  targetRoles: z.array(z.enum(ROLES)).min(1),
  difficulty: z.string().min(3),
  estimatedHours: z.number().int().min(1).max(500),
  order: z.number().int().min(1),
  isPublished: z.boolean(),
  modules: z.array(moduleSeedSchema).min(1),
});
export type LearningPathSeed = z.infer<typeof learningPathSeedSchema>;

export type HydratedLearningPath = Omit<LearningPath, "targetRoles"> & {
  targetRoles: Role[];
};

export type HydratedLearningModule = Omit<
  LearningModule,
  "prerequisites" | "outcomes"
> & {
  prerequisites: string[];
  outcomes: string[];
};

export type HydratedLesson = Omit<
  Lesson,
  "keyTakeaways" | "examples" | "linkedProblemIds" | "sourceUrls"
> & {
  lessonType: (typeof LESSON_TYPES)[number];
  keyTakeaways: string[];
  examples: string[];
  linkedProblemIds: string[];
  sourceUrls: string[];
};

export function hydrateLearningPath(path: LearningPath): HydratedLearningPath {
  return { ...path, targetRoles: parseJsonArray<Role>(path.targetRoles) };
}

export function hydrateLearningModule(module: LearningModule): HydratedLearningModule {
  return {
    ...module,
    prerequisites: parseJsonArray<string>(module.prerequisites),
    outcomes: parseJsonArray<string>(module.outcomes),
  };
}

export function hydrateLesson(lesson: Lesson): HydratedLesson {
  return {
    ...lesson,
    lessonType: lesson.lessonType as HydratedLesson["lessonType"],
    keyTakeaways: parseJsonArray<string>(lesson.keyTakeaways),
    examples: parseJsonArray<string>(lesson.examples),
    linkedProblemIds: parseJsonArray<string>(lesson.linkedProblemIds),
    sourceUrls: parseJsonArray<string>(lesson.sourceUrls),
  };
}

export function learningPathId(slug: string): string {
  return `path:${slug}`;
}

export function learningModuleId(pathSlug: string, moduleSlug: string): string {
  return `module:${pathSlug}:${moduleSlug}`;
}

export function lessonId(moduleId: string, slug: string): string {
  return `lesson:${moduleId}:${slug}`;
}
