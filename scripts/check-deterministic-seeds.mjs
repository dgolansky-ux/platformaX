/**
 * Guard: dev/test seeds are deterministic and PII-safe.
 *
 * Rule: PX-SEED-001. Seed fixtures under shared/test-seeds and server/seeds must
 * use fixed IDs, contain no real PII (emails, phone numbers, secrets) and no
 * non-determinism (Math.random / Date.now / new Date).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SEED_DIRS = [
  join(ROOT, "shared/test-seeds"),
  join(ROOT, "server/seeds"),
];
const REQUIRED_SEED = join(ROOT, "shared/test-seeds/profile-seed.ts");

const PII_PATTERNS = [
  { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, label: "email address" },
  { re: /\+\d[\d\s-]{6,}\d/, label: "phone number" },
  { re: /\b\d{3}[\s-]\d{3}[\s-]\d{3}\b/, label: "phone number" },
  { re: /service_role|DATABASE_URL|BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{10,}/, label: "secret" },
  { re: /\bpassword\s*[:=]/i, label: "password literal" },
];

const NON_DETERMINISTIC = [
  { re: /\bMath\.random\s*\(/, label: "Math.random()" },
  { re: /\bDate\.now\s*\(/, label: "Date.now()" },
  { re: /\bnew\s+Date\s*\(/, label: "new Date()" },
];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|mjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

let violations = 0;
function fail(msg) {
  console.error(`SEED_VIOLATION: ${msg}`);
  violations++;
}

if (!existsSync(REQUIRED_SEED)) {
  fail("shared/test-seeds/profile-seed.ts does not exist");
}

const seedFiles = SEED_DIRS.flatMap(walk);
for (const fp of seedFiles) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  const code = stripComments(readFileSync(fp, "utf-8"));

  for (const { re, label } of PII_PATTERNS) {
    if (re.test(code)) fail(`${rel} contains likely ${label} — seeds must be PII-safe`);
  }
  for (const { re, label } of NON_DETERMINISTIC) {
    if (re.test(code)) fail(`${rel} uses ${label} — seeds must be deterministic`);
  }
  if (!/seed-[a-z0-9-]+/i.test(code)) {
    fail(`${rel} has no fixed "seed-*" identifiers — seeds must use stable IDs`);
  }
}

if (violations > 0) {
  console.error(`\ncheck-deterministic-seeds: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_DETERMINISTIC_SEEDS_PASS (${seedFiles.length} seed file(s) validated)`);
