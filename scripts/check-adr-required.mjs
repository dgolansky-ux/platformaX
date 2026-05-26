import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

const ARCHITECTURE_IMPACTING_PATTERNS = [
  "docs/governance/RULES_REGISTRY.yml",
  "docs/governance/DOMAIN_STATUS_REGISTRY.yml",
  "server/domains-v2/domain-registry.ts",
  "supabase/migrations/",
  ".github/workflows/",
  "docs/architecture/",
];

const ARCHITECTURE_IMPACTING_PREFIXES = [
  "scripts/check-",
];

const ARCHITECTURE_IMPACTING_REGEX = [
  /^server\/domains-v2\/[^/]+\/public-api\.ts$/,
];

const ADR_DECISION_MARKERS = [
  "ADR IMPACT DECISION",
  "ADR_IMPACT_DECISION",
  "NO_ADR_REQUIRED",
  "ADR:",
  "adr/ADR-",
];

function getChangedFiles() {
  try {
    const staged = execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf-8" });
    const unstaged = execSync("git diff HEAD --name-only", { cwd: ROOT, encoding: "utf-8" });
    const combined = new Set([...staged.split("\n"), ...unstaged.split("\n")].filter(Boolean));
    return [...combined];
  } catch { return []; }
}

function isArchitectureImpacting(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  for (const pattern of ARCHITECTURE_IMPACTING_PATTERNS) {
    if (normalized === pattern || normalized.startsWith(pattern)) return true;
  }
  for (const prefix of ARCHITECTURE_IMPACTING_PREFIXES) {
    if (normalized.startsWith(prefix)) return true;
  }
  for (const regex of ARCHITECTURE_IMPACTING_REGEX) {
    if (regex.test(normalized)) return true;
  }
  return false;
}

function walkDir(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walkDir(full));
      else if (entry.name.endsWith(".md")) results.push(full);
    }
  } catch {}
  return results;
}

function findAdrDecisionInReports() {
  const reviewDir = join(ROOT, "docs/review");
  if (!existsSync(reviewDir)) return false;

  const reportFiles = walkDir(reviewDir);
  for (const rf of reportFiles) {
    try {
      const content = readFileSync(rf, "utf-8");
      if (ADR_DECISION_MARKERS.some(m => content.includes(m))) return true;
    } catch {}
  }
  return false;
}

let violations = 0;

const changedFiles = getChangedFiles();
const architectureChanges = changedFiles.filter(isArchitectureImpacting);

if (architectureChanges.length > 0) {
  let hasAdrDecision = findAdrDecisionInReports();

  if (!hasAdrDecision) {
    const changedReviewFiles = changedFiles.filter(f => f.startsWith("docs/review/") && f.endsWith(".md"));
    for (const rf of changedReviewFiles) {
      try {
        const content = readFileSync(join(ROOT, rf), "utf-8");
        if (ADR_DECISION_MARKERS.some(m => content.includes(m))) {
          hasAdrDecision = true;
          break;
        }
      } catch {}
    }
  }

  if (!hasAdrDecision) {
    console.error("ADR_REQUIRED_VIOLATION: Architecture-impacting files changed without ADR IMPACT DECISION in review report:");
    for (const f of architectureChanges) {
      console.error(`  - ${f}`);
    }
    violations++;
  }
}

if (violations > 0) {
  console.error(`\ncheck-adr-required: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_ADR_REQUIRED_PASS");
