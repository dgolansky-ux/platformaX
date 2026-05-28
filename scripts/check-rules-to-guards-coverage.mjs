import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const MATRIX_PATH = join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md");

let violations = 0;

if (!existsSync(RULES_PATH)) {
  console.error("RULES_COVERAGE_VIOLATION: docs/governance/RULES_REGISTRY.yml does not exist");
  process.exit(1);
}
if (!existsSync(MATRIX_PATH)) {
  console.error("RULES_COVERAGE_VIOLATION: docs/governance/RULES_TO_GUARDS_MATRIX.md does not exist");
  process.exit(1);
}

function parseRules(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const entries = [];
  let current = null;
  let currentKey = null;

  for (const line of lines) {
    if (line.match(/^\s*#/) || line.trim() === "") continue;

    if (line.match(/^\s*- id:\s*/)) {
      if (current) entries.push(current);
      current = { id: line.replace(/^\s*- id:\s*/, "").trim() };
      currentKey = "id";
      continue;
    }

    if (!current) continue;

    const kvMatch = line.match(/^\s{4}(\w[\w_]*):\s*(.*)/);
    if (kvMatch) {
      const [, key, rawVal] = kvMatch;
      currentKey = key;
      const val = rawVal.trim();

      if (val === "null" || val === "") {
        current[key] = null;
      } else if (val.startsWith("[") && val.endsWith("]")) {
        current[key] = val.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      } else if (val === ">") {
        current[key] = "";
      } else {
        current[key] = val;
      }
      continue;
    }

    const listItemMatch = line.match(/^\s{6}- (.+)/);
    if (listItemMatch && currentKey) {
      if (!Array.isArray(current[currentKey])) {
        current[currentKey] = current[currentKey] ? [current[currentKey]] : [];
      }
      current[currentKey].push(listItemMatch[1].trim());
      continue;
    }
  }
  if (current) entries.push(current);
  return entries;
}

const rules = parseRules(RULES_PATH);
const matrixContent = readFileSync(MATRIX_PATH, "utf-8");

// Every registered rule must have a row in the human-readable mapping matrix,
// so the rules→guards traceability never silently drifts (this is how the
// PX-CODE-001..004 coverage gap slipped through previously).
for (const rule of rules) {
  if (!matrixContent.includes(rule.id)) {
    console.error(`RULES_COVERAGE_VIOLATION: rule "${rule.id}" (${rule.title}) is missing from RULES_TO_GUARDS_MATRIX.md`);
    violations++;
  }
}

const p0ActiveRules = rules.filter(
  (r) => r.severity === "P0" && r.status === "active"
);

for (const rule of p0ActiveRules) {
  const enforced = rule.enforced_by;

  if (!enforced || (Array.isArray(enforced) && enforced.length === 0)) {
    console.error(`RULES_COVERAGE_VIOLATION: P0 active rule "${rule.id}" (${rule.title}) has no enforced_by`);
    violations++;
    continue;
  }

  const enforcedList = Array.isArray(enforced) ? enforced : [enforced];

  const hasRealEnforcement = enforcedList.some(
    (e) => e && e !== "manual_gate"
  );
  const hasManualGate = enforcedList.some(
    (e) => e === "manual_gate"
  );

  if (!hasRealEnforcement && !hasManualGate) {
    console.error(`RULES_COVERAGE_VIOLATION: P0 active rule "${rule.id}" (${rule.title}) has no valid enforcement`);
    violations++;
  }
}

// === enforced_by references must exist =====================================
// A rule that lists "scripts/check-foo.mjs" as enforcement is making a
// truth claim — if the file doesn't exist on disk, the rule is silently
// unenforced. Block this so the registry can't drift away from reality.
for (const rule of rules) {
  if (rule.status !== "active") continue;
  const enforcedList = Array.isArray(rule.enforced_by)
    ? rule.enforced_by
    : rule.enforced_by
      ? [rule.enforced_by]
      : [];
  for (const enf of enforcedList) {
    if (!enf || typeof enf !== "string") continue;
    if (enf === "manual_gate" || enf === "branch-protection") continue;
    if (!enf.includes("/")) continue; // bare keyword (e.g. policy ID)
    const abs = join(ROOT, enf);
    if (!existsSync(abs)) {
      console.error(
        `RULES_COVERAGE_VIOLATION: rule "${rule.id}" lists enforced_by "${enf}" but the file does not exist`,
      );
      violations++;
    }
  }
}

// === Matrix summary truth ===================================================
// The summary at the bottom of the matrix is a load-bearing claim — it tells
// reviewers how much enforcement is automated vs manual. If those numbers
// don't match the actual table rows, the doc lies. Re-derive the counts and
// fail if the summary disagrees.
function parseMatrixRows(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    while (cells.length && cells[0] === "") cells.shift();
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length < 6) continue;
    if (/^Rule ID$/i.test(cells[0])) continue;
    if (!/^PX-[A-Z0-9-]+$/.test(cells[0])) continue;
    rows.push({
      id: cells[0],
      title: cells[1],
      source: cells[2],
      enforcedBy: cells[3],
      gap: cells[4],
      improvement: cells[5],
    });
  }
  return rows;
}

