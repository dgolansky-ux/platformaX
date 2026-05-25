import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REVIEW_DIR = join(ROOT, "docs", "review");

const PRE_COMMIT_DECISION_MARKER = "PRE-COMMIT DECISION";
const HISTORICAL_MARKER = "HISTORICAL_REPORT_NO_PRE_COMMIT_DECISION";

const PRE_COMMIT_REQUIRED_FIELDS = [
  "Changed files:",
  "Domains touched:",
  "Cross-domain imports:",
  "Legacy runtime imports:",
  "Removed routes/nav/build chunks:",
  "Public DTO PII:",
  "Media base64/dataUrl:",
  "List pagination/limit/cursor:",
  "Fake DONE/status truth:",
  "Env safety:",
  "TypeScript:",
  "V2 lint:",
  "Tests:",
  "Build:",
  "Commit decision:",
];

const ENFORCEMENT_START_STEP = 17;

let violations = 0;

if (!existsSync(REVIEW_DIR)) {
  console.log("CHECK_PRE_COMMIT_DECISION_PASS (no review dir)");
  process.exit(0);
}

const stepFolders = readdirSync(REVIEW_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("step-"))
  .map((d) => d.name);

for (const folder of stepFolders) {
  const stepMatch = folder.match(/^step-(\d+)/);
  if (!stepMatch) continue;
  const stepNum = parseInt(stepMatch[1], 10);

  const folderPath = join(REVIEW_DIR, folder);
  const reportFiles = readdirSync(folderPath).filter(
    (f) => f.endsWith("_REPORT.md") || f === "STEP_" + stepMatch[1] + "_REPORT.md",
  );

  if (reportFiles.length === 0) continue;

  for (const reportFile of reportFiles) {
    const reportPath = join(folderPath, reportFile);
    const content = readFileSync(reportPath, "utf-8");

    if (content.includes(HISTORICAL_MARKER)) {
      continue;
    }

    if (stepNum < ENFORCEMENT_START_STEP) {
      continue;
    }

    if (!content.includes(PRE_COMMIT_DECISION_MARKER)) {
      console.error(
        `PRE_COMMIT_DECISION_VIOLATION: ${folder}/${reportFile} missing PRE-COMMIT DECISION section`,
      );
      violations++;
      continue;
    }

    const missingFields = [];
    for (const field of PRE_COMMIT_REQUIRED_FIELDS) {
      if (!content.includes(field)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.error(
        `PRE_COMMIT_DECISION_VIOLATION: ${folder}/${reportFile} missing fields: ${missingFields.join(", ")}`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-pre-commit-decision: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PRE_COMMIT_DECISION_PASS");
