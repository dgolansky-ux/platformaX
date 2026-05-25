import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

function readFileSafe(path) {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const featureRegistryPath = join(ROOT, "client/src/features-v2/feature-registry.ts");
const domainStatusPath = join(ROOT, "docs/architecture/PlatformaX-V2-domain-status.md");

let violations = 0;

const registryContent = readFileSafe(featureRegistryPath);
const domainStatusContent = readFileSafe(domainStatusPath);

function parseRegistryEntries(content) {
  if (!content) return {};
  const entries = {};
  const entryPattern = /["'](\w[\w-]*)["']\s*:\s*\{([^}]+)\}/g;
  let match;
  while ((match = entryPattern.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const statusMatch = body.match(/status\s*:\s*["']([^"']+)["']/);
    const hasDomainLogicMatch = body.match(/hasDomainLogic\s*:\s*(true|false)/);
    entries[name] = {
      status: statusMatch ? statusMatch[1] : "UNKNOWN",
      hasDomainLogic: hasDomainLogicMatch ? hasDomainLogicMatch[1] === "true" : false,
    };
  }
  return entries;
}

function parseDomainStatusTable(content) {
  if (!content) return {};
  const entries = {};
  const lines = content.split("\n");
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (line.includes("---")) continue;
    if (line.includes("Domain / Area")) continue;
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length >= 4) {
      const name = cells[0].replace(/`/g, "").trim();
      const status = cells[2].replace(/`/g, "").trim();
      entries[name] = status;
    }
  }
  return entries;
}

const registryEntries = parseRegistryEntries(registryContent);
const domainStatuses = parseDomainStatusTable(domainStatusContent);

const BACKEND_DOMAINS_DIR = join(ROOT, "server/domains-v2");
const backendDomains = existsSync(BACKEND_DOMAINS_DIR)
  ? readdirSync(BACKEND_DOMAINS_DIR, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)
  : [];

for (const domain of backendDomains) {
  const domainDir = join(BACKEND_DOMAINS_DIR, domain);
  const hasService = existsSync(join(domainDir, "service.ts"));
  const hasRepository = existsSync(join(domainDir, "repository.ts"));
  const hasRouter = existsSync(join(domainDir, "router.ts"));
  const hasTests = existsSync(join(domainDir, "__tests__"));
  const hasRuntimeEvidence = hasService || hasRepository || hasRouter;

  const readmeContent = readFileSafe(join(domainDir, "README.md"));
  const readmeStatus = readmeContent ? readmeContent.match(/Status:\s*`?([A-Z_]+)`?/i) : null;
  const readmeStatusValue = readmeStatus ? readmeStatus[1] : null;

  const registryEntry = registryEntries[domain];
  const officialStatus = domainStatuses[domain];

  if (registryEntry && registryEntry.status === "SCAFFOLD_ONLY" && hasRuntimeEvidence) {
    if (readmeStatusValue && readmeStatusValue !== "SCAFFOLD_ONLY") {
      console.error(`STATUS_TRUTH_VIOLATION: domain "${domain}" — registry says SCAFFOLD_ONLY but README says ${readmeStatusValue} and runtime files exist (service/repository/router)`);
      violations++;
    }
  }

  if (registryEntry && !registryEntry.hasDomainLogic) {
    if (hasService || hasRepository) {
      const testFiles = hasTests ? walk(join(domainDir, "__tests__")).filter(f => f.endsWith(".test.ts")) : [];
      const hasRuntimeTests = testFiles.some(f => {
        const c = readFileSafe(f);
        return c && (/service|repository|adapter|runtime/i.test(c));
      });
      if (hasRuntimeTests) {
        console.error(`STATUS_TRUTH_VIOLATION: domain "${domain}" — registry.hasDomainLogic=false but service/repository and runtime tests exist`);
        violations++;
      }
    }
  }

  if (readmeStatusValue === "IMPLEMENTED" && !hasTests) {
    console.error(`STATUS_TRUTH_VIOLATION: domain "${domain}" — README claims IMPLEMENTED but no __tests__ directory found`);
    violations++;
  }

  if (readmeStatusValue === "BACKEND_DONE" && !hasRuntimeEvidence) {
    console.error(`STATUS_TRUTH_VIOLATION: domain "${domain}" — README claims BACKEND_DONE but no service/repository/router found`);
    violations++;
  }

  if (readmeStatusValue === "BACKEND_DONE" && !hasTests) {
    console.error(`STATUS_TRUTH_VIOLATION: domain "${domain}" — README claims BACKEND_DONE but no tests found`);
    violations++;
  }
}

const reviewDir = join(ROOT, "docs/review");
if (existsSync(reviewDir)) {
  const reportDirs = readdirSync(reviewDir, { withFileTypes: true }).filter(e => e.isDirectory());
  for (const dir of reportDirs) {
    const reportFiles = readdirSync(join(reviewDir, dir.name)).filter(f => f.endsWith(".md"));
    for (const rf of reportFiles) {
      const content = readFileSafe(join(reviewDir, dir.name, rf));
      if (!content) continue;
      if (content.includes("PR_READY") || content.includes("IMPLEMENTED")) {
        const domainMatch = content.match(/domain[:\s]*["']?(\w[\w-]*)/i);
        if (domainMatch) {
          const reportDomain = domainMatch[1];
          if (domainStatuses[reportDomain] && domainStatuses[reportDomain] === "PLANNED") {
            console.error(`STATUS_TRUTH_VIOLATION: report "${dir.name}/${rf}" claims PR_READY/IMPLEMENTED for "${reportDomain}" but domain-status.md says PLANNED`);
            violations++;
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-status-truth-consistency: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_STATUS_TRUTH_CONSISTENCY_PASS");
