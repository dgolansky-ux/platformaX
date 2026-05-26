/**
 * PR merge eligibility checker.
 * Usage: node scripts/check-pr-merge-eligibility.mjs <PR_NUMBER>
 *
 * Checks whether a PR meets all controlled-merge conditions (PX-GOV-006).
 * Does NOT perform the merge — only reports eligibility.
 */
import { execSync } from "node:child_process";

const prNumber = process.argv[2];

if (!prNumber || !/^\d+$/.test(prNumber)) {
  console.error("Usage: node scripts/check-pr-merge-eligibility.mjs <PR_NUMBER>");
  process.exit(1);
}

let failures = 0;
function check(label, ok) {
  const status = ok ? "PASS" : "FAIL";
  console.log(`  [${status}] ${label}`);
  if (!ok) failures++;
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err) {
    return null;
  }
}

const authStatus = run("gh auth status");
check("gh auth status", authStatus !== null);
if (authStatus === null) {
  console.error("\nBLOCKED: gh CLI not authenticated. Run `gh auth login` first.");
  process.exit(1);
}

const prJson = run(`gh pr view ${prNumber} --json baseRefName,headRefName,isDraft,mergeStateStatus,statusCheckRollup,state`);
if (!prJson) {
  console.error(`\nBLOCKED: PR #${prNumber} not found or not accessible.`);
  process.exit(1);
}

let pr;
try {
  pr = JSON.parse(prJson);
} catch {
  console.error("\nBLOCKED: Failed to parse PR JSON.");
  process.exit(1);
}

check(`PR state is OPEN (got: ${pr.state})`, pr.state === "OPEN");
check(`baseRefName is main (got: ${pr.baseRefName})`, pr.baseRefName === "main");
check(`headRefName is not main (got: ${pr.headRefName})`, pr.headRefName !== "main");
check(`PR is not draft (isDraft: ${pr.isDraft})`, pr.isDraft === false);

const hasConflict = pr.mergeStateStatus === "DIRTY" || pr.mergeStateStatus === "BLOCKED";
check(`No merge conflicts (mergeStateStatus: ${pr.mergeStateStatus})`, !hasConflict);

const checks = pr.statusCheckRollup || [];
const allGreen = checks.length > 0 && checks.every(c => c.conclusion === "SUCCESS" || c.status === "COMPLETED");
check(`All CI checks green (${checks.length} checks)`, allGreen);

const gitStatus = run("git status --porcelain");
check("Working tree is clean", gitStatus !== null && gitStatus === "");

console.log("");
if (failures > 0) {
  console.error(`PR #${prNumber} is NOT eligible for merge (${failures} condition(s) failed)`);
  process.exit(1);
}

console.log(`PR #${prNumber} is ELIGIBLE for controlled merge`);
console.log("Note: Merge still requires explicit owner instruction in the current task.");
