#!/usr/bin/env node
/**
 * scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs
 *
 * Slice 23 — foundation hardening full-source audit ZIP. Bundles the
 * current working tree under
 *   ZIPY/PlatformaX_V2_SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_<sha>[_DIRTY].zip
 * + a JSON manifest (also embedded inside the ZIP). Copies both to
 * C:/Users/dgola/Desktop/ZIPY/ per the user's persistent preference.
 *
 * Gate results are captured manually in the Slice 23 final report and
 * reproduced verbatim in the manifest (running them inside this script
 * would add ~3 minutes for no new evidence).
 *
 * The manifest additionally exposes a `governanceCoverage` section so the
 * external auditor can verify that every required rules / guards /
 * architecture file is in the bundle before reading the code.
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

const ZIP_NAME = `PlatformaX_V2_SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_${shortSha}${dirtySuffix}.zip`;
const MANIFEST_NAME = `PlatformaX_V2_SLICE_24_DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_${shortSha}${dirtySuffix}_MANIFEST.json`;
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
  "playwright.config.ts",
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
  // Playwright captures large native chromium artefacts under test-results
  /(^|\/)test-results(\/|$)/,
  /(^|\/)playwright-report(\/|$)/,
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

// Gate results captured during Slice 24 (pnpm verify:deep equivalent).
const gateResults = {
  check: { status: "PASS", summary: "tsc --noEmit — 0 errors." },
  lint: { status: "PASS", summary: "eslint . --max-warnings=0 — clean." },
  test: { status: "PASS", summary: "vitest run — 1339 / 1339 tests, 167 / 167 files." },
  build: { status: "PASS", summary: "vite build — 0 errors, largest chunk 284 KB raw / 90 KB gzip." },
  rulesCheck: { status: "PASS", summary: "rules-check.mjs — 55 / 55 guards PASS (Slice 24: +12)." },
  archCheckV2: { status: "PASS", summary: "arch-check-v2.mjs — 17 / 17 guards PASS (Slice 24: +8)." },
  guardsAllLocal: { status: "PASS", summary: "guards:all-local — all items PASS; item 19 (branch protection) [EXT] external as before." },
  depcruise: { status: "PASS", summary: "depcruise --config .dependency-cruiser.cjs — 0 errors, 44 informational no-orphans warnings (carry-over from Slice 23)." },
  archTests: { status: "PASS", summary: "vitest tests/architecture — PASS." },
  gitleaks: { status: "PASS", summary: "run-gitleaks.mjs — no leaks found." },
  knip: { status: "WARNINGS", summary: "knip — informational weekly lane; no Slice-24 regression." },
  toolingRedcase: { status: "NOT_RUN_LOCAL_DEFERRED_TO_CI", summary: "tooling:redcase DEV mode runs in CI DEEP lane; STRICT remains informational per EXC-017." },
};

console.log("[slice-23-zip] Bundling", dedup.length, "files…");
const zip = new AdmZip();
for (const abs of dedup) {
  const rel = toPosix(relative(REPO_ROOT, abs));
  if (rel.length === 0) continue;
  if (rel.startsWith("ZIPY/")) continue;
  if (rel.includes("/.git/") || rel.startsWith(".git/")) continue;
  const buf = readFileSync(abs);
  zip.addFile(rel, buf);
}

// Build raw entry list (we re-read after writing for validation but already
// know every entry name now).
const entries = zip.getEntries().map((e) => e.entryName);

const governanceCoverage = {
  hasDocsGovernance: entries.some((e) => e.startsWith("docs/governance/")),
  hasRulesRegistry: entries.some((e) => e === "docs/governance/RULES_REGISTRY.yml"),
  hasGuardsRegistry: entries.some((e) => e === "docs/governance/GUARDS_REGISTRY.yml"),
  hasRulesToGuardsMatrix: entries.some((e) => e === "docs/governance/RULES_TO_GUARDS_MATRIX.md"),
  hasStatusTaxonomy: entries.some((e) => e === "docs/governance/STATUS_TAXONOMY.md"),
  hasDomainStatusRegistry: entries.some((e) => e === "docs/governance/DOMAIN_STATUS_REGISTRY.yml"),
  hasAiPermissionsPolicy: entries.some((e) => e === "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md"),
  hasAgentCommandStandard: entries.some((e) => e === "docs/governance/AGENT_COMMAND_STANDARD.md"),
  hasRequiredDocsByScope: entries.some((e) => e === "docs/governance/REQUIRED_DOCS_BY_SCOPE.yml"),
  hasExceptionsRegister: entries.some((e) => e === "docs/governance/EXCEPTIONS_REGISTER.md"),
  hasHiddenRulesInventory: entries.some((e) => e === "docs/governance/HIDDEN_RULES_INVENTORY.md"),
  hasArchitectureEnforcement: entries.some((e) => e === "docs/architecture/PlatformaX-V2-architecture-enforcement.md"),
  hasCodingStandards: entries.some((e) => e === "docs/architecture/PlatformaX-V2-coding-standards.md"),
  hasActiveRules: entries.some((e) => e === "docs/architecture/PlatformaX-V2-active-rules.md"),
  hasDomainStatus: entries.some((e) => e === "docs/architecture/PlatformaX-V2-domain-status.md"),
  hasExecutionMap: entries.some((e) => e === "docs/architecture/PlatformaX-V2-execution-map.md"),
  hasLegacyContainment: entries.some((e) => e === "docs/architecture/PlatformaX-V2-legacy-containment.md"),
  hasBrama: entries.some((e) => e === "docs/architecture/BRAMKA.md"),
  hasWorkflowFiles: entries.some((e) => e.startsWith(".github/workflows/")),
  hasCheckScripts: entries.some((e) => /^scripts\/check-.+\.mjs$/.test(e)),
  hasAuditScripts: entries.some((e) => e.startsWith("scripts/audit/")),
  hasHusky: entries.some((e) => e.startsWith(".husky/")),
  hasCodeowners: entries.some((e) => e === ".github/CODEOWNERS"),
  hasPackageJson: entries.some((e) => e === "package.json"),
  hasPackageScripts: (() => {
    const pkgEntry = zip.getEntry("package.json");
    if (!pkgEntry) return false;
    const pkg = JSON.parse(pkgEntry.getData().toString("utf8"));
    const required = ["check", "lint", "test", "build", "rules:check", "arch:check:v2", "guards:all-local"];
    return required.every((s) => typeof pkg.scripts?.[s] === "string");
  })(),
  hasSecurityPolicy: entries.some((e) => e === "docs/security/SECRET_HANDLING_POLICY.md"),
  hasAiOperatingStandard: entries.some((e) => e === "docs/ai/AGENT_OPERATING_STANDARD.md"),
};

const manifestBase = {
  generatedAt: new Date().toISOString(),
  slice: 24,
  purpose: "DEEP_ONLY_GOVERNANCE_HARDENING_FULL_SOURCE_AUDIT",
  generator: "scripts/audit/create-slice-24-deep-only-governance-hardening-zip.mjs",
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
  governanceCoverage,
  notes: [
    "Full source ZIP for external A–Z audit at the end of Slice 24 deep-only governance hardening.",
    "Slice 24 shipped 12 new P0 guards (GUARD-051..062). 10 of the 11 Slice-24 prep TODO_GUARDs closed; PX-ID-001 (branded IDs) moved to Slice 25 P1.",
    "Slice 24 introduced pnpm verify:deep as the canonical acceptance command; verify:fast / verify:normal labelled HELPER_ONLY / NOT_ACCEPTANCE_GATE.",
    "PlatformaX-V2-coding-standards.md extended with §§2a, 24–31 (deep-only, test density, backend layers, visibility matrix, idempotency / envelope / outbox, read-model owner, public-DTO contract tests, agent safety, ZIP/manifest truth).",
    "AGENT_COMMAND_STANDARD.md extended with §§11–16 (evidence verification, no-scope-creep, ZIP integrity, no silent guard delta, no report rewrite, READY-status gate).",
    "Pre-runtime files carry per-file PX-RULE-ACK markers (PX-IDEMP-001-ACK, PX-OWN-001-ACK, PX-OWN-002-ACK, PX-MEDIA-004-ACK, PX-EVENT-001-ACK, PX-CONTRACT-001-ACK). The new guards log each ACK and fail closed on new code.",
    "Boundaries v6 stays PARTIAL_NOT_ENFORCED; formalized as EXC-017 with expiry 2026-08-31 + inline exception marker (see eslint.config.js for the registered marker).",
    "Audit reports bundled under docs/review/governance-v2/slice-24/.",
  ],
  warnings: [
    "depcruise emits 44 informational no-orphans warnings carried over from Slice 23 (KEEP_* orphan register).",
    "knip lists pre-existing unused-file / unused-export candidates (informational weekly lane).",
    "eslint-plugin-boundaries v6 PARTIAL_NOT_ENFORCED — compensating coverage via depcruise + arch-tests + audit-domain-boundaries.mjs. Tracked as EXC-017.",
  ],
  errors: [],
};

zip.addFile(MANIFEST_NAME, Buffer.from(JSON.stringify(manifestBase, null, 2), "utf8"));

zip.writeZip(ZIP_PATH);

const reopened = new AdmZip(ZIP_PATH);
const finalEntries = reopened.getEntries().map((e) => e.entryName);

const validation = {
  exists: existsSync(ZIP_PATH),
  nonEmpty: existsSync(ZIP_PATH) && statSync(ZIP_PATH).size > 0,
  forwardSlashOnly: finalEntries.every((e) => !e.includes("\\")),
  noGit: finalEntries.every((e) => !e.startsWith(".git/") && !e.includes("/.git/")),
  noNodeModules: finalEntries.every((e) => !e.includes("node_modules/")),
  noEnvFilesExceptExamples: finalEntries.every((e) => {
    const m = /(^|\/)\.env(\.(.+))?$/.exec(e);
    if (!m) return true;
    const suffix = m[3] || "";
    return suffix === "example" || suffix === "test.example";
  }),
  noSecretsDir: finalEntries.every((e) => !e.startsWith("secrets/") && !e.includes("/secrets/")),
  noClaudeLocal: finalEntries.every((e) => !e.startsWith(".claude/")),
  noBuildArtifacts: finalEntries.every((e) =>
    !e.startsWith("dist/") && !e.startsWith("build/") && !e.startsWith(".next/") &&
    !e.startsWith("coverage/") && !e.startsWith(".cache/"),
  ),
  noOldZips: finalEntries.every((e) => !e.startsWith("ZIPY/") && !e.endsWith(".zip")),
  hasClient: finalEntries.some((e) => e.startsWith("client/")),
  hasServer: finalEntries.some((e) => e.startsWith("server/")),
  hasShared: finalEntries.some((e) => e.startsWith("shared/")),
  hasScripts: finalEntries.some((e) => e.startsWith("scripts/")),
  hasTests: finalEntries.some((e) => e.startsWith("tests/")),
  hasDocs: finalEntries.some((e) => e.startsWith("docs/")),
  hasDocsGovernance: finalEntries.some((e) => e.startsWith("docs/governance/")),
  hasDocsArchitecture: finalEntries.some((e) => e.startsWith("docs/architecture/")),
  hasDocsReview: finalEntries.some((e) => e.startsWith("docs/review/")),
  hasGithubWorkflows: finalEntries.some((e) => e.startsWith(".github/workflows/")),
  hasPackageJson: finalEntries.some((e) => e === "package.json"),
  hasPnpmLock: finalEntries.some((e) => e === "pnpm-lock.yaml"),
  manifestInsideZip: finalEntries.some((e) => e === MANIFEST_NAME),
  hasSlice24GovernanceReports: finalEntries.some((e) =>
    e.startsWith("docs/review/governance-v2/slice-24/") && e.endsWith(".md"),
  ),
  hasGovernanceCoverageCompliant: Object.values(governanceCoverage).every(Boolean),
};

const allValidationsPass = Object.values(validation).every(Boolean);
const validationStatus = allValidationsPass ? "PASS" : "FAIL";

const finalStatus = (() => {
  if (!allValidationsPass) return "BLOCKED";
  if (!governanceCoverage.hasDocsGovernance) return "READY_WITH_GOVERNANCE_GAPS";
  if (dirty) return "READY_WITH_DIRTY_TREE";
  return "READY_FOR_EXTERNAL_AUDIT";
})();

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
  governanceCoverage,
  workingTreeDirty: dirty,
  finalStatus,
}, null, 2));

if (!allValidationsPass) process.exit(1);
