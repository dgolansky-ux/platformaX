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
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");

export const ACCEPTABLE_TEST_FILES = [
  "domain-contract.test.ts",
  "public-mapper-no-pii.test.ts",
  "public-mapper-no-leak.test.ts",
  "public-api.test.ts",
  "contract.test.ts",
];

export function parseRegistry(yaml) {
  // Minimal parse for both shapes used in this repo:
  //   `  - name: identity`   then `    status: PARTIAL`
  //   `  - domain: identity` then `    status: PARTIAL`
  // (Earlier versions of this parser only matched `- domain:`, which silently
  //  returned an empty registry against the actual `- name:` file shape and
  //  produced a false PASS. The guard now fails closed when parsing produces
  //  zero domains.)
  const out = {};
  const lines = yaml.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const dm = line.match(/^\s*-\s*(?:name|domain)\s*:\s*([\w-]+)/);
    if (dm) {
      current = dm[1];
      out[current] = null;
      continue;
    }
    if (current) {
      const sm = line.match(/^\s+status\s*:\s*([A-Z_]+)/);
      if (sm) {
        out[current] = sm[1];
        current = null;
      }
    }
  }
  return out;
}

export function evaluate({ registry, hasTestFile }) {
  const violations = [];
  if (Object.keys(registry).length === 0) {
    violations.push(
      "DOMAIN_STATUS_REGISTRY.yml exists but parser found 0 domains — registry shape changed?",
    );
    return violations;
  }
  for (const [domain, status] of Object.entries(registry)) {
    if (!status) continue;
    if (status === "SCAFFOLD_ONLY") continue;
    const result = hasTestFile(domain);
    if (result === "no-dir") {
      violations.push(
        `${domain} (${status}): missing __tests__ directory — runtime status requires contract tests`,
      );
      continue;
    }
    if (!result) {
      violations.push(
        `${domain} (${status}): missing public DTO contract test — expected one of ${ACCEPTABLE_TEST_FILES.join(", ")}`,
      );
    }
  }
  return violations;
}

function main() {
  if (!existsSync(REGISTRY_PATH)) {
    console.log("CHECK_PUBLIC_DTO_CONTRACT_TESTS_PASS (no DOMAIN_STATUS_REGISTRY.yml — nothing to check)");
    process.exit(0);
  }

  const registry = parseRegistry(readFileSync(REGISTRY_PATH, "utf-8"));

  const violations = evaluate({
    registry,
    hasTestFile: (domain) => {
      const testsDir = join(ROOT, "server/domains-v2", domain, "__tests__");
      if (!existsSync(testsDir)) return "no-dir";
      const files = readdirSync(testsDir);
      return ACCEPTABLE_TEST_FILES.some((f) => files.includes(f));
    },
  });

  if (violations.length > 0) {
    for (const v of violations) console.error(`PUBLIC_DTO_CONTRACT_TESTS_VIOLATION: ${v}`);
    console.error(`\ncheck-public-dto-contract-tests: ${violations.length} violation(s)`);
    process.exit(1);
  }

  console.log("CHECK_PUBLIC_DTO_CONTRACT_TESTS_PASS");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
