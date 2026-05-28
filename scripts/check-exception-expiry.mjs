import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = process.cwd();
const EXCEPTIONS_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

const REQUIRED_BLOCK_FIELDS = [
  "PLATFORMAX_EXCEPTION:",
  "Rule:",
  "Scope:",
  "Reason:",
  "Risk:",
  "Owner:",
  "Expiry:",
  "Removal plan:",
  "Evidence:",
];

export function hasCanonicalExceptionBlock(content) {
  return REQUIRED_BLOCK_FIELDS.every((field) => content.includes(field));
}

export function parseExceptions(content) {
  const exceptions = [];
  const lines = content.split("\n");

  for (const line of lines) {
    if (!line.startsWith("| EXC-")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 9) continue;
    exceptions.push({
      id: cells[0],
      ruleId: cells[1],
      scope: cells[2],
      reason: cells[3],
      expiry: cells[4],
      owner: cells[5],
      evidence: cells[6],
      risk: cells[7],
      status: cells[8] || "active",
    });
  }

  return exceptions;
}

export function evaluateExceptionsRegister(content, today = new Date()) {
  const violations = [];
  const exceptions = parseExceptions(content);

  const requiredFields = [
    "id",
    "ruleId",
    "scope",
    "reason",
    "expiry",
    "owner",
    "risk",
    "evidence",
  ];

  for (const exc of exceptions) {
    for (const field of requiredFields) {
      if (!exc[field] || exc[field].trim() === "" || exc[field].trim() === "-") {
        violations.push(`${exc.id} missing required field: ${field}`);
      }
    }

    if (!/^PX-[A-Z0-9-]+-\d+$/.test(exc.ruleId) && !exc.ruleId.startsWith("check-")) {
      violations.push(`${exc.id} has no rule ID`);
    }

    if (exc.status === "active" || !exc.status) {
      if (!exc.expiry || exc.expiry.trim() === "" || exc.expiry.trim() === "-") {
        violations.push(`${exc.id} has no expiry date`);
      } else {
        const dateMatch = exc.expiry.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          const expiryDate = new Date(dateMatch[0]);
          if (!Number.isNaN(expiryDate.getTime()) && expiryDate < today) {
            violations.push(`${exc.id} is active but expired on ${dateMatch[0]}`);
          }
        }
      }
    }
  }

  return { exceptions, violations };
}

function main() {
  if (!existsSync(EXCEPTIONS_PATH)) {
    console.error("EXCEPTION_EXPIRY_FAIL: EXCEPTIONS_REGISTER.md not found");
    process.exit(1);
  }

  const content = readFileSync(EXCEPTIONS_PATH, "utf-8");
  const { exceptions, violations } = evaluateExceptionsRegister(content);

  if (!content.includes("PLATFORMAX_EXCEPTION:")) {
    violations.push("EXCEPTIONS_REGISTER missing canonical PLATFORMAX_EXCEPTION format");
  }

  for (const violation of violations) {
    console.error(`EXCEPTION_VIOLATION: ${violation}`);
  }

  if (violations.length > 0) {
    console.error(`\ncheck-exception-expiry: ${violations.length} violation(s)`);
    process.exit(1);
  }

  console.log(`CHECK_EXCEPTION_EXPIRY_PASS (${exceptions.length} exception(s) checked)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
