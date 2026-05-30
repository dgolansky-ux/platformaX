#!/usr/bin/env node
/**
 * scripts/audit/create-full-audit-zip.mjs
 *
 * Slice 21 — full audit ZIP of the whole platform, ready for the global
 * A–Z external audit. Bundles all source / docs / scripts / tests / configs
 * — EXCLUDES .git, node_modules, dist, .env, .env.*, secrets, the local
 * .claude/settings.local.json, and any other local-only artefacts.
 *
 * Writes ZIP + manifest to ./ZIPY/ AND copies them to
 * C:\\Users\\dgola\\Desktop\\ZIPY\\ (Dawid's audit drop preference).
 */
import AdmZip from "adm-zip";
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";

const REPO_ROOT = process.cwd();
const ZIP_DIR = join(REPO_ROOT, "ZIPY");
const DESKTOP_ZIP_DIR = "C:\\Users\\dgola\\Desktop\\ZIPY";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

ensureDir(ZIP_DIR);
ensureDir(DESKTOP_ZIP_DIR);

const branch = sh("git rev-parse --abbrev-ref HEAD");
const sha = sh("git rev-parse HEAD");
const shortSha = sha.slice(0, 7);
const gitStatusShort = sh("git status --short");
const dirty = gitStatusShort.length > 0;

const ZIP_NAME = `PlatformaX_V2_FULL_AUDIT_AFTER_SLICE_21_${shortSha}.zip`;
const MANIFEST_NAME = `PlatformaX_V2_FULL_AUDIT_AFTER_SLICE_21_${shortSha}_MANIFEST.json`;
const ZIP_PATH = join(ZIP_DIR, ZIP_NAME);
const MANIFEST_PATH = join(ZIP_DIR, MANIFEST_NAME);

const INCLUDE_TOP_LEVEL_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "vite-env.d.ts",
  "vitest.config.ts",
  "eslint.config.js",
  "knip.json",
  "commitlint.config.mjs",
  ".dependency-cruiser.cjs",
  ".env.example",
  ".env.test.example",
  ".gitignore",
  ".gitleaks.toml",
  ".gitleaksignore",
  "index.html",
  "README.md",
  "LICENSE",
];

const INCLUDE_TOP_LEVEL_DIRS = [
  "client",
  "server",
  "shared",
  "scripts",
  "tests",
  "supabase",
  "docs",
  ".github",
  ".husky",
];

// Per-file/dir exclusion regex (POSIX paths).
const EXCLUDE_REGEX = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)build(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /(^|\/)coverage(\/|$)/,
  /(^|\/)\.cache(\/|$)/,
  /(^|\/)tmp(\/|$)/,
  /(^|\/)\.wip-safety(\/|$)/,
  /(^|\/)\.claude(\/|$)/,
  /(^|\/)audit-out(\/|$)/,
  // Any .env that is NOT .example
  /(^|\/)\.env(\.|$)(?!example|test\.example)/,
  /(^|\/)secrets(\/|$)/,
  /(^|\/)ZIPY(\/|$)/, // don't bundle previous ZIPs inside the ZIP
];

const ALLOW_DOTFILES = new Set([
  ".env.example",
  ".env.test.example",
  ".gitignore",
  ".gitleaks.toml",
  ".gitleaksignore",
  ".dependency-cruiser.cjs",
]);

const warnings = [];
const errors = [];

function toPosix(p) {
  return p.split(sep).join("/");
}

function isExcluded(relPath) {
  const rel = toPosix(relPath);
  for (const rx of EXCLUDE_REGEX) {
    if (rx.test(rel)) return true;
  }
  return false;
}

function walk(dirAbs) {
  const out = [];
  if (!existsSync(dirAbs)) return out;
  for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
    const full = join(dirAbs, entry.name);
    const rel = toPosix(relative(REPO_ROOT, full));
    if (entry.isDirectory()) {
      if (isExcluded(rel + "/")) continue;
      out.push(...walk(full));
      continue;
    }
    // File
    if (entry.name.startsWith(".") && !ALLOW_DOTFILES.has(entry.name)) {
      const isAllowedInTree = /\.env\.example|\.env\.test\.example/.test(rel);
      if (!isAllowedInTree) {
        // Skip stray dotfiles in subtrees too
        continue;
      }
    }
    if (isExcluded(rel)) continue;
    out.push(full);
  }
  return out;
}

const includedFiles = [];

// Top-level dirs
for (const d of INCLUDE_TOP_LEVEL_DIRS) {
  const abs = join(REPO_ROOT, d);
  if (!existsSync(abs)) continue;
  const files = walk(abs);
  includedFiles.push(...files);
}

