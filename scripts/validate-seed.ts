import { allProblems, learningModules, learningPaths } from "../prisma/seed-data";
import { LEGACY_LESSON_SLUGS } from "../prisma/seed-data/learning";
import {
  findPlaceholder,
  problemInputSchema,
  type ProblemInput,
} from "../src/lib/schemas";
import { learningPathSeedSchema, moduleSeedSchema } from "../src/lib/learning";

type ValidationError = {
  slug: string;
  message: string;
};

const REQUIRED_REAL_LESSON_SECTIONS = [
  "Goal",
  "Why This Matters",
  "The Simple Mental Model",
  "Worked Example",
  "Interview Value",
  "Common Interview Questions",
  "Common Mistakes",
  "Quick Check",
  "Key Takeaway",
] as const;

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

function checkRealLessonQuality(lesson: {
  slug: string;
  estimatedMinutes: number;
  contentMarkdown: string;
  sourceUrls: string[];
}): void {
  for (const heading of REQUIRED_REAL_LESSON_SECTIONS) {
    const pattern = heading === "Worked Example"
      ? /^##\s+(?:Worked )?Example\s*$/im
      : new RegExp(`^##\\s+${heading}\\s*$`, "im");
    if (!pattern.test(lesson.contentMarkdown)) {
      report(lesson.slug, `ready lesson is missing required section ${JSON.stringify(heading)}`);
    }
  }

  const wordCount = lesson.contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  const minimumWords = Math.max(900, lesson.estimatedMinutes * 30);
  if (wordCount < minimumWords) {
    report(
      lesson.slug,
      `ready lesson has ${wordCount} words; expected at least ${minimumWords} for ${lesson.estimatedMinutes} minutes`
    );
  }
  if (lesson.sourceUrls.length === 0) {
    report(lesson.slug, "ready lesson requires at least one public research source");
  }

  if (LEGACY_LESSON_SLUGS.has(lesson.slug)) return;

  const headings = [...lesson.contentMarkdown.matchAll(/^##\s+(.+?)\s*$/gm)].map(
    (match) => ({ title: match[1], index: match.index ?? -1 })
  );
  if (headings[0]?.title !== "Goal") {
    report(lesson.slug, "new ready lesson must begin with ## Goal");
  }
  if (headings.at(-1)?.title !== "Key Takeaway") {
    report(lesson.slug, "new ready lesson must end with ## Key Takeaway");
  }

  const orderedSections = [
    /^Goal$/,
    /^Why This Matters$/,
    /^The Simple Mental Model$/,
    /^(?:Worked )?Example$/,
    /^Interview Value$/,
    /^Common Interview Questions$/,
    /^Common Mistakes$/,
    /^Quick Check$/,
    /^Key Takeaway$/,
  ];
  let previousIndex = -1;
  for (const sectionPattern of orderedSections) {
    const heading = headings.find((candidate) => sectionPattern.test(candidate.title));
    if (heading && heading.index <= previousIndex) {
      report(lesson.slug, "new ready lesson sections are not in the required authoring order");
      break;
    }
    if (heading) previousIndex = heading.index;
  }

  if (!lesson.contentMarkdown.includes("```")) {
    report(lesson.slug, "new ready lesson requires a fenced diagram, trace, code, or configuration artifact");
  }

  const sectionBody = (start: RegExp): string => {
    const match = start.exec(lesson.contentMarkdown);
    if (!match || match.index === undefined) return "";
    const bodyStart = match.index + match[0].length;
    const nextHeading = lesson.contentMarkdown.slice(bodyStart).search(/^##\s+/m);
    return nextHeading === -1
      ? lesson.contentMarkdown.slice(bodyStart)
      : lesson.contentMarkdown.slice(bodyStart, bodyStart + nextHeading);
  };
  const interviewQuestions = sectionBody(/^##\s+Common Interview Questions\s*$/im);
  if ((interviewQuestions.match(/^###\s+/gm) ?? []).length < 3) {
    report(lesson.slug, "new ready lesson requires at least three topic-specific interview questions");
  }
  const mistakes = sectionBody(/^##\s+Common Mistakes\s*$/im);
  if ((mistakes.match(/^###\s+Mistake\s+\d+/gm) ?? []).length < 3) {
    report(lesson.slug, "new ready lesson requires at least three numbered topic-specific mistakes");
  }
  const quickCheck = sectionBody(/^##\s+Quick Check\s*$/im);
  if ((quickCheck.match(/^###\s+Question\s+\d+/gm) ?? []).length < 3) {
    report(lesson.slug, "new ready lesson requires at least three quick-check questions");
  }
  if ((quickCheck.match(/^###\s+Answer\s*$/gm) ?? []).length < 3) {
    report(lesson.slug, "new ready lesson quick checks require explicit answer sections");
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
const moduleSlugs = new Set<string>();
const lessonIds = new Set<string>();
const lessonSlugs = new Set<string>();
let realLessonCount = 0;

for (const candidate of learningModules) {
  const parsed = moduleSeedSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      report(candidate.slug, `module ${issue.path.join(".")}: ${issue.message}`);
    }
    continue;
  }
  const learningModule = parsed.data;
  if (moduleIds.has(learningModule.id)) report(learningModule.slug, `duplicate module id ${learningModule.id}`);
  if (moduleSlugs.has(learningModule.slug)) report(learningModule.slug, "duplicate module slug");
  moduleIds.add(learningModule.id);
  moduleSlugs.add(learningModule.slug);

  const motivationPlaceholder = findPlaceholder(learningModule.motivationMarkdown);
  if (motivationPlaceholder) {
    report(learningModule.slug, `module motivation contains placeholder text: ${JSON.stringify(motivationPlaceholder)}`);
  }
  const motivationWords = learningModule.motivationMarkdown.trim().split(/\s+/).filter(Boolean).length;
  if (motivationWords < 60) {
    report(learningModule.slug, `module motivation has ${motivationWords} words; expected at least 60`);
  }

  for (const prerequisite of learningModule.prerequisites) {
    if (!learningModules.some((item) => item.slug === prerequisite)) {
      report(learningModule.slug, `unknown prerequisite module ${prerequisite}`);
    }
  }
  const placeholderCount = learningModule.lessons.filter(
      (lesson) => lesson.isPlaceholder
    ).length;
  if (placeholderCount !== 0 && (placeholderCount < 2 || placeholderCount > 3)) {
    report(learningModule.slug, "an incomplete module requires 2–3 placeholder lessons; a completed module requires none");
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
      if (!lesson.isPlaceholder) {
        realLessonCount += 1;
        checkRealLessonQuality(lesson);
      }
      for (const problemSlug of lesson.linkedProblemSlugs) {
        if (!problemSlugs.has(problemSlug)) {
          report(lesson.slug, `links missing problem ${problemSlug}`);
        }
      }
  }
}

for (const candidate of learningPaths) {
  const parsed = learningPathSeedSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) report(candidate.slug, `learning path ${issue.path.join(".")}: ${issue.message}`);
    continue;
  }
  const path = parsed.data;
  if (pathIds.has(path.id)) report(path.slug, `duplicate path id ${path.id}`);
  pathIds.add(path.id);
  const orders = new Set<number>();
  const memberships = new Set<string>();
  for (const membership of path.modules) {
    if (!moduleSlugs.has(membership.moduleSlug)) report(path.slug, `links missing module ${membership.moduleSlug}`);
    if (orders.has(membership.order)) report(path.slug, `duplicate module order ${membership.order}`);
    if (memberships.has(membership.moduleSlug)) report(path.slug, `duplicate module membership ${membership.moduleSlug}`);
    orders.add(membership.order);
    memberships.add(membership.moduleSlug);
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
    `Validated ${allProblems.length} seed problems (${byType}), ${learningModules.length} modules, and ${learningPaths.length} learning paths.`
  );
}
