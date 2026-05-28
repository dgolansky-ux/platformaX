import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const domainName = process.argv[2];
const proposeDomain = process.argv.includes("--propose-domain");

if (!domainName) {
  console.error("Usage: node scripts/scaffold-domain.mjs <domain-name> [--propose-domain]");
  console.error("Example: node scripts/scaffold-domain.mjs notifications");
  process.exit(1);
}

const VALID_NAME = /^[a-z][a-z0-9-]*$/;
if (!VALID_NAME.test(domainName)) {
  console.error(`Invalid domain name: "${domainName}". Use lowercase kebab-case.`);
  process.exit(1);
}

const KNOWN_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
];

if (!KNOWN_DOMAINS.includes(domainName) && !proposeDomain) {
  console.error(`Domain "${domainName}" is not in the registry.`);
  console.error("If you want to propose a new domain, use: --propose-domain");
  console.error("Known domains: " + KNOWN_DOMAINS.join(", "));
  process.exit(1);
}

const serverDir = join(ROOT, "server/domains-v2", domainName);
const clientDir = join(ROOT, "client/src/features-v2", domainName);
const testDir = join(serverDir, "__tests__");

if (existsSync(serverDir) || existsSync(clientDir)) {
  console.error(`Domain "${domainName}" already exists.`);
  process.exit(1);
}

mkdirSync(serverDir, { recursive: true });
mkdirSync(clientDir, { recursive: true });
mkdirSync(testDir, { recursive: true });

const date = new Date().toISOString().split("T")[0];

writeFileSync(join(serverDir, "README.md"), `# ${domainName}

Status: \`SCAFFOLD_ONLY\`
Owner: @dgolansky-ux

## Purpose

<!-- Describe the domain's responsibility -->

## Owns

<!-- What data/entities does this domain own? -->

## Does NOT own

<!-- What is explicitly out of scope? -->

## Public surface

- \`public-api.ts\`
- \`contracts.ts\`
- \`events.ts\`

## Internal modules (not importable by other domains)

- repository
- service
- policy
- router
- mapper
- db
- schema
- cache-keys
- internal

## Status history

| Date | Status | Evidence | Notes |
|---|---|---|---|
| ${date} | SCAFFOLD_ONLY | this file | initial scaffold |
`);

writeFileSync(join(serverDir, "public-api.ts"), `/**
 * ${domainName} — public API surface
 * Status: SCAFFOLD_ONLY
 *
 * Other domains may import from this file.
 * Internal modules (repository, service, policy, etc.) must NOT be imported cross-domain.
 */
export {};
`);

writeFileSync(join(serverDir, "contracts.ts"), `/**
 * ${domainName} — contracts
 * Status: SCAFFOLD_ONLY
 *
 * Cross-domain contract types. Other domains may depend on these types.
 */
export {};
`);

writeFileSync(join(serverDir, "events.ts"), `/**
 * ${domainName} — domain events
 * Status: SCAFFOLD_ONLY
 *
 * Events published by this domain. Other domains may subscribe to these.
 */
export {};
`);

writeFileSync(join(serverDir, "dto.ts"), `/**
 * ${domainName} — data transfer objects
 * Status: SCAFFOLD_ONLY
 *
 * Public DTOs exposed by this domain. Must not contain PII unless explicitly allowed.
 */
export {};
`);

writeFileSync(join(serverDir, "policy.ts"), `/**
 * ${domainName} — domain policies
 * Status: SCAFFOLD_ONLY
 *
 * Business rules and invariants for this domain. Internal — not importable cross-domain.
 */
export {};
`);

writeFileSync(join(serverDir, "index.ts"), `/**
 * ${domainName} — barrel export
 * Status: SCAFFOLD_ONLY
 *
 * Re-exports public surface only.
 */
export * from "./public-api";
export * from "./contracts";
export * from "./events";
`);

writeFileSync(join(testDir, "domain-contract.test.ts"), `import { describe, it, expect } from "vitest";

describe("${domainName} domain contract", () => {
  it("public-api exposes no runtime surface yet (SCAFFOLD_ONLY)", async () => {
    const mod = await import("../public-api");
    expect(Object.keys(mod)).toHaveLength(0);
  });

  it("exports from public-api", async () => {
    const mod = await import("../public-api");
    expect(mod).toBeDefined();
  });

  it("exports from contracts", async () => {
    const mod = await import("../contracts");
    expect(mod).toBeDefined();
  });

  it("exports from events", async () => {
    const mod = await import("../events");
    expect(mod).toBeDefined();
  });
});
`);

writeFileSync(join(clientDir, "README.md"), `# ${domainName} — UI Feature

Status: \`SCAFFOLD_ONLY\`

## Purpose

UI shell for the ${domainName} domain.

## Constraints

- Must not import from other domains' internal modules
- Must not import legacy code
- Must use public-api/contracts/events for cross-domain communication
`);

writeFileSync(join(clientDir, "index.ts"), `/**
 * features-v2/${domainName} — UI feature barrel
 * Status: SCAFFOLD_ONLY
 */
export {};
`);

console.log(`SCAFFOLD_DOMAIN_CREATED: ${domainName}`);
console.log(`  server: server/domains-v2/${domainName}/`);
console.log(`  client: client/src/features-v2/${domainName}/`);
if (proposeDomain) {
  console.log(`  NOTE: "${domainName}" is a PROPOSED domain — add it to domain-registry.ts and DOMAIN_REGISTRY.md`);
}
