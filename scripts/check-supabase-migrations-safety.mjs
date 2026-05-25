import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const MIGRATION_DIRS = [
  "supabase/migrations",
  "migrations",
  "db/migrations",
];

const BLOCKED_PATTERNS = [
  "DROP TABLE",
  "TRUNCATE",
  "ALTER TABLE DROP COLUMN",
  "DISABLE ROW LEVEL SECURITY",
  "USING true",
];

const REVIEW_MARKER = "REVIEW_REQUIRED";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let migrationsExist = false;
let violations = 0;

for (const migDir of MIGRATION_DIRS) {
  const absDir = join(ROOT, migDir);
  if (!existsSync(absDir)) continue;

  const files = walk(absDir);
  const sqlFiles = files.filter(f => f.endsWith(".sql"));
  if (sqlFiles.length === 0) continue;

  migrationsExist = true;

  for (const fp of sqlFiles) {
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");

    for (const pattern of BLOCKED_PATTERNS) {
      if (content.toUpperCase().includes(pattern.toUpperCase())) {
        if (!content.includes(REVIEW_MARKER)) {
          console.error(`MIGRATION_SAFETY_VIOLATION: "${pattern}" in ${rel}`);
          violations++;
        }
      }
    }
  }
}

if (!migrationsExist) {
  console.log("MIGRATION_SAFETY_SKIPPED_NO_MIGRATIONS");
  process.exit(0);
}

if (violations > 0) {
  console.error(`\ncheck-supabase-migrations-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_SUPABASE_MIGRATIONS_SAFETY_PASS");
