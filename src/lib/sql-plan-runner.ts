import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import type { LocalTestResult } from "./local-runner";

/**
 * SQL plan-cost oracle. Some database problems (index selection, N+1) produce the
 * SAME result whether the query is fast or slow, so a value-equality check cannot
 * grade them. This runner instruments an in-memory SQLite database: it applies the
 * candidate's SQL (typically a CREATE INDEX), captures EXPLAIN QUERY PLAN for a fixed
 * target query, and asserts on the PLAN SHAPE — index usage vs full table scan, a
 * covering (index-only) read, and whether an ORDER BY still needs a temp B-tree sort.
 *
 * SQLite's planner picks its plan from the schema and available indexes (no ANALYZE),
 * so these signals are deterministic and independent of row volume — ideal for grading.
 * It approximates, not replaces, a production Postgres EXPLAIN ANALYZE.
 */

const TIMEOUT_MS = 3_000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const DISPLAY_LIMIT = 8_000;

export type SqlPlanAssert = {
  /** the target query must be served by an index (SEARCH ... USING INDEX). */
  usesIndex?: boolean;
  /** the query must be served index-only (USING COVERING INDEX) — no table lookup. */
  covering?: boolean;
  /** the ORDER BY must be satisfied by the index — no "USE TEMP B-TREE FOR ORDER BY". */
  noTempSort?: boolean;
  /** none of these tables may be full-scanned (SCAN <table> without an index). */
  forbidFullScanOf?: string[];
  /** the query result rows must equal this (row-order-sensitive). */
  resultEquals?: unknown[][];
  /** the target query must execute in at most this many SQL statements. */
  maxStatements?: number;
};

export type SqlPlanTest = {
  name: string;
  hidden?: boolean;
  /** schema + seed DML executed before the candidate SQL. */
  setup: string;
  /** the fixed query whose plan is evaluated (the candidate does not edit this). */
  query: string;
  assert: SqlPlanAssert;
};

type PlanSignals = {
  plan?: string[];
  result?: unknown[][];
  usesIndex?: boolean;
  covering?: boolean;
  tempSort?: boolean;
  fullScans?: string[];
  statementCount?: number;
  error?: string;
  traceback?: string;
};

function limit(value: string): string {
  if (value.length <= DISPLAY_LIMIT) return value;
  return `${value.slice(0, DISPLAY_LIMIT)}\n… output truncated`;
}

function execute(
  program: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; error?: string }> {
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
          error: timedOut ? `Timed out after ${TIMEOUT_MS} ms` : error.message || "Runner failed",
        });
      }
    );
  });
}

/**
 * Python driver: builds an in-memory SQLite db, applies the candidate SQL, then
 * captures EXPLAIN QUERY PLAN + the result for the target query and emits the signals.
 */
function driver(payloadPath: string): string {
  return `
import json, sqlite3, traceback

with open(${JSON.stringify(payloadPath)}) as f:
    spec = json.load(f)

out = {}
try:
    db = sqlite3.connect(":memory:")
    db.executescript(spec["setup"])
    candidate = spec.get("candidate", "") or ""
    if candidate.strip():
        db.executescript(candidate)

    details = [row[3] for row in db.execute("EXPLAIN QUERY PLAN " + spec["query"]).fetchall()]
    full_scans, uses_index, covering, temp_sort = [], False, False, False
    for d in details:
        du = d.upper()
        if "USING INDEX" in du or "USING COVERING INDEX" in du:
            uses_index = True
        if "COVERING INDEX" in du:
            covering = True
        if du.startswith("SCAN") and "USING INDEX" not in du and "COVERING INDEX" not in du:
            parts = d.split()
            name = parts[2] if len(parts) > 2 and parts[1].upper() == "TABLE" else (parts[1] if len(parts) > 1 else "")
            full_scans.append(name)
        if "TEMP B-TREE" in du:
            temp_sort = True

    stmt_count = [0]
    db.set_trace_callback(lambda s: stmt_count.__setitem__(0, stmt_count[0] + 1))
    result = [list(r) for r in db.execute(spec["query"]).fetchall()]
    db.set_trace_callback(None)

    out = {
        "plan": details,
        "result": result,
        "usesIndex": uses_index,
        "covering": covering,
        "tempSort": temp_sort,
        "fullScans": full_scans,
        "statementCount": stmt_count[0],
    }
except BaseException as exc:
    out = {"error": f"{type(exc).__name__}: {exc}", "traceback": traceback.format_exc(limit=6)}

print(json.dumps(out, ensure_ascii=False))
`;
}

