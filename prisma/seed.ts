import { Prisma, PrismaClient } from "@prisma/client";
import { allProblems } from "./seed-data";
import { problemInputSchema, type ProblemInput } from "../src/lib/schemas";

const prisma = new PrismaClient();

function toProblemData(problem: ProblemInput): Prisma.ProblemCreateInput {
  const {
    topics,
    targetRoles,
    companyStyles,
    supportedLanguages,
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

  console.log(`Seeded ${problems.length} problems.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
