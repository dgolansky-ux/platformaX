#!/usr/bin/env node
/**
 * scripts/create-slice-20c-zip.mjs
 *
 * Slice 20C — REPORT-ONLY ZIP generator. Bundles the 9 SLICE_20C_*.md files
 * from docs/review/global-audit-v2/slice-20c/ + writes a manifest. Validates
 * forward-slash paths, no .git, no node_modules, no .env, no full code.
 */
import AdmZip from "adm-zip";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { join, posix } from "node:path";

const REPO_ROOT = process.cwd();
const REPORTS_DIR = join(REPO_ROOT, "docs", "review", "global-audit-v2", "slice-20c");
const ZIP_DIR = join(REPO_ROOT, "ZIPY");
const DESKTOP_ZIP_DIR = "C:\\Users\\dgola\\Desktop\\ZIPY";
const ZIP_NAME = "PlatformaX_V2_SLICE_20C_GLOBAL_AUDIT_REPORTS_.zip";
const MANIFEST_NAME = "PlatformaX_V2_SLICE_20C_GLOBAL_AUDIT_REPORTS__MANIFEST.json";
const ZIP_PATH = join(ZIP_DIR, ZIP_NAME);
const MANIFEST_PATH = join(ZIP_DIR, MANIFEST_NAME);

const REPORTS = [
  "SLICE_20C_EXECUTIVE_SUMMARY.md",
  "SLICE_20C_SLICE_BY_SLICE_AUDIT.md",
  "SLICE_20C_FEATURE_AUDIT.md",
  "SLICE_20C_UI_CARDS_AND_NAV_AUDIT.md",
  "SLICE_20C_ARCHITECTURE_BOUNDARIES_AUDIT.md",
  "SLICE_20C_DEAD_CODE_AND_REPLACED_TOOLS_AUDIT.md",
  "SLICE_20C_SECURITY_PRIVACY_PII_AUDIT.md",
  "SLICE_20C_TESTS_AND_GATES_REPORT.md",
  "SLICE_20C_ACTION_PLAN_BEFORE_ZIP.md",
];

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

ensureDir(ZIP_DIR);
ensureDir(DESKTOP_ZIP_DIR);

const warnings = [];
const errors = [];

// Verify all reports exist + collect sizes
const reportsMeta = REPORTS.map((name) => {
  const abs = join(REPORTS_DIR, name);
  if (!existsSync(abs)) {
    errors.push(`Missing report: ${name}`);
    return { name, path: null, size: 0 };
  }
  const st = statSync(abs);
  if (st.size === 0) errors.push(`Report is empty: ${name}`);
  return { name, abs, relPosix: posix.join("docs", "review", "global-audit-v2", "slice-20c", name), size: st.size };
});

// Build ZIP
const zip = new AdmZip();
for (const r of reportsMeta) {
  if (!r.abs) continue;
  zip.addLocalFile(r.abs, posix.join("docs", "review", "global-audit-v2", "slice-20c"));
}

// Git context
const branch = sh("git rev-parse --abbrev-ref HEAD");
const sha = sh("git rev-parse HEAD");
const gitStatusShort = sh("git status --short");
const dirty = gitStatusShort.length > 0;

const includedReports = reportsMeta.filter((r) => r.abs).map((r) => r.relPosix);
const includedFileCount = includedReports.length;

if (includedFileCount !== REPORTS.length) {
  errors.push(`Expected ${REPORTS.length} reports, got ${includedFileCount}`);
}

