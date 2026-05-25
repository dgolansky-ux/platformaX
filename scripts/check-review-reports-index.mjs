import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REVIEW_DIR = join(ROOT, "docs", "review");
const INDEX_PATH = join(REVIEW_DIR, "REVIEW_REPORTS_INDEX.md");

const ALLOWED_STATUSES = new Set([
  "ACTIVE_EVIDENCE",
  "HISTORICAL_REPORT",
  "OUTDATED_BY_NEW_AUDIT",
  "SUPERSEDED",
  "BLOCKED",
  "MANUAL_REVIEW_REQUIRED",
]);

const BANNED_STATUSES = [
  "DONE", "FULL_DONE", "CLEAN", "FINAL_DONE",
  "COMPLETE", "BRAMKA_COMPLETE",
];

let violations = 0;

if (!existsSync(INDEX_PATH)) {
  console.error("REVIEW_INDEX_VIOLATION: REVIEW_REPORTS_INDEX.md does not exist");
  process.exit(1);
}

const content = readFileSync(INDEX_PATH, "utf-8");
const lines = content.split("\n");

const stepFolders = existsSync(REVIEW_DIR)
  ? readdirSync(REVIEW_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("step-"))
      .map((d) => d.name)
  : [];

const tableLines = lines.filter(
  (l) => l.startsWith("| step-") && l.includes("|"),
);

const indexedSteps = new Map();
for (const line of tableLines) {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  if (cells.length < 6) continue;

  const reportName = cells[0];
  const status = cells[5];
  const supersededBy = cells[6] || "";

  indexedSteps.set(reportName, { status, supersededBy, raw: line });
}

for (const folder of stepFolders) {
  if (!indexedSteps.has(folder)) {
    console.error(`REVIEW_INDEX_VIOLATION: folder "${folder}" has no entry in index`);
    violations++;
  }
}

for (const [name, entry] of indexedSteps) {
  if (!ALLOWED_STATUSES.has(entry.status)) {
    console.error(`REVIEW_INDEX_VIOLATION: "${name}" has invalid status "${entry.status}"`);
    violations++;
  }

  for (const banned of BANNED_STATUSES) {
    if (entry.status === banned) {
      console.error(`REVIEW_INDEX_VIOLATION: "${name}" uses banned status "${banned}"`);
      violations++;
    }
  }

  if (entry.status === "ACTIVE_EVIDENCE") {
    const hasEvidence =
      entry.raw.includes("Evidence:") ||
      entry.raw.includes("REPORT.md") ||
      entry.raw.includes("MANUAL_REVIEW_REQUIRED");
    if (!hasEvidence) {
      console.error(`REVIEW_INDEX_VIOLATION: "${name}" is ACTIVE_EVIDENCE but has no evidence path`);
      violations++;
    }
  }

  if (entry.status === "SUPERSEDED") {
    const hasSuperseeded =
      entry.supersededBy && entry.supersededBy !== "—" && entry.supersededBy !== "-" && entry.supersededBy.trim() !== "";
    if (!hasSuperseeded) {
      console.error(`REVIEW_INDEX_VIOLATION: "${name}" is SUPERSEDED but has no Superseded by`);
      violations++;
    }
  }
}

for (const [name, entry] of indexedSteps) {
  if (entry.status === "ACTIVE_EVIDENCE") {
    for (const [otherName, otherEntry] of indexedSteps) {
      if (otherName === name) continue;
      if (
        otherEntry.supersededBy &&
        otherEntry.supersededBy.includes(name.replace("step-", ""))
      ) {
        continue;
      }
      if (
        otherEntry.status === "SUPERSEDED" &&
        otherEntry.supersededBy === name
      ) {
        continue;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-review-reports-index: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_REVIEW_REPORTS_INDEX_PASS");