// Top-level files
for (const f of INCLUDE_TOP_LEVEL_FILES) {
  const abs = join(REPO_ROOT, f);
  if (existsSync(abs) && statSync(abs).isFile()) {
    if (!isExcluded(f)) includedFiles.push(abs);
  }
}

const dedup = Array.from(new Set(includedFiles));

// Run gates so the manifest carries real status, not aspirational claims.
function tryRun(cmd, label) {
  try {
    execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return { label, status: "PASS" };
  } catch (err) {
    const stderr = (err && err.stderr ? err.stderr.toString() : "") + (err && err.stdout ? err.stdout.toString() : "");
    return { label, status: "FAIL", tail: stderr.split("\n").slice(-12).join("\n") };
  }
}

console.log("[full-audit-zip] Running gates for manifest…");
const gates = {
  tsc: tryRun("pnpm -s check", "tsc"),
  eslint: tryRun("pnpm -s lint", "eslint"),
  vitest: tryRun("pnpm -s test", "vitest"),
  viteBuild: tryRun("pnpm -s build", "vite build"),
  rulesCheck: tryRun("pnpm -s rules:check", "rules:check"),
  archCheckV2: tryRun("pnpm -s arch:check:v2", "arch:check:v2"),
  guardsAllLocal: tryRun("pnpm -s guards:all-local", "guards:all-local"),
};

// Build the ZIP
console.log("[full-audit-zip] Building ZIP with", dedup.length, "files…");
const zip = new AdmZip();
for (const abs of dedup) {
  const rel = toPosix(relative(REPO_ROOT, abs));
  if (rel.length === 0) continue;
  // Sanity: never bundle the ZIP we're about to write
  if (rel.startsWith("ZIPY/")) continue;
  if (rel.includes("/.git/") || rel.startsWith(".git/")) continue;
  const buf = readFileSync(abs);
  // Use addFile to control entry name and keep forward slashes
  zip.addFile(rel, buf);
}

// Manifest
const notableReports = [
  "docs/review/manage-v2/MANAGE_SLICE_21_ACCOUNT_PRIVACY_SETTINGS_CENTER_REPORT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_EXECUTIVE_SUMMARY.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_SLICE_BY_SLICE_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_FEATURE_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_UI_CARDS_AND_NAV_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_ARCHITECTURE_BOUNDARIES_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_DEAD_CODE_AND_REPLACED_TOOLS_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_SECURITY_PRIVACY_PII_AUDIT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_TESTS_AND_GATES_REPORT.md",
  "docs/review/global-audit-v2/slice-20c/SLICE_20C_ACTION_PLAN_BEFORE_ZIP.md",
  "docs/architecture/adr/ADR-016-manage-orchestrator-and-port-pattern.md",
  "docs/governance/EXCEPTIONS_REGISTER.md",
  "docs/architecture/adr/README.md",
];

const manifestBase = {
  generatedAt: new Date().toISOString(),
  generator: "scripts/audit/create-full-audit-zip.mjs",
  slice: 21,
  branch,
  commitSha: sha,
  commitShortSha: shortSha,
  workingTreeDirty: dirty,
  gitStatusShort,
  zipPath: posix.normalize(`ZIPY/${ZIP_NAME}`),
  zipPathDesktop: `C:/Users/dgola/Desktop/ZIPY/${ZIP_NAME}`,
  includedFileCount: dedup.length,
  includedTopLevelDirs: INCLUDE_TOP_LEVEL_DIRS,
  includedTopLevelFiles: INCLUDE_TOP_LEVEL_FILES,
  excludedPatterns: EXCLUDE_REGEX.map((r) => r.toString()),
  gateResults: gates,
  notableReports,
  warnings,
  errors,
  notes: [
    "Full platform ZIP intended for external A–Z audit.",
    "ZIP includes source (client/server/shared/scripts/tests/supabase), full docs/ (governance + architecture + review including SLICE 20C reports + Slice 21 report + ADR-016), top-level configs, .env.example + .env.test.example.",
    "ZIP excludes: .git, node_modules, dist, build, .next, coverage, .cache, tmp, .wip-safety, .claude, audit-out, all .env / .env.* (except .example), secrets/, prior ZIPs.",
    "Backend status across V2 domains remains BACKEND_PARTIAL / MOCK_LOCAL_ONLY (acknowledged, gated by check-domain-status-registry + check-runtime-readiness-status).",
  ],
  finalAuditStatus: errors.length === 0 ? "READY_FOR_GLOBAL_AUDIT" : "BLOCKED",
};

