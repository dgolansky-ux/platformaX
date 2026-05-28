// PX-ARCH-003 / PX-ARCH-004 — public-api surface guard
//
// public-api.ts must NOT re-export from forbidden modules:
//   ./internal/*, ../internal/*, ./mapper, ./schema, ./db, ./router,
//   ./cache-keys, or raw record types.
//
// Allowed re-exports (explicit allowlist):
//   ./service               (service factory + types)
//   ./repository            (repository interface + in-memory factory)
//   ./dto                   (public DTO types)
//   ./private-dto           (owner-only DTO type, stable location, not /internal/)
//   ./contracts             (input/result/error types)
//   ./events                (typed events)
//   ./policy                (pure policy functions)
//   ./validation-limits     (stable public limits — moved out of /internal/)
//
// Works on multi-line `export { ... } from "./..."` statements.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

const ALLOWED_SOURCES = new Set([
  "./service",
  "./repository",
  "./dto",
  "./private-dto",
  "./contracts",
  "./events",
  "./policy",
  "./validation-limits",
]);

const FORBIDDEN_PATTERNS = [
  /^\.\/internal(\/|$)/,
  /^\.\.\/internal(\/|$)/,
  /^\.\/mapper$/,
  /^\.\/schema$/,
  /^\.\/db(\/|$)/,
  /^\.\/router$/,
  /^\.\/cache-keys$/,
  /^\.\/record$/,
];

function listPublicApiFiles() {
  return listSourceFiles({
    cwd: ROOT,
    roots: ["server/domains-v2"],
    extensions: [".ts"],
  }).filter((p) => p.endsWith("/public-api.ts"));
}

const STMT_RE = /export\s*(?:\*|type\s*\*|\{[\s\S]*?\}|type\s*\{[\s\S]*?\})\s*from\s*["']([^"']+)["']/g;

const violations = [];

for (const file of listPublicApiFiles()) {
  const abs = join(ROOT, file);
  const src = readFileSync(abs, "utf-8");
  // Strip line comments and block comments to avoid false positives in examples
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  let m;
  while ((m = STMT_RE.exec(cleaned)) !== null) {
    const source = m[1];

    // Check forbidden patterns first
    let forbidden = false;
    for (const p of FORBIDDEN_PATTERNS) {
      if (p.test(source)) {
        violations.push(`${file}: forbidden re-export from "${source}"`);
        forbidden = true;
        break;
      }
    }
    if (forbidden) continue;

    // Anything outside allowlist that points to a relative file is also forbidden
    if (source.startsWith(".")) {
      if (!ALLOWED_SOURCES.has(source)) {
        violations.push(`${file}: re-export from non-allowlisted relative source "${source}" (allowed: ${[...ALLOWED_SOURCES].join(", ")})`);
      }
    }
    // Non-relative imports (e.g. @shared/contracts/...) are allowed as public boundary.
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`PUBLIC_API_SURFACE_VIOLATION: ${v}`);
  console.error(`\ncheck-public-api-surface: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PUBLIC_API_SURFACE_PASS");

export { STMT_RE, ALLOWED_SOURCES, FORBIDDEN_PATTERNS };

// Programmatic API for tests
export function scanSourceForViolations(src) {
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const found = [];
  const re = new RegExp(STMT_RE.source, "g");
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const source = m[1];
    let forbidden = false;
    for (const p of FORBIDDEN_PATTERNS) {
      if (p.test(source)) {
        found.push({ source, reason: "forbidden-pattern" });
        forbidden = true;
        break;
      }
    }
    if (forbidden) continue;
    if (source.startsWith(".") && !ALLOWED_SOURCES.has(source)) {
      found.push({ source, reason: "not-allowlisted" });
    }
  }
  return found;
}
