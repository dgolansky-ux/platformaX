import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const BLOCKED_PATTERNS = [
  'dotenv.config({ path: ".env" })',
  'dotenv.config({ path: ".env"',
  'dotenvConfig({ path: resolve(process.cwd(), ".env") })',
  "process.env.DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const TEST_FILE_PATTERNS = [
  /test-setup\.(ts|js)$/,
  /vitest\.config/,
  /jest\.config/,
];

function isTestFile(name) {
  return TEST_FILE_PATTERNS.some(p => p.test(name));
}

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const envTestExample = join(ROOT, ".env.test.example");
if (!existsSync(envTestExample)) {
  console.error("TEST_ENV_SAFETY_VIOLATION: .env.test.example missing");
  process.exit(1);
}

let violations = 0;
const allFiles = walk(ROOT);
const testFiles = allFiles.filter(f => isTestFile(f));

for (const fp of testFiles) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = relative(ROOT, fp).replace(/\\/g, "/");

  for (const pattern of BLOCKED_PATTERNS) {
    if (content.includes(pattern)) {
      console.error(`TEST_ENV_VIOLATION: "${pattern}" in ${rel}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-test-env-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_TEST_ENV_SAFETY_PASS");
