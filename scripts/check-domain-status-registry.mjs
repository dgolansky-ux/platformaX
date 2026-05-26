import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");
const DOMAIN_REG_PATH = join(ROOT, "server/domains-v2/domain-registry.ts");

const ALLOWED_STATUSES = [
  "NOT_STARTED", "PLANNED", "SCAFFOLD_ONLY", "UI_SHELL_ONLY",
  "MOCK_LOCAL_ONLY", "BACKEND_NOT_STARTED", "PARTIAL",
  "AUTH_RUNTIME_PARTIAL", "UI_VISUAL_SHELL_DONE", "MANUAL_REVIEW_REQUIRED",
  "VISUAL_DONE", "BACKEND_PARTIAL", "IMPLEMENTED", "BLOCKED", "IN_PROGRESS",
];

let violations = 0;

if (!existsSync(REGISTRY_PATH)) {
  console.error("DOMAIN_STATUS_REGISTRY_VIOLATION: docs/governance/DOMAIN_STATUS_REGISTRY.yml does not exist");
  process.exit(1);
}

if (!existsSync(DOMAIN_REG_PATH)) {
  console.error("DOMAIN_STATUS_REGISTRY_VIOLATION: server/domains-v2/domain-registry.ts does not exist");
  process.exit(1);
}

const tsContent = readFileSync(DOMAIN_REG_PATH, "utf-8");
const domainMatches = tsContent.match(/name:\s*"([^"]+)"/g) || [];
const tsDomains = domainMatches.map((m) => m.match(/name:\s*"([^"]+)"/)[1]);

const ymlContent = readFileSync(REGISTRY_PATH, "utf-8");
const lines = ymlContent.split("\n");

const domains = [];
let current = null;
let currentKey = null;

for (const line of lines) {
  if (line.match(/^\s*#/) || line.trim() === "") continue;

  if (line.match(/^\s*- name:\s*/)) {
    if (current) domains.push(current);
    current = { name: line.replace(/^\s*- name:\s*/, "").trim() };
    currentKey = "name";
    continue;
  }

  if (!current) continue;

  const kvMatch = line.match(/^\s{4}(\w[\w_]*):\s*(.*)/);
  if (kvMatch) {
    const [, key, rawVal] = kvMatch;
    currentKey = key;
    const val = rawVal.trim();

    if (val === "true") current[key] = true;
    else if (val === "false") current[key] = false;
    else if (val === "null" || val === "") current[key] = null;
    else if (val === ">") current[key] = "";
    else current[key] = val;
    continue;
  }

  const listItemMatch = line.match(/^\s{6}- (.+)/);
  if (listItemMatch && currentKey) {
    if (!Array.isArray(current[currentKey])) {
      current[currentKey] = current[currentKey] ? [current[currentKey]] : [];
    }
    current[currentKey].push(listItemMatch[1].trim());
    continue;
  }

  if (line.match(/^\s{6}/) && currentKey) {
    if (typeof current[currentKey] === "string") {
      current[currentKey] += " " + line.trim();
    }
  }
}
if (current) domains.push(current);

const ymlDomainNames = new Set(domains.map((d) => d.name));

for (const tsDomain of tsDomains) {
  if (!ymlDomainNames.has(tsDomain)) {
    console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${tsDomain}" from domain-registry.ts not found in DOMAIN_STATUS_REGISTRY.yml`);
    violations++;
  }
}

for (const domain of domains) {
  if (domain.status && !ALLOWED_STATUSES.includes(domain.status)) {
    console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${domain.name}" has invalid status "${domain.status}" (not in allowed taxonomy)`);
    violations++;
  }

  if (domain.conflict === true) {
    if (!domain.requires_manual_resolution) {
      console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${domain.name}" has conflict: true but missing requires_manual_resolution`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-status-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_DOMAIN_STATUS_REGISTRY_PASS (${domains.length} domains validated, ${tsDomains.length} code domains covered)`);
