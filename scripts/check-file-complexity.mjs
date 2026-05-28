import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const SCAN_DIRS = ["client/src", "server", "shared", "scripts"];
const EXCEPTIONS_REGISTER = existsSync(join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md"))
  ? readFileSync(join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md"), "utf-8")
  : "";

const LIMITS = [
  { type: "route/page", pattern: /(?:Page|Route|Flow)\.tsx$|\/(page|route|layout)\.(tsx|ts)$/, limit: 280 },
  { type: "regular tsx", pattern: /\.tsx$/, limit: 220 },
  { type: "service", pattern: /service\.(ts|js)$/, limit: 240 },
  { type: "repository", pattern: /repository\.(ts|js)$/, limit: 240 },
  { type: "mapper", pattern: /mapper\.(ts|js)$/, limit: 240 },
  { type: "policy", pattern: /policy\.(ts|js)$/, limit: 240 },
  { type: "test", pattern: /\.test\.(ts|tsx|js|jsx|mjs)$/, limit: 1000 },
  { type: "script", pattern: /scripts\/.*(check|validate).*\.(mjs|js|ts)$/, limit: 500 },
];

const DEPRECATED_EXCEPTION_MARKERS = [
  "ALLOW_FILE_SIZE_EXCEPTION",
  "QUALITY_STRUCTURE_EXCEPTION",
  "COMPLEXITY_EXCEPTION",
];
const ESLINT_DISABLE_PATTERN = /eslint-disable.*max-lines/;
const CANONICAL_EXCEPTION_FIELDS = [
  "PLATFORMAX_EXCEPTION:",
  "Rule:",
  "Scope:",
  "Reason:",
  "Risk:",
  "Owner:",
  "Expiry:",
  "Removal plan:",
  "Evidence:",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function hasCanonicalException(content) {
  return CANONICAL_EXCEPTION_FIELDS.every((field) => content.includes(field));
}

function hasDeprecatedExceptionMarker(content) {
  return DEPRECATED_EXCEPTION_MARKERS.some((marker) => content.includes(marker));
}

function hasRegisteredException(rel) {
  return EXCEPTIONS_REGISTER.includes(rel);
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }

    const hasDeprecatedMarker = hasDeprecatedExceptionMarker(content);
    const hasCanonicalBlock = hasCanonicalException(content);
    if ((hasDeprecatedMarker || ESLINT_DISABLE_PATTERN.test(content)) && !hasCanonicalBlock && !hasRegisteredException(rel)) {
      console.error(`COMPLEXITY_VIOLATION: ${rel} uses deprecated exception marker or eslint max-lines disable without PLATFORMAX_EXCEPTION block or EXCEPTIONS_REGISTER entry`);
      violations++;
      continue;
    }
    if (hasDeprecatedMarker || hasCanonicalBlock) continue;

    const lineCount = content.split("\n").length;
    const rule = LIMITS.find(({ pattern }) => pattern.test(rel));
    if (rule && lineCount > rule.limit) {
      console.error(`COMPLEXITY_VIOLATION: ${rel} has ${lineCount} lines (${rule.type} limit: ${rule.limit})`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-file-complexity: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_FILE_COMPLEXITY_PASS");
