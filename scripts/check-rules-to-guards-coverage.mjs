import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");

let violations = 0;

if (!existsSync(RULES_PATH)) {
  console.error("RULES_COVERAGE_VIOLATION: docs/governance/RULES_REGISTRY.yml does not exist");
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

if (violations > 0) {
  console.error(`\ncheck-rules-to-guards-coverage: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_RULES_TO_GUARDS_COVERAGE_PASS (${p0ActiveRules.length} P0 active rules checked)`);
