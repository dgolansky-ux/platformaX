/**
 * create-audit-zip — build a self-contained, reviewable audit bundle + a
 * machine-readable validation report.
 *
 * The bundle is a snapshot an external reviewer can open offline to understand
 * exactly what is in the working tree, what changed, and prove the snapshot is
 * clean (no secrets, no local-only config, forward-slash paths only).
 *
 * What it produces (into <outDir>, default ./audit-out):
 *   <stem>.zip              — the audit bundle
 *   <stem>.validation.json  — pass/fail report for the bundle
 *   <stem>.zip.sha256       — checksum of the bundle
 *
 * The ZIP always contains these generated manifests at its root:
 *   AUDIT_MANIFEST.txt              — every bundled path + byte size
 *   AUDIT_TREE.txt                  — directory tree of the bundle
 *   AUDIT_REQUIRED_FILES_CHECK.txt  — PRESENT/MISSING per required path
 *   AUDIT_GIT_DIFF_UNSTAGED.patch   — `git diff`
 *   AUDIT_GIT_DIFF_STAGED.patch     — `git diff --cached`
 *   AUDIT_UNTRACKED_FILES.txt       — `git ls-files --others --exclude-standard`
 *
 * Guarantees enforced by the embedded validator (reflected in the JSON report):
 *   - required files + required directories are present
 *   - banned files are absent (.env, .env.local, .claude/settings.local.json)
 *   - every entry uses forward slashes (no backslash paths)
 *   - the secret scanner passes over the working tree
 *
 * Usage:
 *   node scripts/create-audit-zip.mjs [outDir]
 *   pnpm auditzip [outDir]
 *
 * Exit code is 0 only when the validation report's checksPass is true.
 */
import AdmZip from "adm-zip";
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "fs";
import { join, relative } from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUT_DIR = process.argv[2] ? process.argv[2] : join(ROOT, "audit-out");

// Directories never worth bundling (build output, deps, VCS internals).
const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".cache",
  ".turbo",
]);

// Files that must NEVER appear in an audit bundle — secrets or local-only state.
const BANNED_RELS = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".claude/settings.local.json",
]);

// Files that MUST appear in the bundle (relative to repo root).
const REQUIRED_FILES = [
  "AUDIT_MANIFEST.txt",
  "AUDIT_TREE.txt",
  "AUDIT_REQUIRED_FILES_CHECK.txt",
  "AUDIT_GIT_DIFF_UNSTAGED.patch",
  "AUDIT_GIT_DIFF_STAGED.patch",
  "AUDIT_UNTRACKED_FILES.txt",
  ".env.example",
  ".env.test.example",
  ".claude/settings.example.json",
];

// Directories that MUST contribute at least one file to the bundle.
const REQUIRED_DIRS = [
  "docs/governance/",
  "docs/architecture/",
  "server/domains-v2/",
  "server/application-v2/",
  "client/src/app-v2/",
  "client/src/features-v2/",
  "scripts/",
];

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function safeGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    return `# git command failed: ${cmd}\n# ${e instanceof Error ? e.message : String(e)}\n`;
  }
}

function gitShort(cmd, fallback) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

/** Collect every bundle-eligible file as { rel, abs, size }. */
function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(abs));
      continue;
    }
    const rel = toPosix(relative(ROOT, abs));
    if (BANNED_RELS.has(rel)) continue;
    if (/\.(zip|sha256)$/i.test(rel) || rel.endsWith(".sha256.txt")) continue;
    let size = 0;
    try {
      size = statSync(abs).size;
    } catch {
      continue;
    }
    out.push({ rel, abs, size });
  }
  return out;
}

function buildTree(relPaths) {
  const root = {};
  for (const p of relPaths) {
    let node = root;
    for (const part of p.split("/")) {
      node[part] = node[part] || {};
      node = node[part];
    }
  }
  return root;
}

