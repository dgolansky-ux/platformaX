#!/usr/bin/env node
/**
 * scripts/check-public-dto-contract-tests.mjs
 *
 * Rule: PX-CONTRACT-001 — every `server/domains-v2/<domain>/public-api.ts`
 * must have a sibling test file under
 * `server/domains-v2/<domain>/__tests__/` whose filename matches one of:
 *
 *   - `public-api*.test.ts`
 *   - `public-api*.test.tsx`
 *   - `domain-contract*.test.ts`     (alias used by moderation, social)
 *   - `*public-api-contract*.test.ts`
 *   - `*public-mapper*.test.ts`      (acceptable contract pin for the
 *     identity / media domains whose public surface is mapper-driven)
 *
 * A file-level `// PX-CONTRACT-001-ACK: <reason>` marker logs and
 * passes; it does not weaken the rule.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");

const ACK_MARKER = /PX-CONTRACT-001-ACK:\s*([^\n*]+)/;
const ACCEPTED_TEST_NAMES = [
  /^public-api.*\.test\.tsx?$/i,
  /^domain-contract.*\.test\.tsx?$/i,
  /^public-mapper.*\.test\.tsx?$/i,
  /public-api-contract.*\.test\.tsx?$/i,
];

function toPosix(p) { return p.split(sep).join("/"); }

let violations = 0;
if (existsSync(DOMAINS_ROOT)) {
  for (const e of readdirSync(DOMAINS_ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const domain = e.name;
    const publicApiPath = join(DOMAINS_ROOT, domain, "public-api.ts");
    if (!existsSync(publicApiPath)) continue;
    const rel = toPosix(relative(ROOT, publicApiPath));
    const apiContent = readFileSync(publicApiPath, "utf-8");
    const ack = ACK_MARKER.exec(apiContent);
    const acked = ack ? ack[1].trim() : null;
    const testsDir = join(DOMAINS_ROOT, domain, "__tests__");
    let hasTest = false;
    if (existsSync(testsDir)) {
      for (const tf of readdirSync(testsDir)) {
        if (ACCEPTED_TEST_NAMES.some(re => re.test(tf))) {
          hasTest = true;
          break;
        }
      }
    }
    if (hasTest) continue;
    if (acked) {
      console.error(`PUBLIC_DTO_CONTRACT_TESTS_ACK: ${rel} — no matching test; PX-CONTRACT-001-ACK: ${acked}`);
      continue;
    }
    console.error(`PUBLIC_DTO_CONTRACT_TESTS_VIOLATION: ${rel} — no sibling __tests__/public-api*.test.* or domain-contract*.test.* or public-mapper*.test.*`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-public-dto-contract-tests: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_PUBLIC_DTO_CONTRACT_TESTS_PASS");
