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

// === active architecture-doc drift ==========================================
// Reviewers read the human architecture docs (DOMAIN_OWNERSHIP_MATRIX,
// DOMAIN_REGISTRY) more often than the YAML registry. If their `Status`
// columns drift away from the canonical sources, the doc-readable story stops
// matching reality — which is exactly how identity/media kept being shown as
// SCAFFOLD_ONLY long after they reached PARTIAL.

const ACTIVE_STATUS_DOCS = [
  "docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md",
  "docs/architecture/DOMAIN_REGISTRY.md",
];

// Compose the canonical status map from BOTH sources. They are kept in sync
// by the earlier conflict check, so picking either is correct; we prefer the
// YAML registry because it is the documented source of truth.
const canonicalStatusByDomain = new Map();
for (const d of domains) {
  if (d.status) canonicalStatusByDomain.set(d.name, d.status);
}
for (const [name, status] of Object.entries(tsStatusMap)) {
  if (!canonicalStatusByDomain.has(name)) canonicalStatusByDomain.set(name, status);
}

function parseMarkdownTableRows(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    while (cells.length && cells[0] === "") cells.shift();
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length < 2) continue;
    rows.push(cells);
  }
  return rows;
}

for (const docPath of ACTIVE_STATUS_DOCS) {
  const abs = join(ROOT, docPath);
  if (!existsSync(abs)) continue;
  const content = readFileSync(abs, "utf-8");
  // Identify the "Status" column index from each header row in the file. A
  // file can carry multiple tables (Owner / Composition / Operational), so we
  // re-detect the header per section.
  let statusIdx = -1;
  let domainIdx = -1;
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    while (cells.length && cells[0] === "") cells.shift();
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length === 0) continue;
    // Treat a header line as one that contains a "Status" cell and a
    // domain-like cell ("Domain" or "Layer").
    if (cells.some((c) => /^Status$/i.test(c))) {
      statusIdx = cells.findIndex((c) => /^Status$/i.test(c));
      domainIdx = cells.findIndex((c) => /^Domain$/i.test(c) || /^Layer$/i.test(c));
      continue;
    }
    if (/^-+$/.test(cells[0] ?? "")) continue;
    if (statusIdx === -1 || domainIdx === -1) continue;
    const name = cells[domainIdx];
    const claimed = cells[statusIdx];
    if (!name || !claimed) continue;
    if (!canonicalStatusByDomain.has(name)) continue; // application-layer rows etc.
    const canonical = canonicalStatusByDomain.get(name);
    if (claimed !== canonical) {
      console.error(
        `DOMAIN_STATUS_DRIFT: ${docPath} claims "${name}" has status "${claimed}" but canonical sources (DOMAIN_STATUS_REGISTRY.yml + domain-registry.ts) say "${canonical}".`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-status-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_DOMAIN_STATUS_REGISTRY_PASS (${domains.length} domains validated, ${tsDomains.length} code domains covered, ${ACTIVE_STATUS_DOCS.length} active docs scanned)`);
