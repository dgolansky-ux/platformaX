// PX-READMODEL-001 — every read model projection has exactly one owner domain.
//
// Structural check:
//  1. Either DOMAIN_OWNERSHIP_MATRIX.md or BACKEND_ARCHITECTURE_INVARIANTS.md
//     must mention "single read-model owner" (or equivalent) — covers the
//     written policy.
//  2. No doc line describes a feed/projection as co-owned by two domains
//     in the form `content-v2 + social` (or vice versa) as authoritative
//     write-side ownership.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

const violations = [];

const matrixPath = join(ROOT, "docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md");
const invariantsPath = join(ROOT, "docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md");

let policyDocumented = false;
for (const p of [matrixPath, invariantsPath]) {
  if (!existsSync(p)) continue;
  const src = readFileSync(p, "utf-8").toLowerCase();
  if (
    /single\s+read[- ]model\s+owner/.test(src) ||
    /single\s+owner\s+(per\s+)?read[- ]?model/.test(src) ||
    /every\s+read\s+model\s+projection\s+has\s+exactly\s+one\s+owner/.test(src)
  ) {
    policyDocumented = true;
    break;
  }
}
if (!policyDocumented) {
  violations.push(
    'docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md or docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md must document the "single read-model owner" rule (PX-READMODEL-001).',
  );
}

// Co-ownership anti-pattern scan in docs.
const docFiles = listSourceFiles({
  cwd: ROOT,
  roots: ["docs"],
  extensions: [".md"],
});

const CO_OWNERSHIP_RE = /(content-v2[^\n]{0,60}\+\s*social|social[^\n]{0,60}\+\s*content-v2)/i;

for (const file of docFiles) {
  const src = readFileSync(join(ROOT, file), "utf-8");
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!CO_OWNERSHIP_RE.test(line)) continue;
    // Only flag when the line describes ownership-of-projection, not generic
    // mentions like "social emits events; content-v2 owns feed".
    if (
      /(owner|owners|own)\s+(?:the\s+|a\s+)?(?:feed|projection|read[- ]?model)/i.test(line) &&
      !/social.*emits.*content-v2.*owns/i.test(line) &&
      !/content-v2.*owns.*social.*emits/i.test(line)
    ) {
      violations.push(`${file}:${i + 1}: co-ownership of a read-model/projection — "${line.trim()}"`);
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`READ_MODEL_SINGLE_OWNER_VIOLATION: ${v}`);
  console.error(`\ncheck-read-model-single-owner: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_READ_MODEL_SINGLE_OWNER_PASS");
