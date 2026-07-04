import { allProblems, learningPaths } from "../prisma/seed-data";
import {
  findPlaceholder,
  problemInputSchema,
  type ProblemInput,
} from "../src/lib/schemas";
import { learningPathSeedSchema } from "../src/lib/learning";

type ValidationError = {
  slug: string;
  message: string;
};

const errors: ValidationError[] = [];
const seenSlugs = new Set<string>();

function report(slug: string, message: string): void {
  errors.push({ slug, message });
}

function checkText(slug: string, field: string, value: string | undefined): void {
  const placeholder = findPlaceholder(value);
  // "Placeholder" is also a legitimate technical noun (for example, a
  // fixed-width placeholder in a file format). Treat it as unfinished only
  // when it appears at the start of the field like generated stub copy.
  if (
    placeholder?.toLowerCase() === "placeholder" &&
    value &&
    !/^\s*placeholder\b/i.test(value)
  ) {
    return;
  }
  if (placeholder) {
    report(slug, `${field} contains placeholder text: ${JSON.stringify(placeholder)}`);
  }
}

function checkPlaceholders(problem: ProblemInput): void {
  const { slug } = problem;

  checkText(slug, "prompt", problem.prompt);
  checkText(slug, "context", problem.context);
  checkText(slug, "constraints", problem.constraints);
  checkText(slug, "solutionOutline", problem.solutionOutline);
  checkText(slug, "fullSolution", problem.fullSolution);
  checkText(slug, "licenseNote", problem.licenseNote);

  for (const [field, values] of [
    ["hints", problem.hints],
    ["commonMistakes", problem.commonMistakes],
    ["followUpQuestions", problem.followUpQuestions],
  ] as const) {
    values.forEach((value, index) => checkText(slug, `${field}[${index}]`, value));
  }

  problem.rubric.forEach((item, index) => {
    checkText(slug, `rubric[${index}].criterion`, item.criterion);
    checkText(slug, `rubric[${index}].description`, item.description);
  });
}

function checkRunnableMetadata(problem: ProblemInput): void {
  if (problem.testHarnessType !== "function_call") return;

  if (!problem.functionName) {
    report(problem.slug, "function-call harness requires functionName");
  }
  if (!problem.supportedLanguages || problem.supportedLanguages.length === 0) {
    report(problem.slug, "function-call harness requires supportedLanguages");
  }

  const runnableTests = (problem.tests ?? []).filter(
    (test) =>
      Array.isArray(test.args) &&
      Object.prototype.hasOwnProperty.call(test, "expectedValue")
  );
  if (runnableTests.length === 0) {
    report(problem.slug, "function-call harness requires structured runnable tests");
    return;
  }
  if (!runnableTests.some((test) => !test.hidden)) {
    report(problem.slug, "function-call harness requires at least one public test");
  }
  if (!runnableTests.some((test) => test.hidden)) {
    report(problem.slug, "function-call harness requires at least one hidden test");
  }
}

for (const candidate of allProblems) {
  const slug = typeof candidate.slug === "string" ? candidate.slug : "<missing slug>";

  if (seenSlugs.has(slug)) {
    report(slug, "duplicate slug");
  }
  seenSlugs.add(slug);

  const parsed = problemInputSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "problem";
      report(slug, `${path}: ${issue.message}`);
    }
    continue;
  }

  checkPlaceholders(parsed.data);
  checkRunnableMetadata(parsed.data);
}

const problemSlugs = new Set(allProblems.map((problem) => problem.slug));
const pathIds = new Set<string>();
const moduleIds = new Set<string>();
const lessonIds = new Set<string>();
const lessonSlugs = new Set<string>();
let realLessonCount = 0;

for (const candidate of learningPaths) {
  const parsed = learningPathSeedSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      report(candidate.slug, `learning path ${issue.path.join(".")}: ${issue.message}`);
    }
    continue;
  }
  const path = parsed.data;
  if (pathIds.has(path.id)) report(path.slug, `duplicate path id ${path.id}`);
  pathIds.add(path.id);

  const moduleOrders = new Set<number>();
  for (const learningModule of path.modules) {
    if (moduleIds.has(learningModule.id)) {
      report(path.slug, `duplicate module id ${learningModule.id}`);
    }
    if (moduleOrders.has(learningModule.order)) {
      report(path.slug, `duplicate module order ${learningModule.order}`);
    }
    moduleIds.add(learningModule.id);
    moduleOrders.add(learningModule.order);

    const placeholderCount = learningModule.lessons.filter(
      (lesson) => lesson.isPlaceholder
    ).length;
    if (placeholderCount !== 0 && (placeholderCount < 2 || placeholderCount > 3)) {
      report(
        learningModule.slug,
        "an incomplete module requires 2–3 placeholder lessons; a completed module requires none"
      );
    }
    const lessonOrders = new Set<number>();
    for (const lesson of learningModule.lessons) {
      if (lessonIds.has(lesson.id)) {
        report(learningModule.slug, `duplicate lesson id ${lesson.id}`);
      }
      if (lessonSlugs.has(lesson.slug)) {
        report(learningModule.slug, `duplicate lesson slug ${lesson.slug}`);
      }
      if (lessonOrders.has(lesson.order)) {
        report(learningModule.slug, `duplicate lesson order ${lesson.order}`);
      }
      lessonIds.add(lesson.id);
      lessonSlugs.add(lesson.slug);
      lessonOrders.add(lesson.order);
      if (!lesson.isPlaceholder) realLessonCount += 1;
      for (const problemSlug of lesson.linkedProblemSlugs) {
        if (!problemSlugs.has(problemSlug)) {
          report(lesson.slug, `links missing problem ${problemSlug}`);
        }
      }
    }
  }
}

if (realLessonCount < 8) {
  report("learning-paths", `expected at least 8 foundational real lessons, found ${realLessonCount}`);
}

for (const problem of allProblems) {
  for (const pathId of problem.pathIds ?? []) {
    if (!pathIds.has(pathId)) report(problem.slug, `unknown path id ${pathId}`);
  }
  for (const moduleId of problem.moduleIds ?? []) {
    if (!moduleIds.has(moduleId)) report(problem.slug, `unknown module id ${moduleId}`);
  }
  for (const lessonId of problem.lessonIds ?? []) {
    if (!lessonIds.has(lessonId)) report(problem.slug, `unknown lesson id ${lessonId}`);
  }
}

if (errors.length > 0) {
  console.error(`Seed validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error.slug}: ${error.message}`);
  }
  process.exitCode = 1;
} else {
  const byType = Object.entries(
    allProblems.reduce<Record<string, number>>((counts, problem) => {
      counts[problem.type] = (counts[problem.type] ?? 0) + 1;
      return counts;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${type}=${count}`)
    .join(", ");

  console.log(
    `Validated ${allProblems.length} seed problems (${byType}) and ${learningPaths.length} learning paths.`
  );
}
