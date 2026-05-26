import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const NORMATIVE_PATTERNS = [
  /\bmust\b/i,
  /\bforbidden\b/i,
  /\bnever\b/i,
  /\brequired\b/i,
  /\bmust not\b/i,
  /\bshall not\b/i,
  /\bnie wolno\b/i,
  /\bmusi\b/i,
  /\bwymagane\b/i,
  /\bzakaz\b/i,
  /\bblokuje\b/i,
  /\bfailuje\b/i,
];

const RULE_ID_PATTERN = /PX-[A-Z]+-\d{3}/;
const LOCAL_NOTE_MARKER = "LOCAL_NOTE";
const HISTORICAL_MARKER = "HISTORICAL_REPORT_ONLY";
const GOVERNANCE_LINK_PATTERN = /docs\/governance\/(RULES_REGISTRY|GOVERNANCE_INDEX|README)/;
const TEMPLATE_MARKER = /Status:\s*`?(TEMPLATE|SCAFFOLD)/i;

const SCAN_DIRS = [
  "server/domains-v2",
  "client/src/features-v2",
  "client/src/app-v2",
];

const EXEMPT_DIRS = [
  "docs/governance",
  "docs/review",
  "scripts",
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "__tests__",
];

const EXEMPT_FILES = [
  "docs/governance/RULES_REGISTRY.yml",
  "docs/governance/GOVERNANCE_INDEX.md",
  "docs/governance/AI_AGENT_PERMISSIONS_POLICY.md",
  "docs/governance/AGENT_COMMAND_STANDARD.md",
  "docs/governance/STATUS_TAXONOMY.md",
  "docs/governance/EXCEPTIONS_REGISTER.md",
  "docs/governance/GUARDS_REGISTRY.yml",
  "docs/governance/RULES_TO_GUARDS_MATRIX.md",
  "docs/governance/HIDDEN_RULES_INVENTORY.md",
  "docs/governance/REQUIRED_DOCS_BY_SCOPE.yml",
  "docs/governance/DOMAIN_STATUS_REGISTRY.yml",
  "docs/governance/README.md",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (EXEMPT_DIRS.some(e => rel.startsWith(e) || entry.name === e.split("/").pop())) continue;
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

function isExemptFile(rel) {
  if (EXEMPT_FILES.includes(rel)) return true;
  if (rel.startsWith("docs/governance/")) return true;
  if (rel.startsWith("docs/review/")) return true;
  if (rel.startsWith("scripts/")) return true;
  if (rel.startsWith("docs/templates/")) return true;
  return false;
}

function isGovernanceAuthorityDoc(rel) {
  return rel.startsWith("docs/architecture/") || rel.startsWith("docs/ai/") || rel.startsWith("docs/security/");
}

function hasRuleIdOrLink(content, lineIdx, lines) {
  const contextStart = Math.max(0, lineIdx - 3);
  const contextEnd = Math.min(lines.length, lineIdx + 3);
  const context = lines.slice(contextStart, contextEnd).join(" ");

  if (RULE_ID_PATTERN.test(context)) return true;
  if (context.includes(LOCAL_NOTE_MARKER)) return true;
  if (context.includes(HISTORICAL_MARKER)) return true;
  if (GOVERNANCE_LINK_PATTERN.test(context)) return true;

  return false;
}

let violations = 0;

const scanTargets = [];
for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  scanTargets.push(...walk(absDir));
}

const docsDir = join(ROOT, "docs");
if (existsSync(docsDir)) {
  scanTargets.push(...walk(docsDir));
}

for (const fp of scanTargets) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  if (isExemptFile(rel)) continue;

  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }

  if (content.includes(HISTORICAL_MARKER)) continue;
  if (TEMPLATE_MARKER.test(content)) continue;

  if (isGovernanceAuthorityDoc(rel)) {
    const hasGovernanceHeader = content.includes("docs/governance/") ||
                                content.includes("Governance Index:") ||
                                content.includes("GOVERNANCE_INDEX") ||
                                content.includes("RULES_REGISTRY");
    if (!hasGovernanceHeader && content.length > 200) {
      const lines = content.split("\n");
      let hasNormative = false;
      for (const line of lines) {
        if (NORMATIVE_PATTERNS.some(p => p.test(line))) {
          hasNormative = true;
          break;
        }
      }
      if (hasNormative) {
        console.error(`GOVERNANCE_DRIFT: ${rel} — authority doc with normative rules but no canonical governance link`);
        violations++;
      }
    }
    continue;
  }

  const lines = content.split("\n");
  const isReadme = rel.endsWith("README.md");

  if (!isReadme) continue;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("<!--") || trimmed.startsWith("```") || trimmed === "") continue;
    if (/^#+\s/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;
    if (/^-\s*$/.test(trimmed)) continue;

    const isNormative = NORMATIVE_PATTERNS.some(p => p.test(line));
    if (!isNormative) continue;

    if (/status|scope|purpose|owns|does not own|public surface|internal modules/i.test(trimmed)) continue;
    if (/SCAFFOLD_ONLY|PARTIAL|IMPLEMENTED|PLANNED|NOT_STARTED/i.test(trimmed)) continue;
    if (/env-required|not importable|not in this slice|missing|not done|not applied/i.test(trimmed)) continue;

    const looksLikeGlobalRule = /\b(all domains|every domain|no domain|cross-domain|any domain|global|always must|never allow)\b/i.test(line);

    if (looksLikeGlobalRule && !hasRuleIdOrLink(content, i, lines)) {
      console.error(`GOVERNANCE_DRIFT: ${rel}:${i + 1} — potential global rule without Rule ID: "${trimmed.substring(0, 80)}"`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-governance-drift: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_GOVERNANCE_DRIFT_PASS");
