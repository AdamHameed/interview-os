import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";

const TIMEOUT_MS = 3_000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const DISPLAY_LIMIT = 8_000;

export type RunnerLanguage = "python" | "javascript" | "typescript";

export type RunnableTest = {
  name: string;
  args: unknown[];
  expectedValue: unknown;
  hidden?: boolean;
};

export type LocalTestResult = {
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

type ProcessResult = {
  stdout: string;
  stderr: string;
  error?: string;
};

function limit(value: string): string {
  if (value.length <= DISPLAY_LIMIT) return value;
  return `${value.slice(0, DISPLAY_LIMIT)}\n… output truncated`;
}

function execute(program: string, args: string[], cwd: string): Promise<ProcessResult> {
  return new Promise((resolve) => {
    execFile(
      program,
      args,
      { cwd, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ stdout: String(stdout), stderr: String(stderr) });
          return;
        }

        const timedOut = "killed" in error && error.killed;
        resolve({
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          error: timedOut
            ? `Timed out after ${TIMEOUT_MS} ms`
            : error.message || "Runner process failed",
        });
      }
    );
  });
}

function pythonRunner(userPath: string, functionName: string, test: RunnableTest): string {
  const argsJson = JSON.stringify(test.args);
  return `
import asyncio
import contextlib
import importlib.util
import inspect
import io
import json
import math
import traceback

USER_PATH = ${JSON.stringify(userPath)}
FUNCTION_NAME = ${JSON.stringify(functionName)}
ARGS = json.loads(${JSON.stringify(argsJson)})
OUTPUT_LIMIT = ${DISPLAY_LIMIT}

class LimitedWriter(io.StringIO):
    def write(self, value):
        remaining = OUTPUT_LIMIT - self.tell()
        if remaining > 0:
            super().write(str(value)[:remaining])
        return len(value)

def normalize(value):
    if isinstance(value, dict):
        return {str(k): normalize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [normalize(v) for v in value]
    if isinstance(value, set):
        return sorted((normalize(v) for v in value), key=lambda v: json.dumps(v, sort_keys=True))
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise TypeError(f"result is not JSON-compatible: {type(value).__name__}")

captured_out = LimitedWriter()
captured_err = LimitedWriter()
payload = {}
try:
    with contextlib.redirect_stdout(captured_out), contextlib.redirect_stderr(captured_err):
        spec = importlib.util.spec_from_file_location("interview_submission", USER_PATH)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        fn = getattr(module, FUNCTION_NAME)
        actual = fn(*ARGS)
        if inspect.isawaitable(actual):
            actual = asyncio.run(actual)
    payload = {"actual": normalize(actual)}
except BaseException as exc:
    payload = {"error": f"{type(exc).__name__}: {exc}", "traceback": traceback.format_exc(limit=8)}

payload["stdout"] = captured_out.getvalue()
payload["stderr"] = captured_err.getvalue()
print(json.dumps(payload, ensure_ascii=False, allow_nan=False))
`;
}

function javascriptRunner(
  userPath: string,
  functionName: string,
  test: RunnableTest
): string {
  return `
const USER_PATH = ${JSON.stringify(userPath)};
const FUNCTION_NAME = ${JSON.stringify(functionName)};
const ARGS = ${JSON.stringify(test.args)};
const OUTPUT_LIMIT = ${DISPLAY_LIMIT};

function normalize(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return Number.isFinite(value) || typeof value !== "number" ? value : String(value);
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (value instanceof Set) {
    return [...value].map(normalize).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  throw new TypeError("result is not JSON-compatible: " + typeof value);
}

const stdout = [];
const stderr = [];
function boundedCapture(target) {
  let used = 0;
  return (value) => {
    if (used >= OUTPUT_LIMIT) return;
    const chunk = String(value).slice(0, OUTPUT_LIMIT - used);
    target.push(chunk);
    used += chunk.length;
  };
}
const captureStdout = boundedCapture(stdout);
const captureStderr = boundedCapture(stderr);
const realStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk) => { captureStdout(chunk); return true; };
process.stderr.write = (chunk) => { captureStderr(chunk); return true; };
console.log = (...items) => captureStdout(items.map(String).join(" ") + "\\n");
console.error = (...items) => captureStderr(items.map(String).join(" ") + "\\n");

(async () => {
  let payload;
  try {
    const user = require(USER_PATH);
    const fn = user.__interviewSolve ?? user[FUNCTION_NAME];
    if (typeof fn !== "function") throw new TypeError("Missing function " + FUNCTION_NAME);
    payload = { actual: normalize(await fn(...ARGS)) };
  } catch (error) {
    payload = { error: (error?.name ?? "Error") + ": " + (error?.message ?? String(error)) };
  }
  payload.stdout = stdout.join("");
  payload.stderr = stderr.join("");
  realStdoutWrite(JSON.stringify(payload));
})();
`;
}

