import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

const DESTRUCTIVE_PATTERNS = [
  { pattern: /DROP\s+TABLE/i, label: "DROP TABLE" },
  { pattern: /DROP\s+COLUMN/i, label: "DROP COLUMN" },
  { pattern: /\bTRUNCATE\b/i, label: "TRUNCATE" },
  { pattern: /DELETE\s+FROM\s+\w+\s*;/i, label: "DELETE FROM without WHERE" },
  { pattern: /DELETE\s+FROM\s+\w+\s*$/im, label: "DELETE FROM without WHERE" },
  { pattern: /ALTER\s+(?:TABLE\s+\w+\s+)?ALTER\s+COLUMN\s+\w+\s+(?:SET\s+DATA\s+)?TYPE/i, label: "ALTER COLUMN TYPE" },
  { pattern: /ALTER\s+TABLE\s+\w+\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/i, label: "disable RLS" },
];

const APPROVAL_MARKER = "MIGRATION_APPROVED:";
const REVIEW_MARKER = "MIGRATION_REVIEW:";

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

let violations = 0;

if (!existsSync(MIGRATIONS_DIR)) {
  console.log("CHECK_MIGRATION_SAFETY_PASS (no migrations directory)");
  process.exit(0);
}

const migrationFiles = walk(MIGRATIONS_DIR).filter(f => /\.sql$/i.test(f));

for (const fp of migrationFiles) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = relative(ROOT, fp).replace(/\\/g, "/");

  for (const { pattern, label } of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(content)) {
      if (content.includes(APPROVAL_MARKER)) continue;
      console.error(`MIGRATION_SAFETY_VIOLATION: ${rel} contains destructive pattern: ${label} — requires manual approval (add ${APPROVAL_MARKER} comment)`);
      violations++;
    }
  }

  if (content.toLowerCase().includes("supabase db push")) {
    console.error(`MIGRATION_SAFETY_VIOLATION: ${rel} references live db push — forbidden without separate decision`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`\ncheck-migration-safety: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_MIGRATION_SAFETY_PASS");
