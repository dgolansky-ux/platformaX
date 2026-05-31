#!/usr/bin/env node
/**
 * scripts/check-no-agent-bypass-language.mjs — guard against agents
 * planting allowlist / bypass markers in arbitrary files to mask
 * fake-DONE, skip gates, or register hidden exceptions.
 *
 * Rule IDs:
 *   - PX-GOV-002 (No weakened guards)
 *   - PX-GOV-005 (No governance drift)
 *
 * What it catches:
 *
 *  1. The `ALLOW_STATUS_TERM_IN_POLICY_DOC` file-scope marker consumed
 *     by `check-fake-done.mjs`. It is allowed ONLY in this script's
 *     explicit allowlist (governance/AI policy docs that legitimately
 *     enumerate restricted status terms, plus the guard's own source
 *     and tests). Audit reports under `docs/review/governance-v2/**`
 *     are allowed because they quote the marker as text, never apply
 *     it; they must be plain markdown files.
 *
 *  2. Generic bypass phrases ("temporary bypass", "TEMPORARY_BYPASS",
 *     "ALLOW_BYPASS", "skip guard", "skip the gate", "disable guard",
 *     "bypass the gate", "bypass gates", "skip verify:deep") — these
 *     suggest an agent is rationalising a gate skip without using the
 *     mandatory BLOCKED status. Allowed only inside governance / AI /
 *     architecture policy docs that explicitly FORBID them, and inside
 *     this guard's own source.
 *
 *  3. Fake exception markers — `PLATFORMAX_EXCEPTION` blocks present
 *     in source files whose path is NOT registered in
 *     `EXCEPTIONS_REGISTER.md` (overlaps with
 *     `check-inline-exceptions-registered.mjs`; we re-verify here so a
 *     newly planted marker fails fast on this guard too).
 *
 * Failure mode: exits 1, prints `AGENT_BYPASS_LANGUAGE_VIOLATION:` per
 * finding. Fails closed.
 *
 * Coverage gaps documented:
 *   - The guard does not yet parse markdown code fences. A governance
 *     audit report that quotes the marker on a normal line WILL pass
 *     because the report path itself is in the audit allowlist. The
 *     tighter "literal usage vs quoted reference" distinction is a
 *     P1 follow-up.
 *   - The guard cannot prove that a fake exception marker would have
 *     bypassed a real rule — it only proves the marker exists outside
 *     a registered path. `check-inline-exceptions-registered.mjs`
 *     continues to own the register-level cross-check.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();

const SCAN_DIRS = ["docs", "client", "server", "shared", "scripts", "tests"];
const SCAN_FILES = ["package.json", "README.md"];

// Paths skipped entirely (fixture dirs are planted violations by design).
const SKIP_PREFIXES = [
  "tests/architecture/fixtures/",
];

// === ALLOW_STATUS_TERM_IN_POLICY_DOC marker allowlist ====================
// File paths (POSIX, repo-relative) where the marker may legitimately
// appear in the file content. Anything else is a violation.
const ALLOWED_STATUS_MARKER_PATHS = new Set([
  "scripts/check-fake-done.mjs",
  "scripts/check-no-agent-bypass-language.mjs",
  "scripts/__tests__/status-truth.test.ts",
  "docs/governance/STATUS_TAXONOMY.md",
  "docs/governance/AGENT_COMMAND_STANDARD.md",
  "docs/governance/RULES_REGISTRY.yml",
  "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md",
  "docs/architecture/PlatformaX-V2-domain-status.md",
  "docs/architecture/PlatformaX-V2-coding-standards.md",
  "docs/architecture/PlatformaX-V2-active-rules.md",
  "docs/architecture/BRAMKA.md",
  "docs/ai/AI_FORBIDDEN_ACTIONS.md",
  "docs/templates/CHANGE_REPORT_TEMPLATE.md",
  "docs/templates/PRE_COMMIT_DECISION.md",
]);

// Governance audit reports may quote the marker verbatim. They live
// only here.
const ALLOWED_STATUS_MARKER_DIR_PREFIXES = [
  "docs/review/governance-v2/",
  "docs/review/foundation-v2/",
  "docs/review/step-",
];

const STATUS_MARKER = "ALLOW_STATUS_TERM_IN_POLICY_DOC";

// === Generic bypass language =============================================
const BYPASS_PATTERNS = [
  { pattern: /TEMPORARY_BYPASS/g,        kind: "temporary-bypass-marker" },
  { pattern: /ALLOW_BYPASS/g,            kind: "generic-bypass-marker" },
  { pattern: /\btemporary bypass\b/gi,   kind: "temporary-bypass-phrase" },
  { pattern: /\bbypass(?:es|ed|ing)? (?:the )?gate(?:s)?\b/gi, kind: "bypass-gate-phrase" },
  { pattern: /\bskip(?:ping)? (?:the )?gate(?:s)?\b/gi,        kind: "skip-gate-phrase" },
  { pattern: /\bskip(?:ping)? (?:the )?guard(?:s)?\b/gi,       kind: "skip-guard-phrase" },
  { pattern: /\bdisable(?:d|s)? (?:the )?guard(?:s)?\b/gi,     kind: "disable-guard-phrase" },
  { pattern: /\bskip verify:deep\b/gi,                          kind: "skip-deep-phrase" },
  { pattern: /\bskip\s+verify-deep\b/gi,                        kind: "skip-deep-phrase" },
];

// Files allowed to MENTION bypass language — governance/AI policy docs
// that enumerate forbidden phrases, and this guard's own source.
const BYPASS_LANGUAGE_ALLOWED_PREFIXES = [
  "docs/governance/",
  "docs/ai/",
  "docs/architecture/",
  "docs/templates/",
  "docs/security/",
  "docs/review/governance-v2/",
  "docs/review/foundation-v2/",
  "docs/review/tooling-spike/",
  "scripts/check-no-agent-bypass-language.mjs",
  "scripts/check-fake-done.mjs",
  "scripts/check-ai-agent-permissions.mjs",
  "scripts/check-script-safety.mjs",
  "scripts/check-inline-exceptions-registered.mjs",
  "scripts/__tests__/",
  "tests/architecture/",
];

// === Fake exception marker cross-check ===================================
const EXCEPTION_MARKER_RE = /PLATFORMAX_EXCEPTION/g;
const REGISTER_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

// === Helpers =============================================================
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (["node_modules", "dist", "build", ".git", "coverage", ".cache", "audit-out"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function toPosix(p) {
  return p.split(sep).join("/");
}

function isUnder(prefix, rel) {
  return rel === prefix || rel.startsWith(prefix.endsWith("/") ? prefix : prefix + "/") || rel.startsWith(prefix);
}

function readExceptionRegisterPaths() {
  if (!existsSync(REGISTER_PATH)) return new Set();
  const content = readFileSync(REGISTER_PATH, "utf-8");
  const paths = new Set();
  // Last column of each active row is a space-separated file list.
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith("| EXC-")) continue;
    if (!/\| active \|/.test(line)) continue;
    const cols = line.split("|").map(s => s.trim());
    const files = cols[cols.length - 2] || "";
    for (const f of files.split(/\s+/)) {
      if (f && !f.includes("|")) paths.add(toPosix(f));
    }
  }
  return paths;
}

// === Main ================================================================
let violations = 0;
const reportLines = [];
const allFiles = [];
for (const d of SCAN_DIRS) allFiles.push(...walk(join(ROOT, d)));
for (const f of SCAN_FILES) {
  const fp = join(ROOT, f);
  if (existsSync(fp)) allFiles.push(fp);
}

const registeredExceptionPaths = readExceptionRegisterPaths();

for (const fp of allFiles) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = toPosix(relative(ROOT, fp));
  if (SKIP_PREFIXES.some(p => rel.startsWith(p))) continue;

  // (1) ALLOW_STATUS_TERM_IN_POLICY_DOC marker
  if (content.includes(STATUS_MARKER)) {
    const allowedExact = ALLOWED_STATUS_MARKER_PATHS.has(rel);
    const allowedDir = ALLOWED_STATUS_MARKER_DIR_PREFIXES.some(p => rel.startsWith(p));
    if (!allowedExact && !allowedDir) {
      reportLines.push(`AGENT_BYPASS_LANGUAGE_VIOLATION: ${STATUS_MARKER} found in unregistered file: ${rel}`);
      violations += 1;
    }
  }

  // (2) Bypass language
  const allowedForBypass = BYPASS_LANGUAGE_ALLOWED_PREFIXES.some(p =>
    rel === p || rel.startsWith(p),
  );
  if (!allowedForBypass) {
    for (const { pattern, kind } of BYPASS_PATTERNS) {
      pattern.lastIndex = 0;
      const m = pattern.exec(content);
      if (m) {
        reportLines.push(`AGENT_BYPASS_LANGUAGE_VIOLATION: ${kind} ("${m[0]}") found outside policy docs: ${rel}`);
        violations += 1;
      }
    }
  }

  // (3) Fake PLATFORMAX_EXCEPTION markers in unregistered files. Only
  //     scan code files; skip the register itself and this guard.
  if (rel === "docs/governance/EXCEPTIONS_REGISTER.md") continue;
  if (rel === "scripts/check-no-agent-bypass-language.mjs") continue;
  if (rel === "scripts/check-inline-exceptions-registered.mjs") continue;
  EXCEPTION_MARKER_RE.lastIndex = 0;
  if (EXCEPTION_MARKER_RE.test(content)) {
    if (!rel.endsWith(".ts") && !rel.endsWith(".tsx") && !rel.endsWith(".css") && !rel.endsWith(".mjs") && !rel.endsWith(".js")) continue;
    if (!registeredExceptionPaths.has(rel)) {
      reportLines.push(`AGENT_BYPASS_LANGUAGE_VIOLATION: PLATFORMAX_EXCEPTION marker in file not registered in EXCEPTIONS_REGISTER: ${rel}`);
      violations += 1;
    }
  }
}

for (const line of reportLines) console.error(line);

if (violations > 0) {
  console.error(`\ncheck-no-agent-bypass-language: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_NO_AGENT_BYPASS_LANGUAGE_PASS");