// Include manifest inside the ZIP as well
zip.addFile(MANIFEST_NAME, Buffer.from(JSON.stringify(manifestBase, null, 2), "utf8"));

zip.writeZip(ZIP_PATH);
writeFileSync(MANIFEST_PATH, JSON.stringify(manifestBase, null, 2), "utf8");

// === Validate ZIP ===
const validation = {
  exists: false,
  nonEmpty: false,
  forwardSlashOnly: false,
  noGit: false,
  noNodeModules: false,
  noEnvFiles: false,
  noSecretsDir: false,
  noClaudeLocal: false,
  hasEnvExample: false,
  hasEnvTestExample: false,
  hasDocsGovernance: false,
  hasDocsArchitecture: false,
  hasDocsReview: false,
  hasSliceReports: false,
  hasSourceFiles: false,
  manifestInsideZip: false,
};

if (existsSync(ZIP_PATH) && statSync(ZIP_PATH).size > 0) {
  validation.exists = true;
  validation.nonEmpty = true;
  const reopened = new AdmZip(ZIP_PATH);
  const entries = reopened.getEntries().map((e) => e.entryName);
  validation.forwardSlashOnly = entries.every((e) => !e.includes("\\"));
  validation.noGit = entries.every((e) => !e.startsWith(".git/") && !e.includes("/.git/"));
  validation.noNodeModules = entries.every((e) => !e.includes("node_modules/"));
  validation.noEnvFiles = entries.every((e) => {
    const m = /(^|\/)\.env(\.(.+))?$/.exec(e);
    if (!m) return true;
    const suffix = m[3] || "";
    return suffix === "example" || suffix === "test.example";
  });
  validation.noSecretsDir = entries.every((e) => !e.startsWith("secrets/") && !e.includes("/secrets/"));
  validation.noClaudeLocal = entries.every(
    (e) => !e.endsWith(".claude/settings.local.json") && !e.startsWith(".claude/"),
  );
  validation.hasEnvExample = entries.some((e) => e === ".env.example");
  validation.hasEnvTestExample = entries.some((e) => e === ".env.test.example");
  validation.hasDocsGovernance = entries.some((e) => e.startsWith("docs/governance/"));
  validation.hasDocsArchitecture = entries.some((e) => e.startsWith("docs/architecture/"));
  validation.hasDocsReview = entries.some((e) => e.startsWith("docs/review/"));
  validation.hasSliceReports =
    entries.some((e) => e.startsWith("docs/review/global-audit-v2/slice-20c/")) &&
    entries.some((e) => e.startsWith("docs/review/manage-v2/"));
  validation.hasSourceFiles =
    entries.some((e) => e.startsWith("client/src/")) &&
    entries.some((e) => e.startsWith("server/")) &&
    entries.some((e) => e.startsWith("shared/contracts/"));
  validation.manifestInsideZip = entries.some((e) => e === MANIFEST_NAME);
}

const allValidationsPass = Object.values(validation).every(Boolean);
const validationStatus = allValidationsPass ? "PASS" : "PARTIAL";

const finalManifest = {
  ...manifestBase,
  validation,
  validationStatus,
  outputs: {
    zip: ZIP_PATH,
    manifest: MANIFEST_PATH,
    zipDesktopCopy: join(DESKTOP_ZIP_DIR, ZIP_NAME),
    manifestDesktopCopy: join(DESKTOP_ZIP_DIR, MANIFEST_NAME),
  },
};

writeFileSync(MANIFEST_PATH, JSON.stringify(finalManifest, null, 2), "utf8");

// Copy outputs to Desktop\ZIPY\
copyFileSync(ZIP_PATH, join(DESKTOP_ZIP_DIR, ZIP_NAME));
copyFileSync(MANIFEST_PATH, join(DESKTOP_ZIP_DIR, MANIFEST_NAME));

const gateFails = Object.entries(gates)
  .filter(([, v]) => v.status !== "PASS")
  .map(([k]) => k);

console.log(JSON.stringify({
  ok: allValidationsPass && gateFails.length === 0,
  zipPath: ZIP_PATH,
  zipDesktopCopy: join(DESKTOP_ZIP_DIR, ZIP_NAME),
  manifestPath: MANIFEST_PATH,
  fileCount: dedup.length,
  zipSizeBytes: existsSync(ZIP_PATH) ? statSync(ZIP_PATH).size : 0,
  validation,
  validationStatus,
  gatesFailed: gateFails,
  finalAuditStatus: finalManifest.finalAuditStatus,
}, null, 2));

if (!allValidationsPass || gateFails.length > 0) process.exit(1);
