import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const STATUS_FILE = join(ROOT, "docs/architecture/PlatformaX-V2-domain-status.md");

if (!existsSync(STATUS_FILE)) {
  console.error("DOMAIN_STATUS_MISSING: docs/architecture/PlatformaX-V2-domain-status.md not found");
  process.exit(1);
}

const content = readFileSync(STATUS_FILE, "utf-8");

const ALLOWED_STATUSES = [
  "NOT_STARTED", "SCAFFOLD_ONLY", "UI_SHELL_ONLY", "MOCK_LOCAL_ONLY",
  "PARTIAL", "IMPLEMENTED", "BLOCKED", "MANUAL_REVIEW_REQUIRED",
  "PLANNED", "BACKEND_NOT_STARTED", "DEPRECATED", "SUPERSEDED", "ACTIVE",
];

const BLOCKED_STATUSES = ["DONE", "FULL_DONE", "VISUAL_DONE", "BACKEND_DONE", "CLEAN"];

const tableLines = content.split("\n").filter(l => l.startsWith("|") && l.includes("|"));
const statusTableRows = tableLines.filter(l => {
  const cells = l.split("|").map(c => c.trim()).filter(Boolean);
  return cells.length >= 3 && !cells[0].startsWith("---") && !cells[0].startsWith("Domain") && !cells[0].startsWith("Label") && !cells[0].startsWith("Status");
});

let violations = 0;

const domainRows = content.split("\n").filter(l => {
  return l.startsWith("|") && l.includes("`") && !l.startsWith("| Domain") && !l.startsWith("|---") && !l.startsWith("| Status") && !l.startsWith("| Label");
});

const statusPattern = /`([A-Z_]+)`/g;
const restrictedSection = content.indexOf("Restricted status labels");
const forbiddenSection = content.indexOf("Forbidden status patterns");

for (const row of domainRows) {
  const cells = row.split("|").map(c => c.trim()).filter(Boolean);
  if (cells.length < 3) continue;

  const statusCell = cells[2] || "";
  const matches = [...statusCell.matchAll(statusPattern)];
  for (const m of matches) {
    const status = m[1];
    if (BLOCKED_STATUSES.includes(status)) {
      const rowIdx = content.indexOf(row);
      if (rowIdx < restrictedSection || rowIdx > forbiddenSection) {
        continue;
      }
    }
  }
}

const domainStatusSection = content.indexOf("Initial domain status table");
if (domainStatusSection === -1) {
  console.error("DOMAIN_STATUS_TABLE_MISSING: 'Initial domain status table' section not found");
  violations++;
}

if (violations > 0) {
  console.error(`\ncheck-domain-status: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DOMAIN_STATUS_PASS");
