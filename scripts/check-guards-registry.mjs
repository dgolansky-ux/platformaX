import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.cwd();
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const RULES_CHECK_PATH = join(ROOT, "scripts/rules-check.mjs");
const PACKAGE_JSON_PATH = join(ROOT, "package.json");

const REQUIRED_FIELDS = ["id", "command", "file", "rules_enforced", "runs_in", "status"];

/**
 * Triggers for "this guard is wired into a gate that runs in CI/pre-push":
 *  - the guard file appears in scripts/rules-check.mjs, OR
 *  - the guard file appears in any package.json scripts.* command that is part of
 *    the project's CI/pre-push surface (rules:check, arch:check:v2,
 *    guards:all-local, guards:runtime-invariants).
 *
 * Adding a required+runs_in:pre-push/ci guard to GUARDS_REGISTRY without wiring
 * it through one of these channels would silently leave it un-enforced — which
 * is exactly the drift step-50 followed-up to prevent.
 */
const CI_PACKAGE_SCRIPTS = [
  "rules:check",
  "arch:check:v2",
  "guards:all-local",
  "guards:runtime-invariants",
];

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

// ---- Wiring check: required guards must actually be invoked from a CI gate ----

function gatherWiredBasenames() {
  const wired = new Set();

  if (existsSync(RULES_CHECK_PATH)) {
    const rc = readFileSync(RULES_CHECK_PATH, "utf-8");
    // Capture any .mjs basename inside the GUARDS array, regardless of trailing
    // args (e.g. `"validate-bundle.mjs --smoke"`).
    for (const m of rc.matchAll(/([\w.-]+\.mjs)/g)) {
      wired.add(m[1]);
    }
  }

  if (existsSync(PACKAGE_JSON_PATH)) {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const scripts = pkg.scripts || {};
    // Collect CI scripts + everything they transitively reference inside the
    // package.json (so wrapper scripts like "guards:all-local" propagate).
    const queue = [...CI_PACKAGE_SCRIPTS];
    const seen = new Set();
    while (queue.length > 0) {
      const name = queue.shift();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const cmd = scripts[name];
      if (!cmd) continue;
      for (const m of cmd.matchAll(/scripts\/([\w.-]+\.mjs)/g)) {
        wired.add(m[1]);
      }
      for (const m of cmd.matchAll(/npm\s+run\s+([\w:-]+)/g)) {
        queue.push(m[1]);
      }
    }
  }

  return wired;
}

const wired = gatherWiredBasenames();

function isRequiredCiGuard(guard) {
  if (guard.required !== "true") return false;
  const runsIn = guard.runs_in;
  if (!runsIn) return false;
  const tokens = Array.isArray(runsIn) ? runsIn : String(runsIn).split(/[,\s]+/);
  return tokens.some((t) => t === "ci" || t === "pre-push");
}

for (const guard of guards) {
  if (!isRequiredCiGuard(guard)) continue;
  if (!guard.file) continue;
  const base = basename(String(guard.file));
  // Files mentioned outside scripts/ are not project-owned guards — skip.
  if (!String(guard.file).startsWith("scripts/")) continue;
  if (!wired.has(base)) {
    console.error(
      `GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" is required and runs_in pre-push/ci, ` +
        `but "${guard.file}" is not invoked by scripts/rules-check.mjs or any CI package script ` +
        `(${CI_PACKAGE_SCRIPTS.join(", ")}). Required guards must actually run in CI/pre-push.`,
    );
    violations++;
  }
}

if (violations > 0) {
  console.error(`\ncheck-guards-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_GUARDS_REGISTRY_PASS (${guards.length} guards validated)`);
