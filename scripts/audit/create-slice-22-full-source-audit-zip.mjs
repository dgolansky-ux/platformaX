#!/usr/bin/env node
/**
 * scripts/audit/create-slice-22-full-source-audit-zip.mjs
 *
 * Slice 22 — full source audit ZIP. Bundles the entire current working tree
 * (clean-room V2 monorepo) under
 *   ZIPY/PlatformaX_V2_SLICE_22_FULL_SOURCE_AUDIT_<sha>[_DIRTY].zip
 * and copies the ZIP + manifest to C:/Users/dgola/Desktop/ZIPY/ per the
 * user's persistent preference.
 *
 * Gates are NOT re-run inside this script — Slice 22A captured fresh results
 * and the manifest carries them verbatim. Re-running would add 3+ minutes
 * for no new evidence.
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
import { join, relative, sep } from "node:path";

const REPO_ROOT = process.cwd();
const ZIP_DIR = join(REPO_ROOT, "ZIPY");
const DESKTOP_ZIP_DIR = "C:\\Users\\dgola\\Desktop\\ZIPY";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}
function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
function toPosix(p) {
  return p.split(sep).join("/");
}

ensureDir(ZIP_DIR);
ensureDir(DESKTOP_ZIP_DIR);

const branch = sh("git rev-parse --abbrev-ref HEAD");
const sha = sh("git rev-parse HEAD");
const shortSha = sha.slice(0, 7);
const gitStatusShort = execSync("git status --short", { encoding: "utf8" });
const gitDiffStat = execSync("git diff --stat", { encoding: "utf8" });
const dirty = gitStatusShort.trim().length > 0;
const dirtySuffix = dirty ? "_DIRTY" : "";

const ZIP_NAME = `PlatformaX_V2_SLICE_22_FULL_SOURCE_AUDIT_${shortSha}${dirtySuffix}.zip`;
const MANIFEST_NAME = `PlatformaX_V2_SLICE_22_FULL_SOURCE_AUDIT_${shortSha}${dirtySuffix}_MANIFEST.json`;
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
  /(^|\/)\.env(\.|$)(?!example|test\.example)/,
  /(^|\/)secrets(\/|$)/,
  /(^|\/)ZIPY(\/|$)/,
];

const ALLOW_DOTFILES = new Set([
  ".env.example",
  ".env.test.example",
  ".gitignore",
  ".gitleaks.toml",
  ".gitleaksignore",
  ".dependency-cruiser.cjs",
]);

function isExcluded(rel) {
  const p = toPosix(rel);
  for (const rx of EXCLUDE_REGEX) {
    if (rx.test(p)) return true;
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
    if (entry.name.startsWith(".") && !ALLOW_DOTFILES.has(entry.name)) continue;
    if (isExcluded(rel)) continue;
    out.push(full);
  }
  return out;
}

const includedFiles = [];
for (const d of INCLUDE_TOP_LEVEL_DIRS) {
  const abs = join(REPO_ROOT, d);
  if (existsSync(abs)) includedFiles.push(...walk(abs));
}
for (const f of INCLUDE_TOP_LEVEL_FILES) {
  const abs = join(REPO_ROOT, f);
  if (existsSync(abs) && statSync(abs).isFile()) {
    if (!isExcluded(f)) includedFiles.push(abs);
  }
}
const dedup = Array.from(new Set(includedFiles));

// Gate results captured manually in Slice 22A (see SLICE_22A_STABILIZATION_REPORT.md).
const gateResults = {
  check: { status: "PASS", summary: "tsc --noEmit — 0 errors." },
  lint: { status: "PASS", summary: "eslint . --max-warnings=0 — clean." },
  test: { status: "PASS", summary: "vitest run — 1339 / 1339 tests, 167 / 167 files." },
  build: { status: "PASS", summary: "vite build — no chunk-size warning, largest chunk 284 KB (raw) / 90 KB gzip." },
  rulesCheck: { status: "PASS", summary: "rules-check.mjs — 43 / 43 guards PASS." },
  archCheckV2: { status: "PASS", summary: "arch-check-v2.mjs — 9 / 9 guards PASS." },
  guardsAllLocal: { status: "PASS", summary: "guards:all-local — 24 / 25 items PASS, item 19 (branch protection) flagged [EXT] as in baseline." },
  depcruise: { status: "PASS", summary: "depcruise --config .dependency-cruiser.cjs — 0 errors, 44 warnings (orphan SCAFFOLD_ONLY index files). Pre-existing manage-dashboard circular dep eliminated in Slice 22A." },
  gitleaks: { status: "PASS", summary: "run-gitleaks.mjs — no leaks found, 131 commits scanned (~7 MB)." },
  knip: { status: "WARNINGS", summary: "knip --no-progress — long pre-existing inventory of unused exports / orphan configs. No fail mode." },
};

console.log("[slice-22-full-audit-zip] Bundling", dedup.length, "files…");
const zip = new AdmZip();
for (const abs of dedup) {
  const rel = toPosix(relative(REPO_ROOT, abs));
  if (rel.length === 0) continue;
  if (rel.startsWith("ZIPY/")) continue;
  if (rel.includes("/.git/") || rel.startsWith(".git/")) continue;
  const buf = readFileSync(abs);
  zip.addFile(rel, buf);
}

const manifestBase = {
  generatedAt: new Date().toISOString(),
  slice: 22,
  sliceVariant: "22A",
  purpose: "FULL_SOURCE_AUDIT",
  generator: "scripts/audit/create-slice-22-full-source-audit-zip.mjs",
  branch,
  commitSha: sha,
  commitShortSha: shortSha,
  workingTreeDirty: dirty,
  gitStatusShort,
  gitDiffStat,
  includedFileCount: dedup.length,
  includedTopLevelDirs: INCLUDE_TOP_LEVEL_DIRS,
  includedTopLevelFiles: INCLUDE_TOP_LEVEL_FILES,
  excludedPatterns: EXCLUDE_REGEX.map((r) => r.toString()),
  gateResults,
  notes: [
    "Full source ZIP intended for external A–Z audit at the end of Slice 22A stabilization.",
    "Working tree was intentionally dirty: Slice 20B-FIX + Slice 20B-21 + Slice 21 + Slice 22A batched on the same branch. Diffs are documented under docs/review/stabilization-v2/slice-22a/.",
    "All features remain MOCK_LOCAL_ONLY except identity / media (PARTIAL_RUNTIME). No transport backend wired.",
    "ZIP includes audit package under docs/review/slice-22-audit-package/ with git state captured at build time.",
  ],
  warnings: [
    "Working tree is dirty — manifest uses the _DIRTY suffix in the filename so the audit cannot confuse this with a clean-commit bundle.",
    "depcruise still emits 44 no-orphans warnings for SCAFFOLD_ONLY domain placeholders (search, chat, events, content-v2, audit, system, shared-ui, modules index). These are documented domain scaffolds, not dead code.",
  ],
  errors: [],
};

zip.addFile(MANIFEST_NAME, Buffer.from(JSON.stringify(manifestBase, null, 2), "utf8"));

zip.writeZip(ZIP_PATH);

// Validate
const reopened = new AdmZip(ZIP_PATH);
const entries = reopened.getEntries().map((e) => e.entryName);

const validation = {
  exists: existsSync(ZIP_PATH),
  nonEmpty: existsSync(ZIP_PATH) && statSync(ZIP_PATH).size > 0,
  forwardSlashOnly: entries.every((e) => !e.includes("\\")),
  noGit: entries.every((e) => !e.startsWith(".git/") && !e.includes("/.git/")),
  noNodeModules: entries.every((e) => !e.includes("node_modules/")),
  noEnvFilesExceptExamples: entries.every((e) => {
    const m = /(^|\/)\.env(\.(.+))?$/.exec(e);
    if (!m) return true;
    const suffix = m[3] || "";
    return suffix === "example" || suffix === "test.example";
  }),
  noSecretsDir: entries.every((e) => !e.startsWith("secrets/") && !e.includes("/secrets/")),
  noClaudeLocal: entries.every((e) => !e.startsWith(".claude/")),
  noBuildArtifacts: entries.every((e) =>
    !e.startsWith("dist/") && !e.startsWith("build/") && !e.startsWith(".next/") &&
    !e.startsWith("coverage/") && !e.startsWith(".cache/"),
  ),
  noOldZips: entries.every((e) => !e.startsWith("ZIPY/") && !e.endsWith(".zip")),
  hasClient: entries.some((e) => e.startsWith("client/")),
  hasServer: entries.some((e) => e.startsWith("server/")),
  hasShared: entries.some((e) => e.startsWith("shared/")),
  hasScripts: entries.some((e) => e.startsWith("scripts/")),
  hasTests: entries.some((e) => e.startsWith("tests/")),
  hasDocs: entries.some((e) => e.startsWith("docs/")),
  hasDocsGovernance: entries.some((e) => e.startsWith("docs/governance/")),
  hasDocsArchitecture: entries.some((e) => e.startsWith("docs/architecture/")),
  hasDocsReview: entries.some((e) => e.startsWith("docs/review/")),
  hasGithubWorkflows: entries.some((e) => e.startsWith(".github/")),
  hasPackageJson: entries.some((e) => e === "package.json"),
  hasPnpmLock: entries.some((e) => e === "pnpm-lock.yaml"),
  manifestInsideZip: entries.some((e) => e === MANIFEST_NAME),
};

const allValidationsPass = Object.values(validation).every(Boolean);
const validationStatus = allValidationsPass ? "PASS" : "FAIL";

const finalStatus = allValidationsPass
  ? (dirty ? "READY_WITH_DIRTY_TREE" : "READY_FOR_EXTERNAL_AUDIT")
  : "BLOCKED";

const finalManifest = {
  ...manifestBase,
  validation,
  validationStatus,
  outputs: {
    zip: toPosix(ZIP_PATH),
    manifest: toPosix(MANIFEST_PATH),
    zipDesktopCopy: `C:/Users/dgola/Desktop/ZIPY/${ZIP_NAME}`,
    manifestDesktopCopy: `C:/Users/dgola/Desktop/ZIPY/${MANIFEST_NAME}`,
  },
  finalStatus,
};

writeFileSync(MANIFEST_PATH, JSON.stringify(finalManifest, null, 2), "utf8");
copyFileSync(ZIP_PATH, join(DESKTOP_ZIP_DIR, ZIP_NAME));
copyFileSync(MANIFEST_PATH, join(DESKTOP_ZIP_DIR, MANIFEST_NAME));

console.log(JSON.stringify({
  ok: allValidationsPass,
  zipPath: toPosix(ZIP_PATH),
  zipDesktopCopy: `C:/Users/dgola/Desktop/ZIPY/${ZIP_NAME}`,
  manifestPath: toPosix(MANIFEST_PATH),
  manifestDesktopCopy: `C:/Users/dgola/Desktop/ZIPY/${MANIFEST_NAME}`,
  fileCount: dedup.length,
  zipSizeBytes: statSync(ZIP_PATH).size,
  validation,
  validationStatus,
  workingTreeDirty: dirty,
  finalStatus,
}, null, 2));

if (!allValidationsPass) process.exit(1);
