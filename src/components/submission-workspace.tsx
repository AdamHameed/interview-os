"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { CheckCircle2, Download, Loader2, Play, Save, Send, Upload, XCircle } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RubricItem } from "@/lib/schemas";
import type { SubmissionStatus } from "@/lib/enums";

type Language = "python" | "javascript" | "typescript" | "sql";

type TestResult = {
  name: string;
  hidden: boolean;
  passed: boolean;
  stdout: string;
  stderr: string;
  expected?: unknown;
  actual?: unknown;
  runtimeMs: number;
  error?: string;
};

type InitialSubmission = {
  id: string;
  answerText: string;
  language: string | null;
  status: SubmissionStatus;
  selfScore: number | null;
  reviewFeedback: string | null;
  testResults: TestResult[];
} | null;

function jsonValue(value: unknown): string {
  return value === undefined ? "Hidden" : JSON.stringify(value, null, 2);
}

function languageTemplate(
  language: Language,
  functionName: string,
  pythonStarter: string
): string {
  if (language === "python") {
    return pythonStarter || `def ${functionName}(*args):\n    raise NotImplementedError\n`;
  }
  if (language === "sql") {
    return pythonStarter || "-- Write your SQL here\n";
  }
  if (language === "typescript") {
    return `export function ${functionName}(...args: unknown[]): unknown {\n  throw new Error("Not implemented");\n}\n`;
  }
  return `function ${functionName}(...args) {\n  throw new Error("Not implemented");\n}\n`;
}

async function responseJson(response: Response) {
  const body = (await response.json()) as { error?: unknown } & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : JSON.stringify(body.error));
  }
  return body;
}

