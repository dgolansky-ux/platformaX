import { describe, it, expect } from "vitest";
// @ts-expect-error mjs export
import { detectIdempotencyMigration } from "../check-idempotency-flows.mjs";

const goodMigration = `
CREATE TABLE IF NOT EXISTS idempotency_keys (
  scope text NOT NULL,
  key text NOT NULL,
  status text NOT NULL
);
`;

const goodBundledMigration = `
CREATE TABLE outbox_messages (
  id uuid PRIMARY KEY
);

CREATE TABLE idempotency_keys (
  scope text NOT NULL,
  key text NOT NULL,
  status text NOT NULL,
  PRIMARY KEY (scope, key)
);
`;

const missingTable = `
-- just a comment about idempotency_keys
SELECT 1;
`;

describe("check-idempotency-flows: detectIdempotencyMigration", () => {
  it("PASS: detects migration that creates idempotency_keys", () => {
    const found = detectIdempotencyMigration(
      ["supabase/migrations/0099_idempotency.sql"],
      () => goodMigration,
    );
    expect(found).toBe("supabase/migrations/0099_idempotency.sql");
  });

  it("PASS: detects bundled migration (outbox + idempotency in one file)", () => {
    const found = detectIdempotencyMigration(
      ["supabase/migrations/0004_runtime_outbox_idempotency.sql"],
      () => goodBundledMigration,
    );
    expect(found).toBe("supabase/migrations/0004_runtime_outbox_idempotency.sql");
  });

  it("FAIL: file mentions idempotency_keys but has no CREATE TABLE", () => {
    const found = detectIdempotencyMigration(
      ["supabase/migrations/0099_x.sql"],
      () => missingTable,
    );
    expect(found).toBe(null);
  });

  it("FAIL: empty migration list", () => {
    const found = detectIdempotencyMigration([], () => "");
    expect(found).toBe(null);
  });

  it("PASS without .git: works on a file list produced by fs fallback", () => {
    // Simulates the scenario where git ls-files returned nothing and
    // listSourceFiles fell back to fs walk — the contents-based detection
    // does not depend on git at all.
    const fsFallbackFiles = [
      "supabase/migrations/0001_x.sql",
      "supabase/migrations/0004_runtime_outbox_idempotency.sql",
    ];
    const found = detectIdempotencyMigration(fsFallbackFiles, (f) =>
      f.endsWith("0004_runtime_outbox_idempotency.sql") ? goodBundledMigration : "-- nothing\n",
    );
    expect(found).toBe("supabase/migrations/0004_runtime_outbox_idempotency.sql");
  });
});