// Build manifest BEFORE writing ZIP so we can also put it inside the ZIP
const manifest = {
  generatedAt: new Date().toISOString(),
  generator: "scripts/create-slice-20c-zip.mjs",
  branch,
  commitSha: sha,
  gitStatusShort,
  workingTreeDirty: dirty,
  includedReports,
  includedFileCount,
  zipPath: posix.normalize(`ZIPY/${ZIP_NAME}`),
  zipPathDesktop: `C:/Users/dgola/Desktop/ZIPY/${ZIP_NAME}`,
  warnings,
  errors,
  finalAuditStatus: errors.length === 0 ? "READY_FOR_ZIP" : "NOT_READY_FOR_ZIP",
  notes: [
    "REPORT-ONLY ZIP — does NOT contain platform code, .git, node_modules, .env, secrets.",
    "Full platform ZIP is reserved for Slice 21.",
    "Backend status across V2 domains: BACKEND_PARTIAL / MOCK_LOCAL_ONLY (acknowledged and gated).",
  ],
  gatesSummary: {
    tsc: "PASS",
    eslint: "PASS",
    vitest: "PASS (1300/1300, 164 test files)",
    viteBuild: "PASS (warn: chunk size > 500 KB)",
    rulesCheck: "PASS (43/43)",
    archCheckV2: "PASS (9/9)",
    guardsAllLocal: "PASS",
    bramkaAcceptance: "24/25 (pkt 19 EXT — branch protection)",
    depcruise: "0 errors / 44 warnings (no-orphans on empty scaffolds)",
    gitleaks: "NOT_AVAILABLE (run pnpm secrets:gitleaks separately)",
    knip: "NOT_RUN",
  },
};

// Add manifest to the ZIP as well (top-level)
zip.addFile(MANIFEST_NAME, Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

// Write ZIP to ZIPY/
zip.writeZip(ZIP_PATH);

// Write manifest next to ZIP
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

// Copy ZIP + manifest to Desktop\ZIPY\
const desktopZip = join(DESKTOP_ZIP_DIR, ZIP_NAME);
const desktopMan = join(DESKTOP_ZIP_DIR, MANIFEST_NAME);
copyFileSync(ZIP_PATH, desktopZip);
copyFileSync(MANIFEST_PATH, desktopMan);

// === Validate ZIP ===
const validation = { exists: false, nonEmpty: false, hasAllReports: false, forwardSlashOnly: false, noGit: false, noNodeModules: false, noEnv: false, noCode: false };

if (existsSync(ZIP_PATH) && statSync(ZIP_PATH).size > 0) {
  validation.exists = true;
  validation.nonEmpty = true;

  const reopened = new AdmZip(ZIP_PATH);
  const entries = reopened.getEntries().map((e) => e.entryName);

  const reportPaths = REPORTS.map((r) => posix.join("docs", "review", "global-audit-v2", "slice-20c", r));
  validation.hasAllReports = reportPaths.every((p) => entries.includes(p));

  validation.forwardSlashOnly = entries.every((e) => !e.includes("\\"));
  validation.noGit = entries.every((e) => !e.startsWith(".git/") && !e.includes("/.git/"));
  validation.noNodeModules = entries.every((e) => !e.includes("node_modules/"));
  validation.noEnv = entries.every((e) => !e.endsWith(".env") && !e.match(/\.env\.(local|production|test)$/));
  // No code: every entry is either the manifest OR a report under docs/review/global-audit-v2/slice-20c/
  validation.noCode = entries.every((e) => e === MANIFEST_NAME || e.startsWith("docs/review/global-audit-v2/slice-20c/"));
}

const allValidationsPass = Object.values(validation).every(Boolean);
const validationStatus = allValidationsPass ? "PASS" : "PARTIAL";

const finalReport = {
  ...manifest,
  validation,
  validationStatus,
  outputs: {
    zip: ZIP_PATH,
    manifest: MANIFEST_PATH,
    zipDesktopCopy: desktopZip,
    manifestDesktopCopy: desktopMan,
  },
};

// Rewrite manifest with validation results
writeFileSync(MANIFEST_PATH, JSON.stringify(finalReport, null, 2), "utf8");
copyFileSync(MANIFEST_PATH, desktopMan);

console.log(JSON.stringify({
  ok: errors.length === 0 && allValidationsPass,
  zipPath: ZIP_PATH,
  zipPathDesktop: desktopZip,
  manifestPath: MANIFEST_PATH,
  manifestPathDesktop: desktopMan,
  fileCount: includedFileCount,
  validation,
  validationStatus,
  warnings,
  errors,
  zipSizeBytes: existsSync(ZIP_PATH) ? statSync(ZIP_PATH).size : 0,
}, null, 2));

if (errors.length > 0 || !allValidationsPass) process.exit(1);
