// PX-SEED-001 / PX-OBS-003 / PX-ID-001 — no unsafe randomness.
//
// `Math.random()` is not cryptographically secure and must not appear in
// runtime code paths that generate ids, correlation keys, idempotency keys,
// tokens or any other security/identity-sensitive value.
//
// This guard scans:
//   - shared/contracts/*.ts
//   - server/**/*.ts (excluding __tests__, scripts/, seeds/, fixtures)
//   - client/src/**/*.ts(x) (excluding __tests__, fixtures, tests)
//
// Allowlist (file or line):
//   - `__tests__/`, `*.test.ts(x)` — tests may stub randomness.
//   - lines tagged `// allow: Math.random — <reason>` are tolerated; reason
//     is required and must be non-empty.
//   - `scripts/` (guard logic / governance tooling) is excluded.

import { readFileSync } from "node:fs";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

function listFiles() {
  return listSourceFiles({
    cwd: ROOT,
    roots: ["."],
    extensions: [".ts", ".tsx"],
  });
}

function isInScope(file) {
  if (!/\.(ts|tsx)$/.test(file)) return false;
  if (file.startsWith("scripts/")) return false;
  if (/__tests__\//.test(file)) return false;
  if (/\.test\.(ts|tsx)$/.test(file)) return false;
  if (/\bfixtures?\b/.test(file)) return false;
  if (/\bseeds?\b/.test(file)) return false;
  if (file.endsWith(".d.ts")) return false;
  if (
    file.startsWith("shared/contracts/") ||
    file.startsWith("server/") ||
    file.startsWith("client/src/")
  ) {
    return true;
  }
  return false;
}

const violations = [];
const ALLOW_TAG = /\/\/\s*allow:\s*math\.random\s*[—-]\s*\S/i;

for (const file of listFiles()) {
  if (!isInScope(file)) continue;
  let src;
  try {
    src = readFileSync(file, "utf-8");
  } catch {
    continue;
  }
  if (!/Math\.random\b/.test(src)) continue;

  // Strip block comments globally (preserving newline positions) and strip
  // line comments per line, so JSDoc references to "Math.random" don't
  // false-positive.
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, " "),
  );
  const lines = stripped.split(/\r?\n/);
  const rawLines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeIdx = line.indexOf("//");
    const code = codeIdx >= 0 ? line.slice(0, codeIdx) : line;
    if (!/Math\.random\b/.test(code)) continue;
    if (ALLOW_TAG.test(rawLines[i] ?? "")) continue;
    violations.push(`${file}:${i + 1}: Math.random() in runtime code path — use createUuid()/getRandomValues()`);
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`UNSAFE_RANDOMNESS_VIOLATION: ${v}`);
  console.error(`\ncheck-no-unsafe-randomness: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_NO_UNSAFE_RANDOMNESS_PASS");
