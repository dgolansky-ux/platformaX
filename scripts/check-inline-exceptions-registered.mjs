/**
 * check-inline-exceptions-registered — enforce EXCEPTIONS_REGISTER.md is the
 * single source of truth for inline guard escape hatches.
 *
 * Some guards (file-size, code-quality-structure) allow a file to skip the
 * check when it contains a `QUALITY_STRUCTURE_EXCEPTION` / `ALLOW_FILE_SIZE_EXCEPTION`
 * comment marker. Without this guard those markers silently bypass governance:
 * a file can carry the marker forever while EXCEPTIONS_REGISTER.md says "no
 * active exceptions" — that mismatch is exactly the trust hole governance is
 * meant to close.
 *
 * This guard fails when a file containing one of the inline markers is NOT
 * listed in the active rows of EXCEPTIONS_REGISTER.md (under a `Files` column).
 * Rule: PX-EXC-001 (exceptions require owner/reason/expiry/risk/evidence) +
 * PX-EXC-002 (expired/missing exceptions fail gates).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EXCEPTIONS_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

const SCAN_DIRS = [
  "client/src",
  "server",
  "shared",
  "scripts",
  "supabase",
];

const MARKERS = [
  "QUALITY_STRUCTURE_EXCEPTION",
  "ALLOW_FILE_SIZE_EXCEPTION",
  "ALLOW_PRIVATE_DTO_PII",
  "PLATFORMAX_EXCEPTION",
];

// Files that own/define the marker tokens themselves (guard scripts, tests,
// docs). They reference the markers as data, not as an escape hatch.
const MARKER_OWNERS = new Set([
  "scripts/check-inline-exceptions-registered.mjs",
  "scripts/check-code-quality-structure.mjs",
  "scripts/check-file-complexity.mjs",
  "scripts/check-file-size-limits.mjs",
  "scripts/check-public-dto-pii.mjs",
  "scripts/check-dto-privacy-classification.mjs",
]);

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

function parseActiveRegisteredFiles() {
  if (!existsSync(EXCEPTIONS_PATH)) return { entries: [], registered: new Set() };
  const content = readFileSync(EXCEPTIONS_PATH, "utf-8");
  const lines = content.split("\n");
  const entries = [];
  const registered = new Set();
  let inActiveTable = false;
  let sawHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+Active Exceptions/i.test(trimmed)) {
      inActiveTable = true;
      sawHeader = false;
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      inActiveTable = false;
      sawHeader = false;
      continue;
    }
    if (!inActiveTable) continue;
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cells = line.split("|").map((c) => c.trim());
    // raw split keeps leading/trailing empty cells from the surrounding pipes —
    // drop them so column indexes line up with the header.
    while (cells.length && cells[0] === "") cells.shift();
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length < 9) continue;
    if (/^Exception ID$/i.test(cells[0])) {
      sawHeader = true;
      continue;
    }
    if (!sawHeader) continue;
    if (!/^EXC-\d+$/.test(cells[0])) continue;

    const status = cells[7] || "active";
    if (status !== "active") continue;

    const filesCell = cells[8] || "";
    const filePaths = filesCell
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    entries.push({ id: cells[0], ruleId: cells[1], files: filePaths });
    for (const f of filePaths) registered.add(f.replace(/^\.\//, ""));
  }

  return { entries, registered };
}

function findInlineMarkers() {
  const hits = [];
  for (const scanDir of SCAN_DIRS) {
    const absDir = join(ROOT, scanDir);
    if (!existsSync(absDir)) continue;
    for (const fp of walk(absDir)) {
      if (!/\.(ts|tsx|js|jsx|mjs|css|scss|sql)$/.test(fp)) continue;
      const rel = relative(ROOT, fp).replace(/\\/g, "/");
      if (MARKER_OWNERS.has(rel)) continue;
      if (rel.includes("__tests__/")) continue;
      let content;
      try { content = readFileSync(fp, "utf-8"); } catch { continue; }
      const matched = MARKERS.filter((m) => content.includes(m));
      if (matched.length) hits.push({ rel, markers: matched });
    }
  }
  return hits;
}

const { registered, entries } = parseActiveRegisteredFiles();
const hits = findInlineMarkers();

let violations = 0;
for (const hit of hits) {
  if (!registered.has(hit.rel)) {
    console.error(
      `INLINE_EXCEPTION_UNREGISTERED: ${hit.rel} carries marker(s) [${hit.markers.join(", ")}] but is not listed in any active row of EXCEPTIONS_REGISTER.md (Files column).`,
    );
    violations++;
  }
}

// Reverse: every active register entry must point at a file that actually
// carries the marker — otherwise the register grows stale exceptions for files
// that no longer need them.
for (const entry of entries) {
  for (const f of entry.files) {
    const rel = f.replace(/^\.\//, "");
    if (!hits.some((h) => h.rel === rel)) {
      console.error(
        `INLINE_EXCEPTION_STALE: ${entry.id} lists "${rel}" but the file no longer contains any inline exception marker — revoke or remove the entry.`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-inline-exceptions-registered: ${violations} violation(s)`);
  process.exit(1);
}

console.log(
  `CHECK_INLINE_EXCEPTIONS_REGISTERED_PASS (${hits.length} marker file(s), ${entries.length} active register entry/entries)`,
);
