import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMatrix, parseRegistryEntries } from "./check-rules-to-guards-coverage.mjs";

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, "docs/governance/RULES_REGISTRY.yml");
const MATRIX_PATH = join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md");
const INDEX_PATH = join(ROOT, "docs/governance/GOVERNANCE_INDEX.md");
const CODING_PATH = join(ROOT, "docs/architecture/PlatformaX-V2-coding-standards.md");
const EXCEPTIONS_PATH = join(ROOT, "docs/governance/EXCEPTIONS_REGISTER.md");

function readRequired(path) {
  if (!existsSync(path)) {
    throw new Error(`missing required file: ${path}`);
  }
  return readFileSync(path, "utf-8");
}

function fail(violations, msg) {
  violations.push(msg);
}

function hasAll(content, snippets) {
  return snippets.every((snippet) => content.includes(snippet));
}

export function evaluateCodingStandardsConsistency({
  rulesContent,
  matrixContent,
  indexContent,
  codingContent,
  exceptionsContent,
}) {
  const violations = [];
  const rules = parseRegistryEntries(rulesContent);
  const matrixRows = parseMatrix(matrixContent);
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const matrixIds = new Set(matrixRows.map((row) => row.ruleId));

  const codeRules = rules.filter((rule) => rule.id.startsWith("PX-CODE-"));
  for (const rule of codeRules) {
    if (!matrixIds.has(rule.id)) {
      fail(violations, `${rule.id} missing from RULES_TO_GUARDS_MATRIX.md`);
    }
    if (!indexContent.includes(`| ${rule.id} |`)) {
      fail(violations, `${rule.id} missing from GOVERNANCE_INDEX.md`);
    }
    for (const field of ["source_docs", "owner", "evidence_required", "status"]) {
      if (!rule[field]) fail(violations, `${rule.id} missing ${field}`);
    }
    const enforced = Array.isArray(rule.enforced_by)
      ? rule.enforced_by
      : rule.enforced_by
        ? [rule.enforced_by]
        : [];
    if (!enforced.length && !rule.manual_gate) {
      fail(violations, `${rule.id} missing enforced_by or manual_gate`);
    }
    if (!["active", "deprecated_alias"].includes(rule.status)) {
      fail(violations, `${rule.id} has invalid status ${rule.status}`);
    }
  }

  if (!hasAll(codingContent, ["File hard limits", "Function/body limits", "Recommended soft limits"])) {
    fail(violations, "coding standards must distinguish file hard, body, and soft limits");
  }
  if (!hasAll(codingContent, ["function body max: 80", "component body max: 140"])) {
    fail(violations, "coding standards must state 80-line function and 140-line component body limits");
  }

  if (!hasAll(codingContent, ["SCAFFOLD_ONLY", "PARTIAL", "IMPLEMENTED", "Router.ts is not required for every domain"])) {
    fail(violations, "backend domain required files must be status-based and router optional");
  }

  const canonicalExceptionFields = [
    "PLATFORMAX_EXCEPTION:",
    "Rule:",
    "Scope:",
    "Reason:",
    "Risk:",
    "Owner:",
    "Expiry:",
    "Removal plan:",
    "Evidence:",
  ];
  if (!hasAll(codingContent, canonicalExceptionFields)) {
    fail(violations, "coding standards must define canonical PLATFORMAX_EXCEPTION fields");
  }
  if (!exceptionsContent.includes("PLATFORMAX_EXCEPTION:")) {
    fail(violations, "EXCEPTIONS_REGISTER must document PLATFORMAX_EXCEPTION canonical block");
  }

  if (
    (codingContent.includes("ALLOW_FILE_SIZE_EXCEPTION") ||
      codingContent.includes("QUALITY_STRUCTURE_EXCEPTION")) &&
    !codingContent.includes("Deprecated aliases")
  ) {
    fail(violations, "deprecated exception markers must be documented as aliases only");
  }

  if ((/0\s+(?:remaining\s+)?TODO_GUARD|0\s+TODO_GUARD\s+remaining/i.test(matrixContent) || /0\s+remaining/i.test(matrixContent)) && matrixContent.includes("TODO_GUARD")) {
    fail(violations, "matrix summary says 0 TODO_GUARD while TODO_GUARD remains");
  }

  const idemp = rulesById.get("PX-IDEMPOTENCY-001");
  const idempAlias = rulesById.get("PX-IDEMP-001");
  if (!idemp || !idempAlias || idempAlias.status !== "deprecated_alias") {
    fail(violations, "PX-IDEMPOTENCY-001 must be canonical and PX-IDEMP-001 deprecated_alias");
  }

  const lifecycle = rulesById.get("PX-LIFECYCLE-001");
  const lifecycleAlias = rulesById.get("PX-LC-001");
  if (!lifecycle || !lifecycleAlias || lifecycleAlias.status !== "deprecated_alias") {
    fail(violations, "PX-LIFECYCLE-001 must be canonical and PX-LC-001 deprecated_alias");
  }

  if (!indexContent.includes("PX-GOV-FINALIZE-001")) {
    fail(violations, "GOVERNANCE_INDEX must list PX-GOV-FINALIZE-001 as allowed compound governance prefix");
  }

  return { violations, codeRuleCount: codeRules.length };
}

function main() {
  let result;
  try {
    result = evaluateCodingStandardsConsistency({
      rulesContent: readRequired(RULES_PATH),
      matrixContent: readRequired(MATRIX_PATH),
      indexContent: readRequired(INDEX_PATH),
      codingContent: readRequired(CODING_PATH),
      exceptionsContent: readRequired(EXCEPTIONS_PATH),
    });
  } catch (err) {
    console.error(`CODING_STANDARDS_CONSISTENCY_VIOLATION: ${err.message}`);
    process.exit(1);
  }

  for (const violation of result.violations) {
    console.error(`CODING_STANDARDS_CONSISTENCY_VIOLATION: ${violation}`);
  }
  if (result.violations.length > 0) {
    console.error(
      `\ncheck-coding-standards-consistency: ${result.violations.length} violation(s)`,
    );
    process.exit(1);
  }

  console.log(
    `CHECK_CODING_STANDARDS_CONSISTENCY_PASS (${result.codeRuleCount} PX-CODE rules checked)`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
