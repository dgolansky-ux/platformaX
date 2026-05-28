// PX-CONTRACT-001 — public DTO contract tests guard.
//
// For each server/domains-v2/<domain> whose status is PARTIAL or IMPLEMENTED
// (per docs/governance/DOMAIN_STATUS_REGISTRY.yml), require at least ONE of:
//   - server/domains-v2/<domain>/__tests__/domain-contract.test.ts
//   - server/domains-v2/<domain>/__tests__/public-mapper-no-pii.test.ts
//   - server/domains-v2/<domain>/__tests__/public-mapper-no-leak.test.ts
//   - server/domains-v2/<domain>/__tests__/public-api.test.ts
//   - server/domains-v2/<domain>/__tests__/contract.test.ts
//
// SCAFFOLD_ONLY domains are not required to have runtime contract tests.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");

const ACCEPTABLE_TEST_FILES = [
  "domain-contract.test.ts",
  "public-mapper-no-pii.test.ts",
  "public-mapper-no-leak.test.ts",
  "public-api.test.ts",
  "contract.test.ts",
];

function parseRegistry(yaml) {
  // Minimal parse: lines like "  - domain: identity" then "    status: PARTIAL".
  const out = {};
  const lines = yaml.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const dm = line.match(/^\s*-\s*domain:\s*([\w-]+)/);
    if (dm) {
      current = dm[1];
      out[current] = null;
      continue;
    }
    if (current) {
      const sm = line.match(/^\s+status:\s*([A-Z_]+)/);
      if (sm) {
        out[current] = sm[1];
        current = null;
      }
    }
  }
  return out;
}

if (!existsSync(REGISTRY_PATH)) {
  console.log("CHECK_PUBLIC_DTO_CONTRACT_TESTS_PASS (no DOMAIN_STATUS_REGISTRY.yml — nothing to check)");
  process.exit(0);
}

const registry = parseRegistry(readFileSync(REGISTRY_PATH, "utf-8"));
const violations = [];

for (const [domain, status] of Object.entries(registry)) {
  if (!status) continue;
  if (status === "SCAFFOLD_ONLY") continue;
  const testsDir = join(ROOT, "server/domains-v2", domain, "__tests__");
  if (!existsSync(testsDir)) {
    violations.push(`${domain} (${status}): missing __tests__ directory — runtime status requires contract tests`);
    continue;
  }
  const files = readdirSync(testsDir);
  const hasAny = ACCEPTABLE_TEST_FILES.some((f) => files.includes(f));
  if (!hasAny) {
    violations.push(
      `${domain} (${status}): missing public DTO contract test — expected one of ${ACCEPTABLE_TEST_FILES.join(", ")}`,
    );
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`PUBLIC_DTO_CONTRACT_TESTS_VIOLATION: ${v}`);
  console.error(`\ncheck-public-dto-contract-tests: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PUBLIC_DTO_CONTRACT_TESTS_PASS");
