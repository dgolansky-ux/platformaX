import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const EXCEPTION_MARKER = "DEPENDENCY_DECISION:";

function getGitDiff() {
  try {
    return execSync("git diff HEAD --name-only", { cwd: ROOT, encoding: "utf-8" });
  } catch {
    try {
      return execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf-8" });
    } catch { return ""; }
  }
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

let violations = 0;

const changedFiles = getGitDiff().split("\n").filter(Boolean);
const hasPackageJsonChange = changedFiles.some(f => f === "package.json");
const hasLockfileChange = changedFiles.some(f => f === "pnpm-lock.yaml");

if (hasPackageJsonChange || hasLockfileChange) {
  let hasDependencyDecision = false;

  const reviewDir = join(ROOT, "docs/review");
  if (existsSync(reviewDir)) {
    const reviewFiles = walkDir(reviewDir);
    for (const rf of reviewFiles) {
      try {
        const content = readFileSync(rf, "utf-8");
        if (content.includes(EXCEPTION_MARKER) || content.includes("DEPENDENCY_DECISION") || content.includes("dependency decision")) {
          hasDependencyDecision = true;
          break;
        }
      } catch {}
    }
  }

  if (!hasDependencyDecision) {
    const changedReviewFiles = changedFiles.filter(f => f.startsWith("docs/review/") && f.endsWith(".md"));
    for (const rf of changedReviewFiles) {
      try {
        const content = readFileSync(join(ROOT, rf), "utf-8");
        if (content.includes(EXCEPTION_MARKER) || content.includes("DEPENDENCY_DECISION") || content.includes("dependency decision")) {
          hasDependencyDecision = true;
          break;
        }
      } catch {}
    }
  }

  if (!hasDependencyDecision && (hasPackageJsonChange || hasLockfileChange)) {
    try {
      const diff = execSync("git diff HEAD -- package.json", { cwd: ROOT, encoding: "utf-8" });
      const addedLines = diff.split("\n").filter(l => l.startsWith("+") && !l.startsWith("+++"));
      const hasNewDeps = addedLines.some(l => /"\w[^"]*"\s*:\s*"[\^~]?\d/.test(l));
      if (hasNewDeps) {
        console.error("DEPENDENCY_CHANGE_VIOLATION: package.json has new dependency additions but no DEPENDENCY_DECISION in review report");
        violations++;
      }
    } catch {}
  }
}

if (violations > 0) {
  console.error(`\ncheck-dependency-change-policy: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DEPENDENCY_CHANGE_POLICY_PASS");
