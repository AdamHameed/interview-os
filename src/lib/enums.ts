/**
 * Single source of truth for every enum-like value in the app.
 * SQLite stores these as plain strings; Zod (src/lib/schemas.ts) validates
 * them at every write boundary (seed, admin form, JSON import).
 */

export const PROBLEM_TYPES = [
  "dsa",
  "read_code",
  "write_code",
  "debugging",
  "optimization",
  "system_design",
  "low_level_design",
  "quant_dev",
  "databases",
  "os_networking_concurrency",
  "ai_usage",
  "behavioral",
] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  dsa: "DSA",
  read_code: "Read Code",
  write_code: "Write From Spec",
  debugging: "Debugging",
  optimization: "Optimization",
  system_design: "System Design",
  low_level_design: "Low-Level Design",
  quant_dev: "Quant Dev",
  databases: "Databases",
  os_networking_concurrency: "OS / Net / Concurrency",
  ai_usage: "AI Usage",
  behavioral: "Behavioral",
};

/** Short one-line description per format, used on dashboard + practice cards. */
export const PROBLEM_TYPE_DESCRIPTIONS: Record<ProblemType, string> = {
  dsa: "Classic algorithms and data structures with production-flavored twists.",
  read_code: "Read unfamiliar code, predict its behavior, and spot the bug.",
  write_code: "Implement a small component from a precise spec, edge cases included.",
  debugging: "A system is broken. Find the root cause and fix it properly.",
  optimization: "Take working-but-slow code or queries and make them fast.",
  system_design: "Design services end-to-end: APIs, data, scaling, failure modes.",
  low_level_design: "Object-oriented design of a component with clean interfaces.",
  quant_dev: "Language internals, latency, and market-infrastructure knowledge.",
  databases: "Indexes, transactions, query plans, and schema decisions.",
  os_networking_concurrency: "Processes, sockets, locks, and the machinery underneath.",
  ai_usage: "Use AI tools effectively and token-efficiently without dependence.",
  behavioral: "Project deep dives and stories with real engineering substance.",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const ROLES = [
  "backend_swe",
  "fullstack_swe",
  "infrastructure_swe",
  "quant_developer",
  "hft_swe",
  "platform_engineer",
  "distributed_systems_engineer",
  "new_grad_swe",
  "mid_level_swe",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  backend_swe: "Backend SWE",
  fullstack_swe: "Full-Stack SWE",
  infrastructure_swe: "Infrastructure SWE",
  quant_developer: "Quant Developer",
  hft_swe: "HFT Software Engineer",
  platform_engineer: "Platform Engineer",
  distributed_systems_engineer: "Distributed Systems Engineer",
  new_grad_swe: "New Grad SWE",
  mid_level_swe: "Mid-Level SWE",
};

export const COMPANY_STYLES = [
  "big_tech",
  "startup",
  "fintech",
  "hft",
  "infra_heavy",
  "quant_fund",
] as const;
export type CompanyStyle = (typeof COMPANY_STYLES)[number];

export const COMPANY_STYLE_LABELS: Record<CompanyStyle, string> = {
  big_tech: "Big Tech",
  startup: "Startup",
  fintech: "Fintech",
  hft: "HFT",
  infra_heavy: "Infra-Heavy",
  quant_fund: "Quant Fund",
};

export const SOURCE_TYPES = [
  "original",
  "external_link",
  "open_source_inspired",
  "official_docs_inspired",
  "educational_inspired",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  original: "Original",
  external_link: "External Link",
  open_source_inspired: "Open-Source Inspired",
  official_docs_inspired: "Official-Docs Inspired",
  educational_inspired: "Educational Inspired",
};

export const ATTEMPT_STATUSES = [
  "not_started",
  "in_progress",
  "solved",
  "needs_review",
  "skipped",
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const ATTEMPT_STATUS_LABELS: Record<AttemptStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  solved: "Solved",
  needs_review: "Needs Review",
  skipped: "Skipped",
};

export const RESOURCE_TYPES = [
  "article",
  "video",
  "repo",
  "course",
  "book",
  "docs",
  "paper",
  "blog",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  article: "Article",
  video: "Video",
  repo: "Repo",
  course: "Course",
  book: "Book",
  docs: "Docs",
  paper: "Paper",
  blog: "Blog",
};

export const RESOURCE_STATUSES = [
  "not_started",
  "reading",
  "done",
  "archived",
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  not_started: "Not Started",
  reading: "Reading",
  done: "Done",
  archived: "Archived",
};

export const INTERVIEW_STATUSES = ["active", "completed", "abandoned"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_FORMATS = [...PROBLEM_TYPES, "mixed"] as const;
export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number];

export const INTERVIEW_FORMAT_LABELS: Record<InterviewFormat, string> = {
  ...PROBLEM_TYPE_LABELS,
  mixed: "Mixed",
};

export const INTERVIEW_DURATIONS = [30, 45, 60, 90] as const;

export const LANGUAGES = [
  "python",
  "typescript",
  "javascript",
  "java",
  "cpp",
  "go",
  "sql",
  "bash",
] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  python: "Python",
  typescript: "TypeScript",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  go: "Go",
  sql: "SQL",
  bash: "Bash",
};

/** Maps our language ids to Monaco editor language ids. */
export const MONACO_LANGUAGE: Record<string, string> = {
  python: "python",
  typescript: "typescript",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
  go: "go",
  sql: "sql",
  bash: "shell",
};
