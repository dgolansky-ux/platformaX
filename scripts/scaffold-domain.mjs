import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const domainName = process.argv[2];

if (!domainName) {
  console.error("Usage: node scripts/scaffold-domain.mjs <domain-name>");
  console.error("Example: node scripts/scaffold-domain.mjs notifications");
  process.exit(1);
}

const VALID_NAME = /^[a-z][a-z0-9-]*$/;
if (!VALID_NAME.test(domainName)) {
  console.error(`Invalid domain name: "${domainName}". Use lowercase kebab-case.`);
  process.exit(1);
}

const serverDir = join(ROOT, "server/domains-v2", domainName);
const clientDir = join(ROOT, "client/src/features-v2", domainName);

if (existsSync(serverDir) || existsSync(clientDir)) {
  console.error(`Domain "${domainName}" already exists.`);
  process.exit(1);
}

mkdirSync(serverDir, { recursive: true });
mkdirSync(clientDir, { recursive: true });

writeFileSync(join(serverDir, "README.md"), `# ${domainName}

Status: \`SCAFFOLD_ONLY\`
Owner: TBD

## Purpose

<!-- Describe the domain's responsibility -->

## Boundaries

- Public API: \`public-api.ts\` (when implemented)
- Contracts: \`contracts/\` (when implemented)
- Events: \`events/\` (when implemented)

## Internal modules (not importable by other domains)

- repository
- service
- policy
- mapper

## Status history

| Date | Status | Evidence | Notes |
|---|---|---|---|
| ${new Date().toISOString().split("T")[0]} | SCAFFOLD_ONLY | this file | initial scaffold |
`);

writeFileSync(join(serverDir, ".gitkeep"), "");
writeFileSync(join(clientDir, ".gitkeep"), "");

writeFileSync(join(clientDir, "README.md"), `# ${domainName} — UI Feature

Status: \`SCAFFOLD_ONLY\`

## Purpose

UI shell for the ${domainName} domain.

## Constraints

- Must not import from other domains' internal modules
- Must not import legacy code
- Must use public-api/contracts/events for cross-domain communication
`);

console.log(`SCAFFOLD_DOMAIN_CREATED: ${domainName}`);
console.log(`  server: server/domains-v2/${domainName}/`);
console.log(`  client: client/src/features-v2/${domainName}/`);
