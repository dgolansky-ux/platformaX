// PX-IDEMPOTENCY-001 — idempotency flow skeleton guard.
//
// Structural skeleton check. Full live wiring stays manual_gate.
//
// Required:
//   1. shared/contracts/idempotency.ts exists and exposes createIdempotencyKey.
//   2. server/application-v2/runtime/idempotency.ts exists with a repository
//      interface and an in-memory adapter (skeleton).
//   3. supabase/migrations contains a migration that CREATEs the
//      `idempotency_keys` table with `key`, `scope`, `status` columns.
//      Detection is by file content, not filename, so e.g.
//      `0004_runtime_outbox_idempotency.sql` (which bundles outbox +
//      idempotency) counts as a valid candidate.
//   4. shared/contracts/ids.ts declares IdempotencyKey as a Brand<>.
//   5. shared/contracts/idempotency.ts does NOT use Math.random.
//
// Robustness: file enumeration uses scripts/lib/list-source-files.mjs, so
// the guard fails closed even when run outside a git working tree (audit
// ZIPs, fresh clones).

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

const SHARED_PATH = join(ROOT, "shared/contracts/idempotency.ts");
const RUNTIME_PATH = join(ROOT, "server/application-v2/runtime/idempotency.ts");
const IDS_PATH = join(ROOT, "shared/contracts/ids.ts");

export function detectIdempotencyMigration(files, readFile) {
  for (const file of files) {
    if (!file.startsWith("supabase/migrations/")) continue;
    if (!file.endsWith(".sql")) continue;
    let src;
    try {
      src = readFile(file);
    } catch {
      continue;
    }
    if (!/idempotency_keys/i.test(src)) continue;
    if (!/CREATE\s+TABLE/i.test(src)) continue;
    // Require the columns we depend on. Robust to ordering / formatting.
    if (!/\bkey\b/i.test(src)) continue;
    if (!/\bscope\b/i.test(src)) continue;
    if (!/\bstatus\b/i.test(src)) continue;
    return file;
  }
  return null;
}

function main() {
  const violations = [];

  if (!existsSync(SHARED_PATH)) {
    violations.push("shared/contracts/idempotency.ts is missing");
  } else {
    const src = readFileSync(SHARED_PATH, "utf-8");
    if (!/createIdempotencyKey/.test(src)) {
      violations.push("shared/contracts/idempotency.ts: missing createIdempotencyKey export");
    }
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    if (/Math\.random\b/.test(codeOnly)) {
      violations.push("shared/contracts/idempotency.ts: uses Math.random — must use createUuid()");
    }
  }

  if (!existsSync(RUNTIME_PATH)) {
    violations.push("server/application-v2/runtime/idempotency.ts is missing (skeleton required)");
  }

  if (existsSync(IDS_PATH)) {
    const ids = readFileSync(IDS_PATH, "utf-8");
    if (!/IdempotencyKey\s*=\s*Brand</.test(ids)) {
      violations.push("shared/contracts/ids.ts: IdempotencyKey is not declared as Brand<>");
    }
  } else {
    violations.push("shared/contracts/ids.ts is missing");
  }

  const migrationFiles = listSourceFiles({
    cwd: ROOT,
    roots: ["supabase/migrations"],
    extensions: [".sql"],
  });
  const migration = detectIdempotencyMigration(migrationFiles, (file) =>
    readFileSync(join(ROOT, file), "utf-8"),
  );
  if (!migration) {
    violations.push(
      "supabase/migrations: no migration found that CREATEs `idempotency_keys` with key/scope/status columns",
    );
  }

  if (violations.length > 0) {
    for (const v of violations) console.error(`IDEMPOTENCY_FLOWS_VIOLATION: ${v}`);
    console.error(`\ncheck-idempotency-flows: ${violations.length} violation(s)`);
    process.exit(1);
  }

  console.log("CHECK_IDEMPOTENCY_FLOWS_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