function evaluate(signals: PlanSignals, spec: SqlPlanAssert): string[] {
  const failures: string[] = [];
  const a = spec;
  if (a.usesIndex && !signals.usesIndex) {
    failures.push("query does not use an index (expected SEARCH ... USING INDEX, got a full scan)");
  }
  if (a.covering && !signals.covering) {
    failures.push("query is not served index-only (expected USING COVERING INDEX — add the selected columns to the index)");
  }
  if (a.noTempSort && signals.tempSort) {
    failures.push("ORDER BY still needs a temp B-tree sort (the index does not provide the sort order)");
  }
  if (a.forbidFullScanOf && a.forbidFullScanOf.length > 0) {
    const scanned = (signals.fullScans ?? []).filter((t) => a.forbidFullScanOf!.includes(t));
    if (scanned.length > 0) {
      failures.push(`full table scan of: ${scanned.join(", ")}`);
    }
  }
  if (a.maxStatements !== undefined && (signals.statementCount ?? 0) > a.maxStatements) {
    failures.push(`too many statements: ${signals.statementCount} > ${a.maxStatements}`);
  }
  if (a.resultEquals !== undefined && !isDeepStrictEqual(signals.result, a.resultEquals)) {
    failures.push("query result does not match the expected rows");
  }
  return failures;
}

export async function runSqlPlanTests(options: {
  candidateSql: string;
  tests: SqlPlanTest[];
}): Promise<LocalTestResult[]> {
  const directory = await mkdtemp(path.join(tmpdir(), "interview-os-sql-"));
  try {
    const results: LocalTestResult[] = [];
    for (const test of options.tests) {
      const payloadPath = path.join(directory, "spec.json");
      const driverPath = path.join(directory, "driver.py");
      await writeFile(
        payloadPath,
        JSON.stringify({ setup: test.setup, candidate: options.candidateSql, query: test.query }),
        { encoding: "utf8", mode: 0o600 }
      );
      await writeFile(driverPath, driver(payloadPath), { encoding: "utf8", mode: 0o600 });

      const startedAt = performance.now();
      const proc = await execute(process.env.PYTHON ?? "python3", [driverPath], directory);
      const runtimeMs = Math.round((performance.now() - startedAt) * 10) / 10;

      let signals: PlanSignals = {};
      let parseError: string | undefined = proc.error;
      if (!parseError) {
        try {
          signals = JSON.parse(proc.stdout) as PlanSignals;
        } catch {
          parseError = "SQL runner returned an unreadable result";
        }
      }

      const runError = parseError ?? signals.error;
      const failures = runError ? [runError] : evaluate(signals, test.assert);
      const planText = signals.plan ? `QUERY PLAN\n${signals.plan.map((d) => `  ${d}`).join("\n")}` : "";

      results.push({
        name: test.name,
        hidden: Boolean(test.hidden),
        passed: failures.length === 0,
        stdout: limit(planText),
        stderr: limit(proc.stderr ?? ""),
        expected: test.hidden ? undefined : test.assert,
        actual: test.hidden
          ? undefined
          : {
              plan: signals.plan,
              usesIndex: signals.usesIndex,
              covering: signals.covering,
              tempSort: signals.tempSort,
              fullScans: signals.fullScans,
            },
        runtimeMs,
        error: failures.length > 0 ? limit(failures.join("; ")) : undefined,
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
      runtimeMs: 0,
      error: limit(message),
    }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