export function SubmissionWorkspace({
  problemId,
  isCoding,
  functionName,
  supportedLanguages,
  starterCode,
  rubric,
  solutionOutline,
  initialSubmission,
}: {
  problemId: string;
  isCoding: boolean;
  functionName: string;
  supportedLanguages: Language[];
  starterCode: string;
  rubric: RubricItem[];
  solutionOutline: string | null;
  initialSubmission: InitialSubmission;
}) {
  const { resolvedTheme } = useTheme();
  const initialLanguage =
    (initialSubmission?.language as Language | null) ?? supportedLanguages[0] ?? "python";
  const [submissionId, setSubmissionId] = useState(initialSubmission?.id ?? null);
  const [answer, setAnswer] = useState(initialSubmission?.answerText || (isCoding ? starterCode : ""));
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [status, setStatus] = useState<SubmissionStatus>(initialSubmission?.status ?? "draft");
  const [selfScore, setSelfScore] = useState(initialSubmission?.selfScore?.toString() ?? "");
  const [results, setResults] = useState<TestResult[]>(initialSubmission?.testResults ?? []);
  const [feedback, setFeedback] = useState(initialSubmission?.reviewFeedback ?? "");
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const hasSubmitted = ["submitted", "passed", "failed", "reviewed", "needs_retry"].includes(status);

  function changeLanguage(nextLanguage: Language) {
    const currentTemplate = languageTemplate(language, functionName, starterCode);
    if (!answer.trim() || answer === currentTemplate) {
      setAnswer(languageTemplate(nextLanguage, functionName, starterCode));
    }
    setLanguage(nextLanguage);
  }

  async function save(nextStatus: "draft" | "submitted") {
    setBusy(nextStatus);
    setMessage("");
    try {
      const body = await responseJson(
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId,
            problemId,
            answerText: answer,
            language: isCoding ? language : undefined,
            status: nextStatus,
            selfScore: selfScore ? Number(selfScore) : undefined,
          }),
        })
      );
      const submission = body.submission as { id: string; status: SubmissionStatus };
      setSubmissionId(submission.id);
      setStatus(submission.status);
      setMessage(nextStatus === "draft" ? "Draft saved locally." : "Submission saved locally.");
      return submission.id;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function runTests() {
    setBusy("run");
    setMessage("");
    try {
      const body = await responseJson(
        await fetch("/api/submissions/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId, language, code: answer }),
        })
      );
      setSubmissionId(body.submissionId as string);
      setStatus(body.status as SubmissionStatus);
      setResults(body.results as TestResult[]);
      setMessage(body.passed ? "All tests passed." : "One or more tests failed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function exportReview() {
    let id = submissionId;
    if (!id || !hasSubmitted) id = await save("submitted");
    if (!id) return;
    setBusy("export");
    setMessage("");
    try {
      const body = await responseJson(
        await fetch("/api/submissions/export-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId: id }),
        })
      );
      setCommand(body.command as string);
      setMessage(`Review bundle written to ${body.path as string}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function importFeedback() {
    if (!submissionId) return;
    setBusy("import");
    setMessage("");
    try {
      const body = await responseJson(
        await fetch("/api/submissions/import-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId }),
        })
      );
      setFeedback(body.feedback as string);
      setStatus(body.status as SubmissionStatus);
      setMessage("Codex feedback imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{isCoding ? "Code submission workspace" : "Written answer workspace"}</CardTitle>
            <CardDescription>
              {!isCoding
                ? "Write in Markdown, then export a local review bundle for Codex."
                : language === "sql"
                  ? "Write SQL (e.g. a CREATE INDEX); the query plan is graded in a local SQLite sandbox."
                  : `Define ${functionName}; tests run in local child processes.`}
            </CardDescription>
          </div>
          <Badge variant="outline">{status.replaceAll("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCoding ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Language</span>
                <select
                  value={language}
                  onChange={(event) => changeLanguage(event.target.value as Language)}
                  className="h-8 rounded-lg border bg-background px-2 text-sm"
                >
                  {supportedLanguages.map((item) => (
                    <option key={item} value={item}>
                      {item === "python"
                        ? "Python"
                        : item === "javascript"
                          ? "JavaScript"
                          : item === "sql"
                            ? "SQL"
                            : "TypeScript"}
                    </option>
                  ))}
                </select>
              </label>
              <Button size="sm" onClick={runTests} disabled={busy !== null || answer.trim().length === 0}>
                {busy === "run" ? <Loader2 className="animate-spin" /> : <Play />} Run tests
              </Button>
              <Button size="sm" variant="outline" onClick={() => save("draft")} disabled={busy !== null}>
                <Save /> Save
              </Button>
              <Button size="sm" variant="secondary" onClick={runTests} disabled={busy !== null || answer.trim().length === 0}>
                <Send /> Submit
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">3s per test</span>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Editor
                height="clamp(420px, 56vh, 680px)"
                language={language}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                value={answer}
                onChange={(value) => setAnswer(value ?? "")}
                options={{ minimap: { enabled: false }, fontSize: 14, lineHeight: 22, padding: { top: 14 }, scrollBeyondLastLine: false, wordWrap: "on" }}
              />
            </div>
            <details className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Local runner safety</summary>
              <p className="mt-2 leading-relaxed">Personal use only. Time and output limits do not make this a secure sandbox. Never expose it to untrusted users.</p>
            </details>
          </>
        ) : (
          <>
            <Textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Write your reasoning in Markdown…"
              className="min-h-[52vh] font-mono text-sm leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => save("draft")} disabled={busy !== null}>
                <Save /> Save draft
              </Button>
              <Button onClick={() => save("submitted")} disabled={busy !== null || answer.trim().length === 0}>
                <Send /> Submit
              </Button>
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                Self-score
                <select value={selfScore} onChange={(event) => setSelfScore(event.target.value)} className="h-8 rounded-lg border bg-background px-2">
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}/5</option>)}
                </select>
              </label>
            </div>
            {hasSubmitted && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="secondary" onClick={exportReview} disabled={busy !== null}>
                  {busy === "export" ? <Loader2 className="animate-spin" /> : <Download />} Export for Codex Review
                </Button>
                <Button variant="outline" onClick={importFeedback} disabled={busy !== null || !submissionId}>
                  {busy === "import" ? <Loader2 className="animate-spin" /> : <Upload />} Import Codex Feedback
                </Button>
              </div>
            )}
          </>
        )}

        {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}
        {command && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Run from the repository root:</p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>{command}</code></pre>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">Test results</h3>
            {results.map((result, index) => (
              <details key={`${result.name}-${index}`} className="rounded-lg border p-3" open={!result.passed}>
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                  {result.passed ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-rose-500" />}
                  {result.name}
                  {result.hidden && <Badge variant="outline">Hidden</Badge>}
                  <span className="ml-auto text-xs font-normal text-muted-foreground">{result.runtimeMs} ms</span>
                </summary>
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                  <div><div className="mb-1 font-medium">Expected</div><pre className="overflow-x-auto rounded bg-muted p-2">{jsonValue(result.expected)}</pre></div>
                  <div><div className="mb-1 font-medium">Actual</div><pre className="overflow-x-auto rounded bg-muted p-2">{jsonValue(result.actual)}</pre></div>
                </div>
                {result.stdout && <div className="mt-3"><div className="text-xs font-medium">stdout</div><pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">{result.stdout}</pre></div>}
                {result.stderr && <div className="mt-3"><div className="text-xs font-medium">stderr</div><pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">{result.stderr}</pre></div>}
                {result.error && <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-destructive/10 p-2 text-xs text-destructive">{result.error}</pre>}
              </details>
            ))}
          </div>
        )}

        {hasSubmitted && solutionOutline && (
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">Reveal solution outline</summary>
            <div className="mt-4"><Markdown>{solutionOutline}</Markdown></div>
          </details>
        )}

        {!isCoding && (
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium">Review the rubric</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {rubric.map((item) => (
                <div key={item.criterion} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{item.criterion}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {feedback && (
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-medium">Codex feedback</h3>
            <Markdown>{feedback}</Markdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
