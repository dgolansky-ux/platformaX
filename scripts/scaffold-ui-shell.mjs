import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const shellName = process.argv[2];

if (!shellName) {
  console.error("Usage: node scripts/scaffold-ui-shell.mjs <shell-name>");
  console.error("Example: node scripts/scaffold-ui-shell.mjs community-feed");
  process.exit(1);
}

const VALID_NAME = /^[a-z][a-z0-9-]*$/;
if (!VALID_NAME.test(shellName)) {
  console.error(`Invalid shell name: "${shellName}". Use lowercase kebab-case.`);
  process.exit(1);
}

const shellDir = join(ROOT, "client/src/app-v2", shellName);

if (existsSync(shellDir)) {
  console.error(`UI shell "${shellName}" already exists.`);
  process.exit(1);
}

mkdirSync(shellDir, { recursive: true });

writeFileSync(join(shellDir, "README.md"), `# ${shellName} — UI Shell

Status: \`SCAFFOLD_ONLY\`

## Purpose

Composition shell for the ${shellName} area.

## Constraints

- Must not import legacy code (features/, pages/, components/)
- Must not import domain internals (repository, service, policy, mapper)
- May compose from domain public-api/contracts/events
- May use shared UI components from features-v2/shared-ui

## Status history

| Date | Status | Evidence | Notes |
|---|---|---|---|
| ${new Date().toISOString().split("T")[0]} | SCAFFOLD_ONLY | this file | initial scaffold |
`);

writeFileSync(join(shellDir, ".gitkeep"), "");

console.log(`SCAFFOLD_UI_SHELL_CREATED: ${shellName}`);
console.log(`  path: client/src/app-v2/${shellName}/`);
