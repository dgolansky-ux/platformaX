import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.cwd();
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const WORKFLOW_PATH = join(ROOT, ".github/workflows/v2-gates.yml");
const PRE_PUSH_PATH = join(ROOT, ".husky/pre-push");
const PACKAGE_JSON_PATH = join(ROOT, "package.json");

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
    // Every guard must trace to at least one rule — an empty rules_enforced
    // means the guard runs but is not tied to any governed requirement.
    if (enforced.filter(Boolean).length === 0) {
      console.error(`GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" has empty rules_enforced — map it to at least one rule`);
      violations++;
    }
  }
}

// === Runtime reachability checks ============================================
// Block the silent drift where a guard says "I run in CI" but no workflow step
// actually invokes it (or where a pre-push guard isn't wired into the husky hook).
// We expand every `pnpm <script>` reference through package.json so script files
// invoked transitively by an umbrella script still count as reachable.

function readPackageScripts() {
  if (!existsSync(PACKAGE_JSON_PATH)) return {};
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
  return pkg.scripts ?? {};
}

const pkgScripts = readPackageScripts();

function extractScriptFilesFromShell(shell) {
  // Picks every `node <something>` (or quoted variant) and returns the basename
  // of the .mjs/.js/.cjs file. We deliberately ignore non-script invocations
  // like `pnpm install` because they don't satisfy a guard reachability claim.
  const out = new Set();
  if (typeof shell !== "string") return out;
  const re = /\b(?:node|tsx)\b\s+(?:--[\w=-]+\s+)*["']?([^\s"';&|]+\.(?:mjs|js|cjs|ts))/g;
  let match;
  while ((match = re.exec(shell)) !== null) {
    out.add(basename(match[1]));
  }
  return out;
}

function expandPnpmScript(scriptName, seen = new Set()) {
  // Recursively resolve a pnpm script into the set of script file basenames it
  // ultimately runs. `seen` guards against accidental self-references.
  const result = new Set();
  if (seen.has(scriptName)) return result;
  seen.add(scriptName);
  const body = pkgScripts[scriptName];
  if (!body) return result;
  for (const f of extractScriptFilesFromShell(body)) result.add(f);
  const pnpmRefs = body.match(/\bpnpm\s+(?:run\s+)?([a-zA-Z][\w:-]*)/g) ?? [];
  for (const ref of pnpmRefs) {
    const m = ref.match(/\bpnpm\s+(?:run\s+)?([a-zA-Z][\w:-]*)/);
    if (!m) continue;
    const child = m[1];
    // Skip lifecycle/setup verbs that aren't guard wrappers.
    if (["install", "test", "build", "lint", "check", "preview", "dev", "prepare"].includes(child)) continue;
    if (pkgScripts[child]) {
      for (const f of expandPnpmScript(child, seen)) result.add(f);
    }
  }
  return result;
}

// rules-check.mjs has a hand-written GUARDS list rather than dispatching via
// pnpm, so to know what it reaches we read the file and pull out the names.
function extractFromRulesCheck() {
  const p = join(ROOT, "scripts/rules-check.mjs");
  if (!existsSync(p)) return new Set();
  const content = readFileSync(p, "utf-8");
  const out = new Set();
  const re = /["']([\w.-]+\.(?:mjs|js|cjs))(?:\s+[^"']*)?["']/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    out.add(match[1]);
  }
  return out;
}

function buildReachableSet(shellChunks) {
  const reachable = new Set();
  for (const chunk of shellChunks) {
    for (const f of extractScriptFilesFromShell(chunk)) reachable.add(f);
    const pnpmRefs = chunk.match(/\bpnpm\s+(?:run\s+)?([a-zA-Z][\w:-]*)/g) ?? [];
    for (const ref of pnpmRefs) {
      const m = ref.match(/\bpnpm\s+(?:run\s+)?([a-zA-Z][\w:-]*)/);
      if (!m) continue;
      const name = m[1];
      if (["install", "test", "build", "lint", "check", "preview", "dev", "prepare"].includes(name)) continue;
      for (const f of expandPnpmScript(name)) reachable.add(f);
    }
  }
  // rules-check.mjs is itself a hand-rolled umbrella: it executes a hard-coded
  // GUARDS list. If anything ultimately invokes it, every guard inside its
  // list is reachable too — even though those guards never appear in the
  // workflow YAML or package.json scripts directly.
  if (reachable.has("rules-check.mjs")) {
    for (const f of extractFromRulesCheck()) reachable.add(f);
  }
  return reachable;
}

const workflowShell = existsSync(WORKFLOW_PATH) ? readFileSync(WORKFLOW_PATH, "utf-8") : "";
const prePushShell = existsSync(PRE_PUSH_PATH) ? readFileSync(PRE_PUSH_PATH, "utf-8") : "";

const ciReachable = buildReachableSet([workflowShell]);
// Pre-push reachability: the husky hook itself, plus the guards:all-local
// umbrella that is the documented local equivalent of CI.
const prePushReachable = buildReachableSet([
  prePushShell,
  pkgScripts["guards:all-local"] ?? "",
]);
for (const f of expandPnpmScript("guards:all-local")) prePushReachable.add(f);

for (const guard of guards) {
  if (guard.status !== "active") continue;
  if (guard.required !== "true" && guard.required !== true) continue;
  const file = guard.file;
  if (!file) continue;
  const fileBase = basename(file);
  const runsIn = Array.isArray(guard.runs_in)
    ? guard.runs_in
    : typeof guard.runs_in === "string"
      ? [guard.runs_in]
      : [];

  if (runsIn.includes("ci") && !ciReachable.has(fileBase)) {
    console.error(
      `GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" (${file}) declares runs_in: ci but is not reachable from .github/workflows/v2-gates.yml. ` +
        `Add the script to the workflow or to an umbrella step (e.g. pnpm guards:all-local).`,
    );
    violations++;
  }

  if (runsIn.includes("pre-push") && !prePushReachable.has(fileBase)) {
    console.error(
      `GUARDS_REGISTRY_VIOLATION: guard "${guard.id}" (${file}) declares runs_in: pre-push but is not reachable from .husky/pre-push or pnpm guards:all-local.`,
    );
    violations++;
  }
}

if (violations > 0) {
  console.error(`\ncheck-guards-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_GUARDS_REGISTRY_PASS (${guards.length} guards validated, CI reachability verified)`);
