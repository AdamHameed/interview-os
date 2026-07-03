import { describe, expect, it } from "vitest";
import { runLocalTests } from "./local-runner";

describe("runLocalTests", () => {
  it("runs a Python function call", async () => {
    const [result] = await runLocalTests({
      language: "python",
      code: "def solve(a, b):\n    return a + b\n",
      functionName: "solve",
      tests: [{ name: "sum", args: [2, 3], expectedValue: 5 }],
    });

    expect(result.passed).toBe(true);
    expect(result.actual).toBe(5);
  });

  it("captures JavaScript output without corrupting the runner protocol", async () => {
    const [result] = await runLocalTests({
      language: "javascript",
      code: "function solve(value) { console.log('seen', value); return { value }; }",
      functionName: "solve",
      tests: [{ name: "object", args: [7], expectedValue: { value: 7 } }],
    });

    expect(result.passed).toBe(true);
    expect(result.stdout).toContain("seen 7");
  });

  it("transpiles TypeScript submissions", async () => {
    const [result] = await runLocalTests({
      language: "typescript",
      code: "export function solve(values: number[]): number { return values.reduce((a, b) => a + b, 0); }",
      functionName: "solve",
      tests: [{ name: "typed sum", args: [[1, 2, 3]], expectedValue: 6 }],
    });

    expect(result.passed).toBe(true);
  });

  it("terminates a test that exceeds the local timeout", async () => {
    const [result] = await runLocalTests({
      language: "javascript",
      code: "function solve() { while (true) {} }",
      functionName: "solve",
      tests: [{ name: "timeout", args: [], expectedValue: null }],
    });

    expect(result.passed).toBe(false);
    expect(result.error).toContain("Timed out after 3000 ms");
  }, 8_000);
});
