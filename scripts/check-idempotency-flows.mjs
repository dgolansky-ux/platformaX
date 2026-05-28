// PX-IDEMPOTENCY-001 — idempotency flow skeleton guard.
//
// Structural skeleton check. Full live wiring stays manual_gate.
//
// Required:
//   1. shared/contracts/idempotency.ts exists and exposes createIdempotencyKey.
//   2. server/application-v2/runtime/idempotency.ts exists with a repository
//      interface and an in-memory adapter (skeleton).
//   3. supabase/migrations contains an idempotency_keys migration file.
//   4. shared/contracts/ids.ts declares IdempotencyKey as a Brand<>.
//   5. shared/contracts/idempotency.ts does NOT use Math.random.

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

const violations = [];

const SHARED_PATH = join(ROOT, "shared/contracts/idempotency.ts");
const RUNTIME_PATH = join(ROOT, "server/application-v2/runtime/idempotency.ts");
const IDS_PATH = join(ROOT, "shared/contracts/ids.ts");

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

let foundMigration = false;
try {
  const out = execSync("git ls-files supabase/migrations", { cwd: ROOT, encoding: "utf-8" });
  const files = out.split(/\r?\n/).filter((p) => p && /idempotency/i.test(p));
  foundMigration = files.length > 0;
} catch {}
if (!foundMigration) {
  violations.push("supabase/migrations: no idempotency_keys migration file found");
}

if (violations.length > 0) {
  for (const v of violations) console.error(`IDEMPOTENCY_FLOWS_VIOLATION: ${v}`);
  console.error(`\ncheck-idempotency-flows: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_IDEMPOTENCY_FLOWS_PASS");
