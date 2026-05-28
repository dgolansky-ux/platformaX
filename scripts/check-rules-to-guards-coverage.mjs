import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");
const MATRIX_PATH = join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md");

export function parseRegistryEntries(content) {
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
        current[key] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
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
    }
  }
  if (current) entries.push(current);
  return entries;
}

export function parseMatrix(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("| PX-")) continue;
    const cells = trimmed
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length < 6) continue;
    rows.push({
      ruleId: cells[0],
      title: cells[1],
      sourceDoc: cells[2],
      enforcedBy: cells[3],
      gap: cells[4],
      requiredImprovement: cells[5],
      raw: trimmed,
    });
  }
  return rows;
}

function asList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isScriptRef(value) {
  return /^scripts\/.+\.mjs$/.test(value);
}

export function evaluateCoverage({
  rulesContent,
  guardsContent,
  matrixContent,
  root = ROOT,
}) {
  const violations = [];
  const rules = parseRegistryEntries(rulesContent);
  const guards = parseRegistryEntries(guardsContent);
  const matrixRows = parseMatrix(matrixContent);
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const guardsByFile = new Map(guards.map((guard) => [guard.file, guard]));
  const matrixRuleIds = new Set(matrixRows.map((row) => row.ruleId));

  for (const rule of rules) {
    const enforcedBy = asList(rule.enforced_by);
    const hasManualGate = enforcedBy.includes("manual_gate");
    const scriptRefs = enforcedBy.filter(isScriptRef);

    if (
      rule.severity === "P0" &&
      rule.status === "active" &&
      !hasManualGate &&
      scriptRefs.length === 0
    ) {
      violations.push(
        `P0 active rule "${rule.id}" (${rule.title}) has no guard or manual_gate`,
      );
    }

    for (const scriptRef of scriptRefs) {
      if (!existsSync(join(root, scriptRef))) {
        violations.push(
          `rule "${rule.id}" enforced_by script does not exist: ${scriptRef}`,
        );
      }

      const guard = guardsByFile.get(scriptRef);
      if (!guard) {
        violations.push(
          `rule "${rule.id}" enforced_by ${scriptRef} missing from GUARDS_REGISTRY`,
        );
        continue;
      }

      const rulesEnforced = asList(guard.rules_enforced);
      if (!rulesEnforced.includes(rule.id)) {
        violations.push(
          `guard "${guard.id}" (${scriptRef}) does not list rule "${rule.id}" in rules_enforced`,
        );
      }
    }

    if (
      rule.status !== "deprecated_alias" &&
      rule.local_only !== "true" &&
      !matrixRuleIds.has(rule.id)
    ) {
      violations.push(
        `registry rule "${rule.id}" missing from RULES_TO_GUARDS_MATRIX`,
      );
    }
  }

  for (const row of matrixRows) {
    if (!rulesById.has(row.ruleId)) {
      violations.push(
        `matrix rule "${row.ruleId}" does not exist in RULES_REGISTRY`,
      );
    }
  }

  for (const row of matrixRows) {
    if (!row.raw.includes("TODO_GUARD")) continue;
    const rule = rulesById.get(row.ruleId);
    const scriptRefs = asList(rule?.enforced_by).filter(isScriptRef);
    if (scriptRefs.length > 0) {
      violations.push(
        `matrix row "${row.ruleId}" says TODO_GUARD but registry already has guard(s): ${scriptRefs.join(", ")}`,
      );
    }
  }

  if ((/0\s+(?:remaining\s+)?TODO_GUARD|0\s+TODO_GUARD\s+remaining/i.test(matrixContent) || /0\s+remaining/i.test(matrixContent)) && matrixContent.includes("TODO_GUARD")) {
    violations.push(
      "matrix summary says 0 TODO_GUARD remaining while TODO_GUARD still appears",
    );
  }

  return {
    violations,
    ruleCount: rules.length,
    guardCount: guards.length,
    matrixRuleCount: matrixRows.length,
  };
}

function main() {
  let missing = false;
  for (const filePath of [RULES_PATH, GUARDS_PATH, MATRIX_PATH]) {
    if (!existsSync(filePath)) {
      console.error(`RULES_COVERAGE_VIOLATION: ${filePath} does not exist`);
      missing = true;
    }
  }
  if (missing) process.exit(1);

  const result = evaluateCoverage({
    rulesContent: readFileSync(RULES_PATH, "utf-8"),
    guardsContent: readFileSync(GUARDS_PATH, "utf-8"),
    matrixContent: readFileSync(MATRIX_PATH, "utf-8"),
    root: ROOT,
  });

  for (const violation of result.violations) {
    console.error(`RULES_COVERAGE_VIOLATION: ${violation}`);
  }

  if (result.violations.length > 0) {
    console.error(
      `\ncheck-rules-to-guards-coverage: ${result.violations.length} violation(s)`,
    );
    process.exit(1);
  }

  console.log(
    `CHECK_RULES_TO_GUARDS_COVERAGE_PASS (${result.ruleCount} rules, ${result.guardCount} guards, ${result.matrixRuleCount} matrix rows checked)`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
