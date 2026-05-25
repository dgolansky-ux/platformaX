import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCRIPTS_DIR = join(ROOT, "scripts");

const BLOCKED_IN_SCRIPTS = [
  { pattern: /process\.exit\(\d+\)/, allowed: true },
  { pattern: /child_process.*exec\b(?!Sync)/, label: "async exec (use execSync for predictability)" },
  { pattern: /eval\s*\(/, label: "eval() usage" },
  { pattern: /Function\s*\(/, label: "Function() constructor" },
  { pattern: /require\s*\(\s*['"`]\s*\$/, label: "dynamic require" },
  { pattern: /rm\s+-rf\s+\//, label: "dangerous rm -rf /" },
  { pattern: /DROP\s+DATABASE/i, label: "DROP DATABASE in script" },
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...walk(full));
    } else {
      if (/\.(mjs|js|ts)$/.test(entry.name)) results.push(full);
    }
  }
  return results;
}

const SELF_FILES = new Set([
  "scripts/check-script-safety.mjs",
  "scripts/check-local-secret-scan.mjs",
  "scripts/check-no-legacy-imports.mjs",
  "scripts/check-removed-product-areas.mjs",
  "scripts/check-diff-safety.mjs",
]);

let violations = 0;
const files = walk(SCRIPTS_DIR);

for (const fp of files) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = relative(ROOT, fp).replace(/\\/g, "/");

  if (SELF_FILES.has(rel)) continue;

  for (const rule of BLOCKED_IN_SCRIPTS) {
    if (rule.allowed) continue;
    if (rule.pattern.test(content)) {
      console.error(`SCRIPT_SAFETY_VIOLATION: ${rule.label} in ${rel}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-script-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SCRIPT_SAFETY_PASS");
