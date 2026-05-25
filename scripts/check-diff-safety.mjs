import { execSync } from "child_process";

const BLOCKED_PATTERNS = [
  "VISUAL_DONE", "BACKEND_DONE", "FULL_DONE",
  "CURRENT_V2_SCOPE_CLEAN", "BRAMKA_COMPLETE",
  "window.alert", "window.confirm",
  'onClick={() => {}}',
  "readAsDataURL", "dataUrl", "base64 upload",
  "service_role", "DATABASE_URL", "postgresql://",
  "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY",
  "/seller", "/purchases", "/marketplace",
  "/calendar", "/notes", "/habits", "/tasks",
  "/pages", "/pasje", "/passions",
  "/fundraiser", "/donations", "/commerce", "/productivity",
];

const SAFE_FILE_PREFIXES = [
  "docs/",
  "scripts/",
  ".husky/",
  "commitlint.config",
];

const SAFE_FILE_PATTERNS = [
  /\.md$/,
  /\.test\.(ts|tsx|js|mjs)$/,
  /\.example$/,
];

function isSafeFile(filePath) {
  if (SAFE_FILE_PREFIXES.some(p => filePath.startsWith(p))) return true;
  if (SAFE_FILE_PATTERNS.some(p => p.test(filePath))) return true;
  return false;
}

function hasGit() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

if (!hasGit()) {
  console.log("DIFF_SAFETY_SKIPPED_NO_GIT");
  process.exit(0);
}

let diff = "";
try {
  diff = execSync("git diff --cached --diff-filter=ACMR", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  if (!diff) {
    diff = execSync("git diff --diff-filter=ACMR", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
  }
} catch {
  console.log("DIFF_SAFETY_NO_DIFF");
  process.exit(0);
}

if (!diff.trim()) {
  console.log("DIFF_SAFETY_NO_CHANGES");
  process.exit(0);
}

let violations = 0;
let currentFile = "";

for (const line of diff.split("\n")) {
  if (line.startsWith("diff --git")) {
    const match = line.match(/b\/(.+)$/);
    currentFile = match ? match[1] : "";
    continue;
  }

  if (!line.startsWith("+") || line.startsWith("+++")) continue;

  if (isSafeFile(currentFile)) continue;

  for (const pattern of BLOCKED_PATTERNS) {
    if (line.includes(pattern)) {
      console.error(`DIFF_SAFETY_VIOLATION: "${pattern}" in ${currentFile}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-diff-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DIFF_SAFETY_PASS");
