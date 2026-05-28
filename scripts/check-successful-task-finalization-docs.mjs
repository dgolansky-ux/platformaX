/**
 * Guard: the mandatory-task-finalization policy stays consistent across docs.
 *
 * Rule: PX-GOV-FINALIZE-001. Every successful task must end with a commit, a
 * push to the working branch, and a PR (created or updated). The policy lives
 * in four places — this guard ensures all four remain aligned, so the policy
 * cannot silently disappear from any one of them:
 *
 *  1. docs/governance/AGENT_COMMAND_STANDARD.md — §11 + FINALIZATION block
 *  2. docs/governance/AI_AGENT_PERMISSIONS_POLICY.md — "Mandatory Task Finalization"
 *  3. docs/governance/RULES_REGISTRY.yml — entry id PX-GOV-FINALIZE-001
 *  4. docs/governance/RULES_TO_GUARDS_MATRIX.md — row referencing PX-GOV-FINALIZE-001
 *
 * The guard is documentation-only. It does not try to inspect every agent
 * response to verify that a PR was actually created — that remains manual_gate
 * (see RULES_REGISTRY notes for PX-GOV-FINALIZE-001).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const REQUIREMENTS = [
  {
    file: "docs/governance/AGENT_COMMAND_STANDARD.md",
    label: "Agent command standard §11",
    needles: [
      "MANDATORY SUCCESSFUL TASK FINALIZATION",
      "PX-GOV-FINALIZE-001",
      "FINALIZATION:",
      "Commit SHA",
      "no direct push to main",
    ],
  },
  {
    file: "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md",
    label: "AI agent permissions policy",
    needles: [
      "PX-GOV-FINALIZE-001",
      "Mandatory Task Finalization",
      "commit, push, and open or update a PR",
    ],
  },
  {
    file: "docs/governance/RULES_REGISTRY.yml",
    label: "Rules registry",
    needles: [
      "- id: PX-GOV-FINALIZE-001",
      "Successful tasks must be committed, pushed and opened as PR",
    ],
  },
  {
    file: "docs/governance/RULES_TO_GUARDS_MATRIX.md",
    label: "Rules-to-guards matrix",
    needles: ["PX-GOV-FINALIZE-001"],
  },
];

let violations = 0;
function fail(msg) {
  console.error(`SUCCESSFUL_TASK_FINALIZATION_DRIFT: ${msg}`);
  violations++;
}

for (const req of REQUIREMENTS) {
  const abs = join(ROOT, req.file);
  if (!existsSync(abs)) {
    fail(`${req.file} does not exist (${req.label})`);
    continue;
  }
  const content = readFileSync(abs, "utf-8");
  for (const needle of req.needles) {
    if (!content.includes(needle)) {
      fail(`${req.file} missing required marker: "${needle}" (${req.label})`);
    }
  }
}

if (violations > 0) {
  console.error(
    `\ncheck-successful-task-finalization-docs: ${violations} violation(s)`,
  );
  process.exit(1);
}

console.log("CHECK_SUCCESSFUL_TASK_FINALIZATION_DOCS_PASS");
