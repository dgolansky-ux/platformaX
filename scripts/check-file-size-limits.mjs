import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

/**
 * File-size guard for stylesheets.
 *
 * The existing scripts/check-file-complexity.mjs already enforces size limits for
 * .ts/.tsx/service/repository/test/scripts per coding-standards §6. CSS files were
 * NOT covered — a single 998-line profile.module.css slipped through. This guard
 * closes that gap: it fails the build (not warn-only) when a stylesheet exceeds
 * its limit, forcing CSS to be split into focused modules.
 *
 * Limits (hard, fail-closed):
 *   - *.module.css  : 320 lines
 *   - *.css (global): 500 lines
 *
 * Escape hatch: use a full PLATFORMAX_EXCEPTION block. Deprecated markers such
 * as ALLOW_FILE_SIZE_EXCEPTION require the canonical block or an
 * EXCEPTIONS_REGISTER entry.
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["client/src", "server", "shared"];
const EXCEPTIONS_REGISTER = existsSync(join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md"))
  ? readFileSync(join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md"), "utf-8")
  : "";
const DEPRECATED_EXCEPTION_MARKERS = [
  "ALLOW_FILE_SIZE_EXCEPTION",
  "QUALITY_STRUCTURE_EXCEPTION",
  "COMPLEXITY_EXCEPTION",
];
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

const LIMITS = [
  { label: "CSS module", test: (rel) => rel.endsWith(".module.css"), limit: 320 },
  {
    label: "global CSS",
    test: (rel) => rel.endsWith(".css") && !rel.endsWith(".module.css"),
    limit: 500,
  },
];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
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
  for (const fp of walk(join(ROOT, scanDir))) {
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    const rule = LIMITS.find((l) => l.test(rel));
    if (!rule) continue;

    let content;
    try {
      content = readFileSync(fp, "utf-8");
    } catch {
      continue;
    }
    const hasDeprecatedMarker = hasDeprecatedExceptionMarker(content);
    const hasCanonicalBlock = hasCanonicalException(content);
    if (hasDeprecatedMarker && !hasCanonicalBlock && !hasRegisteredException(rel)) {
      console.error(
        `FILE_SIZE_VIOLATION: ${rel} uses deprecated exception marker without PLATFORMAX_EXCEPTION block or EXCEPTIONS_REGISTER entry`,
      );
      violations++;
      continue;
    }
    if (hasDeprecatedMarker || hasCanonicalBlock) continue;

    const lineCount = content.split("\n").length;
    if (lineCount > rule.limit) {
      console.error(
        `FILE_SIZE_VIOLATION: ${rel} has ${lineCount} lines (${rule.label} limit: ${rule.limit})`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-file-size-limits: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_FILE_SIZE_LIMITS_PASS");
