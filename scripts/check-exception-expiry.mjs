import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const EXCEPTIONS_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

function parseExceptions(content) {
  const exceptions = [];
  const lines = content.split("\n");
  let inTable = false;
  let headerParsed = false;

  for (const line of lines) {
    if (line.includes("| Exception ID") || line.includes("| EXC-")) {
      inTable = true;
    }
    if (!inTable) continue;
    if (line.includes("---")) { headerParsed = true; continue; }
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 7) continue;
    if (cells[0] === "Exception ID" || cells[0] === "Field") continue;

    if (/^EXC-\d+$/.test(cells[0])) {
      exceptions.push({
        id: cells[0],
        ruleId: cells[1] || "",
        reason: cells[2] || "",
        expiry: cells[3] || "",
        owner: cells[4] || "",
        evidence: cells[5] || "",
        risk: cells[6] || "",
        status: cells[7] || "active",
      });
    }
  }

  return exceptions;
}

let violations = 0;

if (!existsSync(EXCEPTIONS_PATH)) {
  console.error("EXCEPTION_EXPIRY_FAIL: EXCEPTIONS_REGISTER.md not found");
  process.exit(1);
}

const content = readFileSync(EXCEPTIONS_PATH, "utf-8");

if (content.includes("No active exceptions") && !content.includes("EXC-")) {
  console.log("CHECK_EXCEPTION_EXPIRY_PASS (no active exceptions)");
  process.exit(0);
}

const exceptions = parseExceptions(content);

const REQUIRED_FIELDS = ["id", "ruleId", "reason", "expiry", "owner", "risk", "evidence"];

for (const exc of exceptions) {
  for (const field of REQUIRED_FIELDS) {
    if (!exc[field] || exc[field].trim() === "" || exc[field].trim() === "-") {
      console.error(`EXCEPTION_VIOLATION: ${exc.id} missing required field: ${field}`);
      violations++;
    }
  }

  if (exc.status === "active" || !exc.status || exc.status === "") {
    if (exc.expiry && exc.expiry.trim() !== "" && exc.expiry.trim() !== "-") {
      const expiryDate = new Date(exc.expiry);
      if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
        console.error(`EXCEPTION_VIOLATION: ${exc.id} is active but expired on ${exc.expiry} — must be revoked`);
        violations++;
      }
    }

    if (!exc.expiry || exc.expiry.trim() === "" || exc.expiry.trim() === "-") {
      console.error(`EXCEPTION_VIOLATION: ${exc.id} has no expiry date — all exceptions must be time-bound`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-exception-expiry: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_EXCEPTION_EXPIRY_PASS");
