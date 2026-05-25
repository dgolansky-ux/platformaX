import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REVIEW_DIR = join(ROOT, "docs", "review");

const SELF_AUDIT_MARKER = "SELF-AUDIT / INDEPENDENT REVIEW PASS";
const HISTORICAL_MARKER = "HISTORICAL_REPORT_NO_SELF_AUDIT";

const REQUIRED_FIELDS = [
  "What I changed",
  "What I might have broken",
  "Domain boundaries affected",
  "Cross-domain imports check",
  "Legacy/runtime check",
  "Fake DONE/status truth check",
  "PII/base64/secrets check",
  "Routes/nav/build graph check",
  "Guard weakening check",
  "Evidence reviewed",
  "Gates run",
  "Remaining risks",
];

const ENFORCEMENT_START_STEP = 17;

let violations = 0;

if (!existsSync(REVIEW_DIR)) {
  console.log("CHECK_SELF_AUDIT_EVIDENCE_PASS (no review dir)");
  process.exit(0);
}

const stepFolders = readdirSync(REVIEW_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("step-"))
  .map((d) => d.name);

for (const folder of stepFolders) {
  const stepMatch = folder.match(/^step-(\d+)/);
  if (!stepMatch) continue;
  const stepNum = parseInt(stepMatch[1], 10);

  if (stepNum < ENFORCEMENT_START_STEP) continue;

  const folderPath = join(REVIEW_DIR, folder);
  const reportFiles = readdirSync(folderPath).filter(
    (f) => f.endsWith("_REPORT.md"),
  );

  for (const reportFile of reportFiles) {
    const reportPath = join(folderPath, reportFile);
    const content = readFileSync(reportPath, "utf-8");

    if (content.includes(HISTORICAL_MARKER)) continue;

    if (!content.includes(SELF_AUDIT_MARKER)) {
      console.error(
        `SELF_AUDIT_VIOLATION: ${folder}/${reportFile} missing SELF-AUDIT / INDEPENDENT REVIEW PASS section`,
      );
      violations++;
      continue;
    }

    const missingFields = [];
    for (const field of REQUIRED_FIELDS) {
      if (!content.includes(field)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.error(
        `SELF_AUDIT_VIOLATION: ${folder}/${reportFile} missing fields: ${missingFields.join(", ")}`,
      );
      violations++;
    }

    if (!content.includes("Evidence reviewed")) {
      console.error(
        `SELF_AUDIT_VIOLATION: ${folder}/${reportFile} missing Evidence reviewed field`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-self-audit-evidence: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SELF_AUDIT_EVIDENCE_PASS");
