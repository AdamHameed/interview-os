import { Prisma, PrismaClient } from "@prisma/client";
import { allProblems, learningModules, learningPaths } from "./seed-data";
import { problemInputSchema, type ProblemInput } from "../src/lib/schemas";
import { learningPathModuleId, learningPathSeedSchema, moduleSeedSchema } from "../src/lib/learning";

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
  const modules = learningModules.map((learningModule) => moduleSeedSchema.parse(learningModule));
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

  // Paths and modules are curated seed scaffolds. Rebuild their memberships so
  // removed/renamed path entries cannot survive a later seed and violate order.
  await prisma.learningPathModule.deleteMany();
  await prisma.learningModule.deleteMany({
    where: { id: { notIn: modules.map((learningModule) => learningModule.id) } },
  });

  for (const learningModule of modules) {
    await prisma.learningModule.upsert({
      where: { id: learningModule.id },
      create: {
        id: learningModule.id,
        slug: learningModule.slug,
        title: learningModule.title,
        description: learningModule.description,
        category: learningModule.category,
        difficulty: learningModule.difficulty,
        estimatedHours: learningModule.estimatedHours,
        prerequisites: JSON.stringify(learningModule.prerequisites),
        outcomes: JSON.stringify(learningModule.outcomes),
        sourceUrls: JSON.stringify(learningModule.sourceUrls),
        isPublished: learningModule.isPublished,
        isPlaceholder: learningModule.isPlaceholder,
      },
      update: {
        slug: learningModule.slug,
        title: learningModule.title,
        description: learningModule.description,
        category: learningModule.category,
        difficulty: learningModule.difficulty,
        estimatedHours: learningModule.estimatedHours,
        prerequisites: JSON.stringify(learningModule.prerequisites),
        outcomes: JSON.stringify(learningModule.outcomes),
        sourceUrls: JSON.stringify(learningModule.sourceUrls),
        isPublished: learningModule.isPublished,
        isPlaceholder: learningModule.isPlaceholder,
      },
    });
  }

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

    for (const pathModule of path.modules) {
      const learningModule = modules.find((candidate) => candidate.slug === pathModule.moduleSlug);
      if (!learningModule) throw new Error(`Path ${path.slug} links missing module ${pathModule.moduleSlug}`);
      await prisma.learningPathModule.upsert({
        where: { id: learningPathModuleId(path.slug, learningModule.slug) },
        create: {
          id: learningPathModuleId(path.slug, learningModule.slug),
          pathId: path.id,
          moduleId: learningModule.id,
          order: pathModule.order,
          isRequired: pathModule.isRequired,
          label: pathModule.label,
        },
        update: {
          pathId: path.id,
          moduleId: learningModule.id,
          order: pathModule.order,
          isRequired: pathModule.isRequired,
          label: pathModule.label,
        },
      });
    }
  }

  const problemIds = new Map(
    (await prisma.problem.findMany({ select: { id: true, slug: true } })).map(
      (problem) => [problem.slug, problem.id]
    )
  );

  for (const learningModule of modules) {
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

  const lessonCount = modules.reduce((total, learningModule) => total + learningModule.lessons.length, 0);
  console.log(
    `Seeded ${problems.length} problems, ${paths.length} paths, ${modules.length} modules, and ${lessonCount} lessons.`
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