function transpileUserCode(code: string, functionName: string): string {
  const bridge = `\n;module.exports.__interviewSolve = typeof ${functionName} !== "undefined" ? ${functionName} : module.exports[${JSON.stringify(functionName)}];\n`;
  const output = ts.transpileModule(`${code}${bridge}`, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const diagnostics = output.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (diagnostics && diagnostics.length > 0) {
    throw new Error(
      diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        )
        .join("\n")
    );
  }
  return output.outputText;
}

function parseRunnerPayload(result: ProcessResult): {
  actual?: unknown;
  stdout: string;
  stderr: string;
  error?: string;
} {
  if (result.error) {
    return {
      stdout: limit(result.stdout),
      stderr: limit(result.stderr),
      error: result.error,
    };
  }
  try {
    const payload = JSON.parse(result.stdout) as {
      actual?: unknown;
      stdout?: string;
      stderr?: string;
      error?: string;
      traceback?: string;
    };
    return {
      actual: payload.actual,
      stdout: limit(payload.stdout ?? ""),
      stderr: limit(payload.stderr ?? ""),
      error: payload.error
        ? limit([payload.error, payload.traceback].filter(Boolean).join("\n"))
        : undefined,
    };
  } catch {
    return {
      stdout: limit(result.stdout),
      stderr: limit(result.stderr),
      error: "Runner returned an unreadable result",
    };
  }
}

export async function runLocalTests(options: {
  language: RunnerLanguage;
  code: string;
  functionName: string;
  tests: RunnableTest[];
}): Promise<LocalTestResult[]> {
  const directory = await mkdtemp(path.join(tmpdir(), "interview-os-"));
  try {
    const isPython = options.language === "python";
    const userPath = path.join(directory, isPython ? "user.py" : "user.cjs");
    const userCode = isPython
      ? options.code
      : transpileUserCode(options.code, options.functionName);
    await writeFile(userPath, userCode, { encoding: "utf8", mode: 0o600 });

    const results: LocalTestResult[] = [];
    for (const test of options.tests) {
      const runnerPath = path.join(directory, isPython ? "runner.py" : "runner.cjs");
      const runner = isPython
        ? pythonRunner(userPath, options.functionName, test)
        : javascriptRunner(userPath, options.functionName, test);
      await writeFile(runnerPath, runner, { encoding: "utf8", mode: 0o600 });

      const startedAt = performance.now();
      const processResult = await execute(
        isPython ? process.env.PYTHON ?? "python3" : process.execPath,
        [runnerPath],
        directory
      );
      const runtimeMs = Math.round((performance.now() - startedAt) * 10) / 10;
      const payload = parseRunnerPayload(processResult);
      const passed = !payload.error && isDeepStrictEqual(payload.actual, test.expectedValue);

      results.push({
        name: test.name,
        hidden: Boolean(test.hidden),
        passed,
        stdout: payload.stdout,
        stderr: payload.stderr,
        expected: test.hidden ? undefined : test.expectedValue,
        actual: test.hidden ? undefined : payload.actual,
        runtimeMs,
        error: payload.error,
      });
    }
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return options.tests.map((test) => ({
      name: test.name,
      hidden: Boolean(test.hidden),
      passed: false,
      stdout: "",
      stderr: "",
      expected: test.hidden ? undefined : test.expectedValue,
      runtimeMs: 0,
      error: limit(message),
    }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