const rows = parseMatrixRows(matrixContent);
const totals = {
  total: rows.length,
  noGap: rows.filter((r) => /^no$/i.test(r.gap)).length,
  yesGap: rows.filter((r) => /^yes$/i.test(r.gap)).length,
  partial: rows.filter((r) => /^partial$/i.test(r.gap)).length,
  todoGuard: rows.filter((r) => /TODO_GUARD/.test(r.improvement)).length,
};

// Pull the summary numbers from the doc. Each bullet is expected as:
//   "**Total rules:** 74"
//   "**Fully automated (matrix gap column = NO):** 47"
//   etc.
function extractSummaryNumber(content, label) {
  const re = new RegExp(`\\*\\*${label}[^*]*\\*\\*\\s*([0-9]+)`);
  const m = content.match(re);
  return m ? Number(m[1]) : null;
}

const summaryClaims = {
  total: extractSummaryNumber(matrixContent, "Total rules:"),
  noGap: extractSummaryNumber(matrixContent, "Fully automated"),
  yesGap: extractSummaryNumber(matrixContent, "Manual gate only"),
  partial: extractSummaryNumber(matrixContent, "Partial automation"),
  todoGuard: extractSummaryNumber(matrixContent, "Documented governance gaps"),
};

for (const [key, actual] of Object.entries(totals)) {
  const claim = summaryClaims[key];
  if (claim === null) {
    console.error(
      `RULES_COVERAGE_VIOLATION: RULES_TO_GUARDS_MATRIX.md summary is missing the "${key}" line — re-derive from rows (actual: ${actual})`,
    );
    violations++;
    continue;
  }
  if (claim !== actual) {
    console.error(
      `RULES_COVERAGE_VIOLATION: RULES_TO_GUARDS_MATRIX.md summary "${key}" = ${claim} but actual row count is ${actual}`,
    );
    violations++;
  }
}

// Reject the legacy "only N gaps" framing — it has been wrong since the
// matrix grew the BACKEND_ARCHITECTURE_INVARIANTS rows. The summary must use
// the structured bullet counts above and not a competing freeform number.
if (/only\s+\d+\s+gaps?/i.test(matrixContent)) {
  console.error(
    `RULES_COVERAGE_VIOLATION: RULES_TO_GUARDS_MATRIX.md uses the legacy "only N gaps" phrasing — replace with structured bullet counts (fully automated / manual-only / partial / TODO_GUARD).`,
  );
  violations++;
}

if (violations > 0) {
  console.error(`\ncheck-rules-to-guards-coverage: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_RULES_TO_GUARDS_COVERAGE_PASS (${p0ActiveRules.length} P0 active rules checked, ${rows.length} matrix rows verified)`);