function renderTree(node, prefix = "") {
  const keys = Object.keys(node).sort();
  let out = "";
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    out += `${prefix}${last ? "└── " : "├── "}${k}\n`;
    out += renderTree(node[k], prefix + (last ? "    " : "│   "));
  });
  return out;
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const branch = gitShort("git rev-parse --abbrev-ref HEAD", "nobranch").replace(/[^\w.-]/g, "-");
  const commit = gitShort("git rev-parse --short HEAD", "nocommit");
  const fullCommit = gitShort("git rev-parse HEAD", "nocommit");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const stem = `platformax-v2-audit-${branch}-${commit}-${stamp}`;
  const zipPath = join(OUT_DIR, `${stem}.zip`);
  const jsonPath = join(OUT_DIR, `${stem}.validation.json`);
  const shaPath = join(OUT_DIR, `${stem}.zip.sha256`);

  const files = collectFiles(ROOT);
  const bundledRels = files.map((f) => f.rel).sort();

  // --- Generated AUDIT_* manifests (added at the ZIP root) ---
  const diffUnstaged = safeGit("git diff");
  const diffStaged = safeGit("git diff --cached");
  const untracked = safeGit("git ls-files --others --exclude-standard");

  const allRelsForCheck = new Set([...bundledRels, ...REQUIRED_FILES]);
  const requiredCheckLines = [];
  requiredCheckLines.push("# Required files");
  for (const r of REQUIRED_FILES) {
    const present = r.startsWith("AUDIT_") || allRelsForCheck.has(r);
    requiredCheckLines.push(`${present ? "PRESENT" : "MISSING"}  ${r}`);
  }
  requiredCheckLines.push("");
  requiredCheckLines.push("# Required directories (>=1 file)");
  for (const d of REQUIRED_DIRS) {
    const present = bundledRels.some((r) => r.startsWith(d));
    requiredCheckLines.push(`${present ? "PRESENT" : "MISSING"}  ${d}`);
  }
  requiredCheckLines.push("");
  requiredCheckLines.push("# Banned files (must be absent)");
  for (const b of BANNED_RELS) {
    const present = bundledRels.includes(b);
    requiredCheckLines.push(`${present ? "FOUND(!!)" : "absent"}  ${b}`);
  }

  const manifest =
    `# Audit bundle manifest\n` +
    `# branch=${branch} commit=${fullCommit} generatedAt=${new Date().toISOString()}\n` +
    `# ${files.length} bundled files (AUDIT_* manifests added on top)\n\n` +
    files
      .slice()
      .sort((a, b) => a.rel.localeCompare(b.rel))
      .map((f) => `${String(f.size).padStart(10)}  ${f.rel}`)
      .join("\n") +
    "\n";

  const tree = renderTree(buildTree(bundledRels));

  const generated = {
    "AUDIT_MANIFEST.txt": manifest,
    "AUDIT_TREE.txt": tree,
    "AUDIT_REQUIRED_FILES_CHECK.txt": requiredCheckLines.join("\n") + "\n",
    "AUDIT_GIT_DIFF_UNSTAGED.patch": diffUnstaged,
    "AUDIT_GIT_DIFF_STAGED.patch": diffStaged,
    "AUDIT_UNTRACKED_FILES.txt": untracked,
  };

  // --- Build the ZIP (addFile guarantees forward-slash entry names) ---
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(generated)) {
    zip.addFile(name, Buffer.from(content, "utf-8"));
  }
  for (const f of files) {
    zip.addFile(f.rel, readFileSync(f.abs));
  }
  zip.writeZip(zipPath);

  const buf = readFileSync(zipPath);
  const sha256 = createHash("sha256").update(buf).digest("hex").toUpperCase();
  writeFileSync(shaPath, `${sha256}  ${stem}.zip\n`, "utf-8");

  // --- Validate the bundle we just wrote ---
  const entries = new AdmZip(zipPath)
    .getEntries()
    .map((e) => e.entryName)
    .filter((n) => n && !n.endsWith("/"));
  const entrySet = new Set(entries.map((e) => e.replace(/^\.\//, "")));

  const missingRequired = REQUIRED_FILES.filter((r) => !entrySet.has(r));
  const missingDirs = REQUIRED_DIRS.filter(
    (d) => ![...entrySet].some((e) => e.startsWith(d)),
  );
  const bannedFound = [...BANNED_RELS].filter((b) => entrySet.has(b));
  const backslashPaths = entries.filter((e) => e.includes("\\"));

  let secretScanPass = true;
  try {
    execSync("node scripts/check-secret-scan.mjs", { cwd: ROOT, stdio: "pipe" });
  } catch {
    secretScanPass = false;
  }

  const checks = {
    requiredFilesPresent: missingRequired.length === 0,
    requiredDirsPresent: missingDirs.length === 0,
    bannedFilesAbsent: bannedFound.length === 0,
    forwardSlashPathsOnly: backslashPaths.length === 0,
    secretScanPass,
  };
  const checksPass = Object.values(checks).every(Boolean);

  const report = {
    generatedAt: new Date().toISOString(),
    branch,
    commit: fullCommit,
    zipPath: toPosix(zipPath),
    sha256,
    fileCount: entries.length,
    bundledFileCount: files.length,
    checks,
    checksPass,
    missingRequired,
    missingDirs,
    bannedFound,
    backslashPaths,
  };
  writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf-8");

  console.log(`AUDIT_ZIP: ${zipPath}`);
  console.log(`VALIDATION_JSON: ${jsonPath}`);
  console.log(`SHA256: ${sha256}`);
  console.log(`Entries: ${entries.length} (bundled files: ${files.length})`);
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${v ? "PASS" : "FAIL"}  ${k}`);
  }
  if (missingRequired.length) console.error(`Missing required: ${missingRequired.join(", ")}`);
  if (missingDirs.length) console.error(`Missing dirs: ${missingDirs.join(", ")}`);
  if (bannedFound.length) console.error(`Banned found: ${bannedFound.join(", ")}`);
  if (backslashPaths.length) console.error(`Backslash paths: ${backslashPaths.slice(0, 10).join(", ")}`);

  if (checksPass) {
    console.log("CREATE_AUDIT_ZIP_PASS");
    process.exit(0);
  }
  console.error("CREATE_AUDIT_ZIP_FAIL");
  process.exit(1);
}

main();
