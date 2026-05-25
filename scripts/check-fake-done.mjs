import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = ["docs", "client", "server", "shared", "scripts"];
const SCAN_FILES = ["package.json"];

const FORBIDDEN = [
  "VISUAL_DONE",
  "BACKEND_DONE",
  "FULL_DONE",
  "BRAMKA_COMPLETE",
  "CURRENT_V2_SCOPE_CLEAN",
  "READY_FOR_PRODUCTION",
  "PRODUCTION_READY",
];

const ALLOWLIST_MARKER = "ALLOW_STATUS_TERM_IN_POLICY_DOC";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let violations = 0;
const files = [];
for (const d of SCAN_DIRS) {
  files.push(...walk(join(ROOT, d)));
}
for (const f of SCAN_FILES) {
  const fp = join(ROOT, f);
  if (existsSync(fp)) files.push(fp);
}

for (const fp of files) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  if (content.includes(ALLOWLIST_MARKER)) continue;
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  for (const term of FORBIDDEN) {
    if (content.includes(term)) {
      const isPolicyDoc =
        rel.startsWith("docs/") ||
        rel.startsWith("scripts/");
      if (isPolicyDoc) continue;
      console.error(`FAKE_DONE_VIOLATION: "${term}" in ${rel}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-fake-done: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_FAKE_DONE_PASS");
