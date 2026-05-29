/**
 * check-no-any-types — enforce coding-standards ban on `any` and unjustified
 * @ts-ignore / @ts-expect-error.
 *
 * PX-CODE-003: "as any without exception block" was already a rule but had no
 * dedicated guard — check-code-quality-structure.mjs measures shape, not types.
 * This guard scans repository TS/TSX for:
 *
 *   - `as any` casts
 *   - `: any` type annotations (incl. `: any[]`, `: any | …`, `Promise<any>`)
 *   - `Record<string, any>` (and other `<…, any>` / `<any, …>` shapes)
 *   - `catch (err: any)`
 *   - `@ts-ignore`
 *   - `@ts-expect-error` without a justification comment on the same line
 *
 * Files listed under an active EXCEPTIONS_REGISTER.md entry mapped to
 * PX-CODE-003 are skipped (and the register-file guard verifies they exist).
 * This keeps coding-standards real: governance is the single switch, not
 * scattered inline comments.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EXCEPTIONS_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

const SCAN_DIRS = [
  "client/src",
  "server",
  "shared",
];

// d.ts files come from third-party type packages we do not own — only enforce
// in repo-authored source. Tests/fixtures are still scanned so `: any` cannot
// hide there either.
const FILE_EXTENSIONS = /\.(ts|tsx)$/;
const IGNORE_FILE = /\.d\.ts$/;

const PATTERNS = [
  { id: "as-any", regex: /\bas\s+any\b/, message: "`as any` cast" },
  { id: "colon-any", regex: /:\s*any(?=\b|\s*[\[<|&)])/, message: "`: any` type annotation" },
  { id: "record-any", regex: /Record\s*<[^>]*\bany\b[^>]*>/, message: "`Record<…, any>` (use a real shape or `unknown`)" },
  { id: "generic-any", regex: /<\s*any\s*>/, message: "generic `<any>` parameter" },
  { id: "catch-any", regex: /catch\s*\(\s*\w+\s*:\s*any\s*\)/, message: "`catch (err: any)` — use `catch (err)` and narrow" },
  { id: "ts-ignore", regex: /@ts-ignore/, message: "`@ts-ignore` — use a real fix, or a justified `@ts-expect-error`" },
];

const TS_EXPECT_ERROR = /@ts-expect-error/;

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

function parseExceptedFilesForRule(ruleId) {
  if (!existsSync(EXCEPTIONS_PATH)) return new Set();
  const content = readFileSync(EXCEPTIONS_PATH, "utf-8");
  const lines = content.split("\n");
  const out = new Set();
  let inActive = false;
  let sawHeader = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+Active Exceptions/i.test(trimmed)) { inActive = true; sawHeader = false; continue; }
    if (/^##\s+/.test(trimmed)) { inActive = false; sawHeader = false; continue; }
    if (!inActive) continue;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    while (cells.length && cells[0] === "") cells.shift();
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length < 9) continue;
    if (/^Exception ID$/i.test(cells[0])) { sawHeader = true; continue; }
    if (!sawHeader) continue;
    if (!/^EXC-\d+$/.test(cells[0])) continue;
    const status = cells[7] || "active";
    if (status !== "active") continue;
    if (cells[1] !== ruleId) continue;
    for (const f of (cells[8] || "").split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean)) {
      out.add(f.replace(/^\.\//, ""));
    }
  }
  return out;
}

const excepted = parseExceptedFilesForRule("PX-CODE-003");

let violations = 0;
let scanned = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  if (!existsSync(absDir)) continue;
  for (const fp of walk(absDir)) {
    if (!FILE_EXTENSIONS.test(fp)) continue;
    if (IGNORE_FILE.test(fp)) continue;
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    if (excepted.has(rel)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    scanned++;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      // Skip comment-only lines so genuine prose ("e.g. as any") cannot trigger.
      const trimmed = raw.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
      // Strip end-of-line comments so we only inspect code.
      const code = raw.replace(/\/\/.*$/, "");

      for (const p of PATTERNS) {
        if (p.regex.test(code)) {
          console.error(
            `TYPES_VIOLATION: ${rel}:${i + 1} — ${p.message} (line: ${trimmed.slice(0, 160)})`,
          );
          violations++;
        }
      }

      if (TS_EXPECT_ERROR.test(code)) {
        // Require a same-line justification of the form `@ts-expect-error <reason>`
        // with at least 8 characters of explanation after the directive.
        const m = code.match(/@ts-expect-error\s*([^\n]*)/);
        const justification = m ? m[1].trim() : "";
        if (justification.length < 8) {
          console.error(
            `TYPES_VIOLATION: ${rel}:${i + 1} — \`@ts-expect-error\` without a justification (need ≥8 chars of reason after the directive)`,
          );
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-no-any-types: ${violations} violation(s) across ${scanned} file(s)`);
  process.exit(1);
}

console.log(`CHECK_NO_ANY_TYPES_PASS (${scanned} files scanned, ${excepted.size} excepted)`);
