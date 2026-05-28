import AdmZip from "adm-zip";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();

function fail(msg) {
  console.error(`AUDIT_ZIP_INVALID: ${msg}`);
  return false;
}

function hasAnyUnder(entries, prefix) {
  return entries.some((e) => e.startsWith(prefix));
}

function isRealEnvEntry(entryName) {
  if (!entryName.startsWith(".env")) return false;
  return !entryName.endsWith(".example");
}

export function validateAuditZipEntries(entryNames, opts) {
  const { requireEnvTestExample } = opts ?? { requireEnvTestExample: false };

  let ok = true;

  for (const name of entryNames) {
    if (name.includes("\\")) ok = ok && fail(`ZIP contains backslash path: ${name}`);
    if (name === ".claude/settings.local.json")
      ok = ok && fail("ZIP contains local agent config: .claude/settings.local.json");
    if (name === ".git" || name.startsWith(".git/")) ok = ok && fail(`ZIP contains .git: ${name}`);
    if (name === "node_modules" || name.startsWith("node_modules/"))
      ok = ok && fail(`ZIP contains node_modules: ${name}`);
    if (name === "dist" || name.startsWith("dist/")) ok = ok && fail(`ZIP contains dist: ${name}`);
    if (name === "build" || name.startsWith("build/")) ok = ok && fail(`ZIP contains build: ${name}`);
    if (name === "coverage" || name.startsWith("coverage/"))
      ok = ok && fail(`ZIP contains coverage: ${name}`);
    if (isRealEnvEntry(name)) ok = ok && fail(`ZIP contains real env file: ${name}`);
  }

  // Required content for audit portability (cross-platform extracted ZIP review)
  if (!entryNames.includes(".claude/settings.example.json"))
    ok = ok && fail("ZIP missing required tracked settings example: .claude/settings.example.json");

  if (requireEnvTestExample && !entryNames.includes(".env.test.example"))
    ok = ok && fail("ZIP missing required env example: .env.test.example");

  if (!hasAnyUnder(entryNames, "docs/governance/"))
    ok = ok && fail("ZIP missing docs/governance/");
  if (!hasAnyUnder(entryNames, "docs/architecture/"))
    ok = ok && fail("ZIP missing docs/architecture/");
  if (!hasAnyUnder(entryNames, "server/domains-v2/"))
    ok = ok && fail("ZIP missing server/domains-v2/");
  if (!hasAnyUnder(entryNames, "server/application-v2/"))
    ok = ok && fail("ZIP missing server/application-v2/");
  if (!hasAnyUnder(entryNames, "shared/contracts/"))
    ok = ok && fail("ZIP missing shared/contracts/");
  if (!hasAnyUnder(entryNames, "scripts/"))
    ok = ok && fail("ZIP missing scripts/");

  return ok;
}

export function validateAuditZipFile(zipPath, repoRoot = ROOT) {
  if (!zipPath || zipPath === "--help" || zipPath === "-h") {
    console.error("Usage: node scripts/validate-audit-zip.mjs <zip-path>");
    return zipPath === "--help" || zipPath === "-h";
  }
  if (!existsSync(zipPath)) {
    return fail(`ZIP path does not exist: ${zipPath}`);
  }

  const requireEnvTestExample = existsSync(join(repoRoot, ".env.test.example"));

  const zip = new AdmZip(zipPath);
  const entryNames = zip.getEntries().map((e) => e.entryName);
  return validateAuditZipEntries(entryNames, { requireEnvTestExample });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const zipPath = process.argv[2];
  const isHelp = zipPath === "--help" || zipPath === "-h";
  const ok = validateAuditZipFile(zipPath, ROOT);
  if (!ok) process.exit(1);
  if (!isHelp) console.log("AUDIT_ZIP_VALIDATION_PASS");
}

