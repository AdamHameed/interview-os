import { allProblems } from "../prisma/seed-data";
import {
  findPlaceholder,
  problemInputSchema,
  type ProblemInput,
} from "../src/lib/schemas";

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

  console.log(`Validated ${allProblems.length} seed problems (${byType}).`);
}
