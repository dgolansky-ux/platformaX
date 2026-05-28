import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");

const REQUIRED_FIELDS = ["id", "title", "severity", "category", "source_docs", "enforced_by", "status"];
const ALLOWED_SEVERITIES = ["P0", "P1", "P2"];
const ALLOWED_STATUSES = ["active", "deprecated", "deprecated_alias", "proposed"];

let violations = 0;

if (!existsSync(REGISTRY_PATH)) {
  console.error("GOVERNANCE_REGISTRY_VIOLATION: docs/governance/RULES_REGISTRY.yml does not exist");
  process.exit(1);
}

const content = readFileSync(REGISTRY_PATH, "utf-8");
const lines = content.split("\n");

const rules = [];
let current = null;
let currentKey = null;

for (const line of lines) {
  if (line.match(/^\s*#/) || line.trim() === "") continue;

  if (line.match(/^\s*- id:\s*/)) {
    if (current) rules.push(current);
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
if (current) rules.push(current);

if (rules.length === 0) {
  console.error("GOVERNANCE_REGISTRY_VIOLATION: no rules parsed from RULES_REGISTRY.yml");
  process.exit(1);
}

const seenIds = new Set();

for (const rule of rules) {
  for (const field of REQUIRED_FIELDS) {
    if (rule[field] === undefined || rule[field] === null) {
      if (field === "enforced_by") {
        const val = rule[field];
        if (val === null || val === undefined) {
          console.error(`GOVERNANCE_REGISTRY_VIOLATION: rule "${rule.id}" missing required field "${field}"`);
          violations++;
        }
      } else {
        console.error(`GOVERNANCE_REGISTRY_VIOLATION: rule "${rule.id}" missing required field "${field}"`);
        violations++;
      }
    }
  }

  if (seenIds.has(rule.id)) {
    console.error(`GOVERNANCE_REGISTRY_VIOLATION: duplicate rule ID "${rule.id}"`);
    violations++;
  }
  seenIds.add(rule.id);

  if (rule.severity && !ALLOWED_SEVERITIES.includes(rule.severity)) {
    console.error(`GOVERNANCE_REGISTRY_VIOLATION: rule "${rule.id}" has invalid severity "${rule.severity}" (allowed: ${ALLOWED_SEVERITIES.join(", ")})`);
    violations++;
  }

  if (rule.status && !ALLOWED_STATUSES.includes(rule.status)) {
    console.error(`GOVERNANCE_REGISTRY_VIOLATION: rule "${rule.id}" has invalid status "${rule.status}" (allowed: ${ALLOWED_STATUSES.join(", ")})`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`\ncheck-governance-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_GOVERNANCE_REGISTRY_PASS (${rules.length} rules validated)`);
