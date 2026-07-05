import { describe, expect, it } from "vitest";
import { runSqlPlanTests, type SqlPlanTest } from "./sql-plan-runner";

const usersSetup = `
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT);
INSERT INTO users VALUES (1,'a@x.com','A'),(2,'b@x.com','B'),(3,'c@x.com','C');
`;

const loginTest: SqlPlanTest = {
  name: "email lookup uses an index",
  setup: usersSetup,
  query: "SELECT id, name FROM users WHERE email = 'b@x.com'",
  assert: { usesIndex: true, forbidFullScanOf: ["users"], resultEquals: [[2, "B"]] },
};

const ordersSetup = `
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, status TEXT, created_at INTEGER, total INTEGER);
INSERT INTO orders VALUES
 (1,7,'shipped',100,50),(2,7,'pending',101,60),(3,7,'shipped',102,70),
 (4,8,'shipped',103,80),(5,7,'shipped',104,90),(6,7,'cancelled',105,10);
`;

const compositeTest: SqlPlanTest = {
  name: "composite index serves filter and order",
  setup: ordersSetup,
  query:
    "SELECT id, total FROM orders WHERE customer_id = 7 AND status = 'shipped' ORDER BY created_at DESC LIMIT 2",
  assert: { usesIndex: true, noTempSort: true, forbidFullScanOf: ["orders"], resultEquals: [[5, 90], [3, 70]] },
};

describe("runSqlPlanTests", () => {
  it("fails when no index exists (full table scan)", async () => {
    const [result] = await runSqlPlanTests({ candidateSql: "", tests: [loginTest] });
    expect(result.passed).toBe(false);
    expect(result.error).toContain("index");
  });

  it("passes when the candidate adds the right single-column index", async () => {
    const [result] = await runSqlPlanTests({
      candidateSql: "CREATE INDEX idx_users_email ON users(email);",
      tests: [loginTest],
    });
    expect(result.passed).toBe(true);
    expect(result.stdout).toContain("USING INDEX");
  });

  it("rejects a single-column index that still needs a temp sort", async () => {
    const [result] = await runSqlPlanTests({
      candidateSql: "CREATE INDEX idx_o_cust ON orders(customer_id);",
      tests: [compositeTest],
    });
    expect(result.passed).toBe(false);
    expect(result.error).toContain("temp B-tree");
  });

  it("passes the composite index that provides both filter and order", async () => {
    const [result] = await runSqlPlanTests({
      candidateSql: "CREATE INDEX idx_o_cs_created ON orders(customer_id, status, created_at);",
      tests: [compositeTest],
    });
    expect(result.passed).toBe(true);
  });

  it("detects a covering (index-only) read", async () => {
    const setup = `
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, notes TEXT);
      INSERT INTO orders VALUES (1,7,50,'x'),(2,7,70,'y'),(3,8,90,'z');
    `;
    const test: SqlPlanTest = {
      name: "covering index",
      setup,
      query: "SELECT total FROM orders WHERE customer_id = 7",
      assert: { covering: true },
    };
    const nonCovering = await runSqlPlanTests({
      candidateSql: "CREATE INDEX idx_o_cust ON orders(customer_id);",
      tests: [test],
    });
    expect(nonCovering[0].passed).toBe(false);

    const covering = await runSqlPlanTests({
      candidateSql: "CREATE INDEX idx_o_cust_total ON orders(customer_id, total);",
      tests: [test],
    });
    expect(covering[0].passed).toBe(true);
  });
});
