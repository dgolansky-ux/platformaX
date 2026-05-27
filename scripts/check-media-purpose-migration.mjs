/**
 * Guard: MediaPurpose (code) must match the media_assets `purpose` CHECK (SQL).
 *
 * Rule: PX-MEDIA-004 / migration safety. The runtime union in
 * server/domains-v2/media/dto.ts and the persisted CHECK constraint must never
 * drift — otherwise a valid runtime purpose would be rejected by the database
 * (or vice versa).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DTO_PATH = join(ROOT, "server/domains-v2/media/dto.ts");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

let violations = 0;

function fail(msg) {
  console.error(`MEDIA_PURPOSE_MIGRATION_VIOLATION: ${msg}`);
  violations++;
}

if (!existsSync(DTO_PATH)) {
  fail("server/domains-v2/media/dto.ts not found");
} else if (!existsSync(MIGRATIONS_DIR)) {
  fail("supabase/migrations directory not found");
} else {
  const dtoContent = readFileSync(DTO_PATH, "utf-8");
  const unionMatch = dtoContent.match(/MediaPurpose\s*=\s*([^;]+);/);
  if (!unionMatch) {
    fail("could not locate `MediaPurpose` union in media/dto.ts");
  } else {
    const codeValues = new Set(
      [...unionMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    );

    const sqlValues = new Set();
    let foundCheck = false;
    let checkFile = "";
    for (const entry of readdirSync(MIGRATIONS_DIR)) {
      if (!entry.endsWith(".sql")) continue;
      const content = readFileSync(join(MIGRATIONS_DIR, entry), "utf-8");
      const checkMatch = content.match(/CHECK\s*\(\s*purpose\s+IN\s*\(([^)]*)\)/i);
      if (!checkMatch) continue;
      foundCheck = true;
      checkFile = relative(ROOT, join(MIGRATIONS_DIR, entry)).replace(/\\/g, "/");
      for (const m of checkMatch[1].matchAll(/'([^']+)'/g)) sqlValues.add(m[1]);
    }

    if (!foundCheck) {
      fail("no media `purpose` CHECK constraint found in any migration");
    } else {
      const codeArr = [...codeValues].sort();
      const sqlArr = [...sqlValues].sort();
      const missingInSql = codeArr.filter((v) => !sqlValues.has(v));
      const missingInCode = sqlArr.filter((v) => !codeValues.has(v));
      if (missingInSql.length > 0) {
        fail(
          `MediaPurpose has [${missingInSql.join(", ")}] not allowed by the migration CHECK in ${checkFile}`,
        );
      }
      if (missingInCode.length > 0) {
        fail(
          `migration CHECK in ${checkFile} allows [${missingInCode.join(", ")}] not present in MediaPurpose`,
        );
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-media-purpose-migration: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_MEDIA_PURPOSE_MIGRATION_PASS");
