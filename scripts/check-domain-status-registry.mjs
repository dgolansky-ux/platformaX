import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");
const DOMAIN_REG_PATH = join(ROOT, "server/domains-v2/domain-registry.ts");

// Human-facing status docs that must not drift from the machine-readable
// registry (DOMAIN_STATUS_REGISTRY.yml) and code registry (domain-registry.ts).
const MARKDOWN_STATUS_DOCS = [
  "docs/architecture/DOMAIN_REGISTRY.md",
  "docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md",
  "docs/architecture/PlatformaX-V2-domain-status.md",
];

const ALLOWED_STATUSES = [
  "NOT_STARTED", "PLANNED", "SCAFFOLD_ONLY", "UI_SHELL_ONLY",
  "MOCK_LOCAL_ONLY", "BACKEND_NOT_STARTED", "PARTIAL",
  "AUTH_RUNTIME_PARTIAL", "UI_VISUAL_SHELL_DONE", "MANUAL_REVIEW_REQUIRED",
  "VISUAL_DONE", "BACKEND_PARTIAL", "IMPLEMENTED", "BLOCKED", "IN_PROGRESS",
];

const STATUS_SET = new Set(ALLOWED_STATUSES);

/** Strip surrounding backticks/whitespace from a markdown table cell. */
function cleanCell(cell) {
  return cell.trim().replace(/^`+|`+$/g, "").trim();
}

/**
 * Parse markdown table rows into [firstCell, [statusCellsFound]] pairs.
 * A "status cell" is any cell whose exact value is an allowed status token.
 */
function parseMarkdownStatusRows(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map(cleanCell);
    if (cells.length < 2) continue;
    // Skip header/separator rows.
    if (cells.every((c) => /^:?-+:?$/.test(c) || c === "")) continue;
    const name = cells[0];
    const statusCells = cells.filter((c) => STATUS_SET.has(c));
    rows.push({ name, statusCells });
  }
  return rows;
}

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

const tsStatusMap = {};
for (const line of tsContent.split("\n")) {
  const statusMatch = line.match(/name:\s*"([^"]+)".*status:\s*"([^"]+)"/);
  if (statusMatch) {
    tsStatusMap[statusMatch[1]] = statusMatch[2];
  }
}

for (const domain of domains) {
  if (domain.status && !ALLOWED_STATUSES.includes(domain.status)) {
    console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${domain.name}" has invalid status "${domain.status}" (not in allowed taxonomy)`);
    violations++;
  }

  if (domain.conflict === true) {
    if (!domain.requires_manual_resolution || domain.requires_manual_resolution.trim().length < 10) {
      console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${domain.name}" has conflict: true but missing or inadequate requires_manual_resolution reason`);
      violations++;
    }
  }

  const tsStatus = tsStatusMap[domain.name];
  if (tsStatus && domain.status && tsStatus !== domain.status && domain.conflict !== true) {
    console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: domain "${domain.name}" status mismatch — registry says "${domain.status}", domain-registry.ts says "${tsStatus}" but conflict is not flagged`);
    violations++;
  }
}

// Anti-drift: human-facing status docs must agree with the canonical registry.
const expectedStatusByName = {};
for (const domain of domains) {
  if (domain.status) expectedStatusByName[domain.name] = domain.status;
}

for (const docRel of MARKDOWN_STATUS_DOCS) {
  const docPath = join(ROOT, docRel);
  if (!existsSync(docPath)) {
    console.error(`DOMAIN_STATUS_REGISTRY_VIOLATION: status doc "${docRel}" does not exist`);
    violations++;
    continue;
  }
  const rows = parseMarkdownStatusRows(readFileSync(docPath, "utf-8"));
  for (const row of rows) {
    const expected = expectedStatusByName[row.name];
    if (!expected) continue;
    // Canonical status declarations carry exactly one status token in the row.
    // Rows with two tokens (e.g. a "Previous status | New status" example) are
    // illustrative and intentionally skipped.
    const distinct = [...new Set(row.statusCells)];
    if (distinct.length !== 1) continue;
    if (distinct[0] !== expected) {
      console.error(
        `DOMAIN_STATUS_REGISTRY_VIOLATION: ${docRel} lists domain "${row.name}" as "${distinct[0]}" but DOMAIN_STATUS_REGISTRY.yml says "${expected}"`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-status-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_DOMAIN_STATUS_REGISTRY_PASS (${domains.length} domains validated, ${tsDomains.length} code domains covered, ${MARKDOWN_STATUS_DOCS.length} status docs checked for drift)`);
