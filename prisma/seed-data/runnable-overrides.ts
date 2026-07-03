import type { SeedProblem } from "./types";

type RunnableMetadata = Pick<
  SeedProblem,
  "functionName" | "testHarnessType" | "supportedLanguages" | "tests"
>;

const LANGUAGES = ["python", "javascript", "typescript"] as const;

/**
 * Executable metadata for existing authored problems. Keeping it separate
 * avoids rewriting their prompts and makes the local-runner surface auditable.
 */
export const runnableOverrides: Record<string, RunnableMetadata> = {
  "clean-request-window": {
    functionName: "longest_clean_window",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "no duplicates",
        input: "[(1,'a','k1'), (2,'b','k2'), (3,'c','k3')]",
        expected: "3",
        args: [[ [1, "a", "k1"], [2, "b", "k2"], [3, "c", "k3"] ]],
        expectedValue: 3,
      },
      {
        name: "retries collapse",
        input: "[(1,'a','k1'), (2,'a','k1'), (3,'b','k2')]",
        expected: "3",
        args: [[ [1, "a", "k1"], [2, "a", "k1"], [3, "b", "k2"] ]],
        expectedValue: 3,
      },
      {
        name: "new key invalidates the window",
        input: "retry followed by a different key for the same client",
        expected: "2",
        args: [[ [1, "a", "k1"], [2, "a", "k1"], [3, "a", "k2"], [4, "b", "k9"] ]],
        expectedValue: 2,
        hidden: true,
      },
    ],
  },
  "feature-rollout-reachability": {
    functionName: "reachable",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "gated edge blocks",
        input: "versions={'a':1,'b':1}, edges=[('a','b',2)], start='a'",
        expected: "{'a'}",
        args: [{ a: 1, b: 1 }, [["a", "b", 2]], "a"],
        expectedValue: ["a"],
      },
      {
        name: "reachable chain",
        input: "a@2 -> b gate2; b@3 -> c gate3",
        expected: "{'a','b','c'}",
        args: [{ a: 2, b: 3, c: 1 }, [["a", "b", 2], ["b", "c", 3]], "a"],
        expectedValue: ["a", "b", "c"],
      },
      {
        name: "cycle remains finite",
        input: "enabled a->b->c->a cycle",
        expected: "all three services exactly once",
        args: [{ a: 1, b: 1, c: 1 }, [["a", "b", 1], ["b", "c", 1], ["c", "a", 1]], "a"],
        expectedValue: ["a", "b", "c"],
        hidden: true,
      },
    ],
  },
  "maintenance-window-merge": {
    functionName: "merge_windows",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "touching windows merge",
        input: "[(0,10),(10,20)]",
        expected: "([(0,20)], 1)",
        args: [[[0, 10], [10, 20]]],
        expectedValue: [[[0, 20]], 1],
      },
      {
        name: "overlap counts concurrency",
        input: "[(0,10),(5,15),(20,25)]",
        expected: "([(0,15),(20,25)], 2)",
        args: [[[0, 10], [5, 15], [20, 25]]],
        expectedValue: [[[0, 15], [20, 25]], 2],
      },
      {
        name: "zero-length windows are dropped",
        input: "[(5,5),(1,2)]",
        expected: "([(1,2)], 1)",
        args: [[[5, 5], [1, 2]]],
        expectedValue: [[[1, 2]], 1],
        hidden: true,
      },
    ],
  },
  "cooldown-task-scheduler": {
    functionName: "schedule",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "cooldown forces interleave",
        input: "tasks=[('t1','A',9),('t2','A',8),('t3','B',1)], cooldown={'A':2,'B':0}",
        expected: "['t1', 't3', None, 't2']",
        args: [[["t1", "A", 9], ["t2", "A", 8], ["t3", "B", 1]], { A: 2, B: 0 }],
        expectedValue: ["t1", "t3", null, "t2"],
      },
      {
        name: "no cooldown uses priority",
        input: "tasks=[('a','X',1),('b','X',2)], cooldown={'X':0}",
        expected: "['b', 'a']",
        args: [[["a", "X", 1], ["b", "X", 2]], { X: 0 }],
        expectedValue: ["b", "a"],
      },
      {
        name: "empty schedule",
        input: "tasks=[]",
        expected: "[]",
        args: [[], {}],
        expectedValue: [],
        hidden: true,
      },
    ],
  },
  "account-merge-shared-emails": {
    functionName: "merge_accounts",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "transitive mixed contacts",
        input: "r1 shares email with r2 and phone with r3",
        expected: "one merged customer",
        args: [[
          ["r1", ["a@x"], ["111"]],
          ["r2", ["a@x"], []],
          ["r3", [], ["111"]],
        ]],
        expectedValue: [{ ids: ["r1", "r2", "r3"], emails: ["a@x"], phones: ["111"] }],
      },
      {
        name: "disjoint records remain separate",
        input: "r1 and r2 have unrelated emails",
        expected: "two customers ordered by id",
        args: [[
          ["r1", ["a@x"], []],
          ["r2", ["b@y"], []],
        ]],
        expectedValue: [
          { ids: ["r1"], emails: ["a@x"], phones: [] },
          { ids: ["r2"], emails: ["b@y"], phones: [] },
        ],
      },
      {
        name: "record without contacts is retained",
        input: "one contact-free record",
        expected: "one singleton customer",
        args: [[ ["solo", [], []] ]],
        expectedValue: [{ ids: ["solo"], emails: [], phones: [] }],
        hidden: true,
      },
    ],
  },
  "migration-batch-sizing": {
    functionName: "min_batch_size",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "simple capacity",
        input: "rows=[100,100], hours=1",
        expected: "4",
        args: [[100, 100], 1],
        expectedValue: 4,
      },
      {
        name: "single huge table",
        input: "rows=[10**9], hours=1",
        expected: "16666667",
        args: [[1_000_000_000], 1],
        expectedValue: 16_666_667,
      },
      {
        name: "impossible table count",
        input: "61 one-row tables in one hour",
        expected: "-1",
        args: [Array.from({ length: 61 }, () => 1), 1],
        expectedValue: -1,
        hidden: true,
      },
    ],
  },
  "logfmt-parser-spec": {
    functionName: "parse_logfmt",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "basic types",
        input: "a=1 b=2.5 c=true d=hello",
        expected: "typed values",
        args: ["a=1 b=2.5 c=true d=hello"],
        expectedValue: { a: 1, b: 2.5, c: true, d: "hello" },
      },
      {
        name: "quoted value",
        input: "msg=\"user logged in\" x=1",
        expected: "quoted string plus integer",
        args: ["msg=\"user logged in\" x=1"],
        expectedValue: { msg: "user logged in", x: 1 },
      },
      {
        name: "bare key",
        input: "cached level=info",
        expected: "cached=True, level='info'",
        args: ["cached level=info"],
        expectedValue: { cached: true, level: "info" },
        hidden: true,
      },
    ],
  },
  "feature-flag-evaluator-spec": {
    functionName: "evaluate",
    testHarnessType: "function_call",
    supportedLanguages: [...LANGUAGES],
    tests: [
      {
        name: "kill switch wins",
        input: "disabled flag with allowlisted user",
        expected: "False",
        args: [
          { key: "checkout", enabled: false, rules: [{ type: "allowlist", values: ["u1"] }], default: true },
          { user_id: "u1" },
        ],
        expectedValue: false,
      },
      {
        name: "allowlist enables",
        input: "enabled flag and allowlisted user",
        expected: "True",
        args: [
          { key: "checkout", enabled: true, rules: [{ type: "allowlist", values: ["u1"] }], default: false },
          { user_id: "u1" },
        ],
        expectedValue: true,
      },
      {
        name: "missing attribute falls through",
        input: "attribute rule has no matching context value",
        expected: "default False",
        args: [
          { key: "checkout", enabled: true, rules: [{ type: "attribute", attr: "plan", op: "eq", values: ["pro"] }], default: false },
          { user_id: "u2" },
        ],
        expectedValue: false,
        hidden: true,
      },
    ],
  },
};
