import { Prisma, PrismaClient } from "@prisma/client";
import { allProblems, learningPaths } from "./seed-data";
import { problemInputSchema, type ProblemInput } from "../src/lib/schemas";
import { learningPathSeedSchema } from "../src/lib/learning";

const prisma = new PrismaClient();

function toProblemData(problem: ProblemInput): Prisma.ProblemCreateInput {
  const {
    topics,
    targetRoles,
    companyStyles,
    supportedLanguages,
    pathIds,
    moduleIds,
    lessonIds,
    tests,
    hints,
    commonMistakes,
    followUpQuestions,
    rubric,
    sourceUrls,
    ...scalarFields
  } = problem;

  return {
    ...scalarFields,
    topics: JSON.stringify(topics),
    targetRoles: JSON.stringify(targetRoles),
    companyStyles: JSON.stringify(companyStyles),
    supportedLanguages: supportedLanguages
      ? JSON.stringify(supportedLanguages)
      : null,
    pathIds: JSON.stringify(pathIds ?? []),
    moduleIds: JSON.stringify(moduleIds ?? []),
    lessonIds: JSON.stringify(lessonIds ?? []),
    tests: tests ? JSON.stringify(tests) : null,
    hints: JSON.stringify(hints),
    commonMistakes: JSON.stringify(commonMistakes),
    followUpQuestions: JSON.stringify(followUpQuestions),
    rubric: JSON.stringify(rubric),
    sourceUrls: JSON.stringify(sourceUrls),
  };
}

async function main(): Promise<void> {
  const problems = allProblems.map((problem) => problemInputSchema.parse(problem));
  const paths = learningPaths.map((path) => learningPathSeedSchema.parse(path));

  await prisma.$transaction(
    problems.map((problem) => {
      const data = toProblemData(problem);
      return prisma.problem.upsert({
        where: { slug: problem.slug },
        create: data,
        update: data,
      });
    })
  );

  for (const path of paths) {
    await prisma.learningPath.upsert({
      where: { id: path.id },
      create: {
        id: path.id,
        slug: path.slug,
        title: path.title,
        description: path.description,
        targetRoles: JSON.stringify(path.targetRoles),
        difficulty: path.difficulty,
        estimatedHours: path.estimatedHours,
        order: path.order,
        isPublished: path.isPublished,
      },
      update: {
        slug: path.slug,
        title: path.title,
        description: path.description,
        targetRoles: JSON.stringify(path.targetRoles),
        difficulty: path.difficulty,
        estimatedHours: path.estimatedHours,
        order: path.order,
        isPublished: path.isPublished,
      },
    });

    for (const learningModule of path.modules) {
      await prisma.learningModule.upsert({
        where: { id: learningModule.id },
        create: {
          id: learningModule.id,
          pathId: path.id,
          slug: learningModule.slug,
          title: learningModule.title,
          description: learningModule.description,
          order: learningModule.order,
          estimatedHours: learningModule.estimatedHours,
          prerequisites: JSON.stringify(learningModule.prerequisites),
          outcomes: JSON.stringify(learningModule.outcomes),
        },
        update: {
          pathId: path.id,
          slug: learningModule.slug,
          title: learningModule.title,
          description: learningModule.description,
          order: learningModule.order,
          estimatedHours: learningModule.estimatedHours,
          prerequisites: JSON.stringify(learningModule.prerequisites),
          outcomes: JSON.stringify(learningModule.outcomes),
        },
      });
    }
  }

  const problemIds = new Map(
    (await prisma.problem.findMany({ select: { id: true, slug: true } })).map(
      (problem) => [problem.slug, problem.id]
    )
  );

  for (const path of paths) {
    for (const learningModule of path.modules) {
      for (const lesson of learningModule.lessons) {
        const linkedProblemIds = lesson.linkedProblemSlugs.map((slug) => {
          const problemId = problemIds.get(slug);
          if (!problemId) throw new Error(`Lesson ${lesson.slug} links missing problem ${slug}`);
          return problemId;
        });
        const data = {
          moduleId: learningModule.id,
          slug: lesson.slug,
          title: lesson.title,
          lessonType: lesson.lessonType,
          difficulty: lesson.difficulty,
          estimatedMinutes: lesson.estimatedMinutes,
          contentMarkdown: lesson.contentMarkdown,
          keyTakeaways: JSON.stringify(lesson.keyTakeaways),
          examples: JSON.stringify(lesson.examples),
          linkedProblemIds: JSON.stringify(linkedProblemIds),
          sourceUrls: JSON.stringify(lesson.sourceUrls),
          order: lesson.order,
          isPlaceholder: lesson.isPlaceholder,
        };
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          create: { id: lesson.id, ...data },
          update: data,
        });
      }
    }
  }

  const lessonCount = paths.reduce(
    (total, path) =>
      total +
      path.modules.reduce(
        (count, learningModule) => count + learningModule.lessons.length,
        0
      ),
    0
  );
  console.log(
    `Seeded ${problems.length} problems, ${paths.length} paths, and ${lessonCount} lessons.`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
