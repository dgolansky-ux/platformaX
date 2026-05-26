import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");

const REQUIRED_FIELDS = ["id", "command", "file", "rules_enforced", "runs_in", "status"];

let violations = 0;

if (!existsSync(GUARDS_PATH)) {
  console.error("GUARDS_REGISTRY_VIOLATION: docs/governance/GUARDS_REGISTRY.yml does not exist");
  process.exit(1);
}

function parseYamlList(filePath, entryKey) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const entries = [];
  let current = null;
  let currentKey = null;

  for (const line of lines) {
    if (line.match(/^\s*#/) || line.trim() === "") continue;

    const idMatch = line.match(new RegExp(`^\\s*- ${entryKey}:\\s*(.*)`));
    if (idMatch) {
      if (current) entries.push(current);
      current = { [entryKey]: idMatch[1].trim() };
      currentKey = entryKey;
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
        current[key] = val.slice(1, -1).split(",").map((s) => s.trim());
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

const guards = parseYamlList(GUARDS_PATH, "id");
const rules = parseYamlList(RULES_PATH, "id");
const validRuleIds = new Set(rules.map((r) => r.id));

if (guards.length === 0) {
  console.error("GUARDS_REGISTRY_VIOLATION: no guards parsed from GUARDS_REGISTRY.yml");
  process.exit(1);
}

for (const guard of guards) {
  for (const field of REQUIRED_FIELDS) {
    if (guard[field] === undefined || guard[field] === null) {
      console.error(`GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" missing required field "${field}"`);
      violations++;
    }
  }

  if (guard.file) {
    const scriptPath = join(ROOT, guard.file);
    if (!existsSync(scriptPath)) {
      console.error(`GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" references non-existent file "${guard.file}"`);
      violations++;
    }
  }

  const enforced = guard.rules_enforced;
  if (Array.isArray(enforced)) {
    for (const ruleId of enforced) {
      if (ruleId && !validRuleIds.has(ruleId)) {
        console.error(`GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" references unknown rule "${ruleId}"`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-guards-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_GUARDS_REGISTRY_PASS (${guards.length} guards validated)`);
