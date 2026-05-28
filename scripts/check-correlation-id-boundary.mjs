// PX-OBS-003 — correlation ID boundary skeleton guard.
//
// Verifies the structural skeleton needed for end-to-end correlation tracing
// exists. Full middleware/use-case/log wiring stays manual_gate; this guard
// fails only when the skeleton regresses.
//
// Checks:
//   1. shared/contracts/correlation.ts exists.
//   2. It declares RequestContext with `correlationId` and `actorId`.
//   3. It exports `createCorrelationId`.
//   4. It does NOT use Math.random (use createUuid).
//   5. docs/governance/RULES_TO_GUARDS_MATRIX.md notes PX-OBS-003 as
//      PARTIAL/manual_gate (no fake "fully wired" status).

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const violations = [];

const CORR_PATH = join(ROOT, "shared/contracts/correlation.ts");
if (!existsSync(CORR_PATH)) {
  violations.push("shared/contracts/correlation.ts is missing");
} else {
  const src = readFileSync(CORR_PATH, "utf-8");
  if (!/interface\s+RequestContext|type\s+RequestContext/.test(src)) {
    violations.push("shared/contracts/correlation.ts: RequestContext is not declared");
  }
  if (!/correlationId\s*:/.test(src)) {
    violations.push("shared/contracts/correlation.ts: RequestContext lacks correlationId field");
  }
  if (!/actorId\s*:/.test(src)) {
    violations.push("shared/contracts/correlation.ts: RequestContext lacks actorId field");
  }
  if (!/export\s+function\s+createCorrelationId/.test(src)) {
    violations.push("shared/contracts/correlation.ts: createCorrelationId is not exported");
  }
  // Strip comments before scanning so doc references to "no Math.random" don't
  // false-positive the unsafe-randomness check.
  const codeOnly = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  if (/Math\.random\b/.test(codeOnly)) {
    violations.push(
      "shared/contracts/correlation.ts: uses Math.random — must use createUuid() (WebCrypto)",
    );
  }
}

// Honesty check: matrix should not claim PX-OBS-003 is "NO" (fully automated).
const MATRIX_PATH = join(ROOT, "docs/governance/RULES_TO_GUARDS_MATRIX.md");
if (existsSync(MATRIX_PATH)) {
  const matrix = readFileSync(MATRIX_PATH, "utf-8");
  const line = matrix.split(/\r?\n/).find((l) => l.includes("PX-OBS-003"));
  if (line && /\|\s*NO\s*\|/.test(line)) {
    violations.push(
      "docs/governance/RULES_TO_GUARDS_MATRIX.md: PX-OBS-003 is marked NO (fully automated), but end-to-end wiring is still manual_gate — mark PARTIAL/YES with manual_gate note.",
    );
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`CORRELATION_ID_BOUNDARY_VIOLATION: ${v}`);
  console.error(`\ncheck-correlation-id-boundary: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_CORRELATION_ID_BOUNDARY_PASS");
