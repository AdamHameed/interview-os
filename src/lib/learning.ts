import type { LearningModule, LearningPath, LearningPathModule, Lesson } from "@prisma/client";
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

export const MODULE_CATEGORIES = [
  "dsa", "system_design", "backend", "infrastructure", "devops", "docker",
  "kubernetes", "operating_systems", "networking", "databases", "caching",
  "distributed_systems", "concurrency", "cpp", "python", "java", "go",
  "quant_dev", "ai_usage", "behavioral",
] as const;

export const MODULE_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const PATH_MODULE_LABELS = ["warmup", "core", "advanced", "optional", "interview_cram"] as const;

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
  category: z.enum(MODULE_CATEGORIES),
  difficulty: z.enum(MODULE_DIFFICULTIES),
  estimatedHours: z.number().int().min(1).max(100),
  prerequisites: z.array(z.string()),
  outcomes: z.array(z.string().min(5)).min(1),
  sourceUrls: z.array(z.string().url()),
  isPublished: z.boolean(),
  isPlaceholder: z.boolean(),
  lessons: z.array(lessonSeedSchema).min(2),
});
export type ModuleSeed = z.infer<typeof moduleSeedSchema>;

export const pathModuleSeedSchema = z.object({
  moduleSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  order: z.number().int().min(1),
  isRequired: z.boolean(),
  label: z.enum(PATH_MODULE_LABELS).optional(),
});
export type PathModuleSeed = z.infer<typeof pathModuleSeedSchema>;

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
  modules: z.array(pathModuleSeedSchema).min(1),
});
export type LearningPathSeed = z.infer<typeof learningPathSeedSchema>;

export type HydratedLearningPath = Omit<LearningPath, "targetRoles"> & {
  targetRoles: Role[];
};

export type HydratedLearningModule = Omit<
  LearningModule,
  "prerequisites" | "outcomes" | "sourceUrls" | "category" | "difficulty"
> & {
  prerequisites: string[];
  outcomes: string[];
  sourceUrls: string[];
  category: (typeof MODULE_CATEGORIES)[number];
  difficulty: (typeof MODULE_DIFFICULTIES)[number];
};

export type HydratedPathModule = LearningPathModule;

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
    sourceUrls: parseJsonArray<string>(module.sourceUrls),
    category: module.category as HydratedLearningModule["category"],
    difficulty: module.difficulty as HydratedLearningModule["difficulty"],
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

export function learningModuleId(moduleSlug: string): string;
export function learningModuleId(pathSlug: string, moduleSlug: string): string;
export function learningModuleId(pathOrModuleSlug: string, moduleSlug?: string): string {
  return `module:${moduleSlug ?? pathOrModuleSlug}`;
}

export function learningPathModuleId(pathSlug: string, moduleSlug: string): string {
  return `path-module:${pathSlug}:${moduleSlug}`;
}

export function lessonId(moduleId: string, slug: string): string {
  return `lesson:${moduleId}:${slug}`;
}
