import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

const DOMAIN_STATUS_PATH = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");
const DOMAINS_DIR = join(ROOT, "server/domains-v2");

function parseYamlStatuses(content) {
  const domains = [];
  const blocks = content.split(/^\s{2}- name:/gm);
  for (let i = 1; i < blocks.length; i++) {
    const block = "  - name:" + blocks[i];
    const nameMatch = block.match(/name:\s*(\S+)/);
    const statusMatch = block.match(/status:\s*(\S+)/);
    if (nameMatch && statusMatch) {
      domains.push({ name: nameMatch[1], status: statusMatch[1] });
    }
  }
  return domains;
}

function domainHasFile(domainDir, fileName) {
  const fp = join(domainDir, fileName);
  return existsSync(fp);
}

function domainHasTests(domainDir) {
  const testsDir = join(domainDir, "__tests__");
  if (!existsSync(testsDir)) return false;
  try {
    const entries = readdirSync(testsDir);
    return entries.some(e => /\.(test|spec)\.(ts|tsx|js)$/.test(e));
  } catch { return false; }
}

function domainHasReadme(domainDir) {
  return existsSync(join(domainDir, "README.md"));
}

function domainHasRuntimeRouter(domainDir) {
  if (!domainHasFile(domainDir, "router.ts")) return false;
  try {
    const content = readFileSync(join(domainDir, "router.ts"), "utf-8");
    return content.length > 100 && !content.includes("SCAFFOLD_ONLY");
  } catch { return false; }
}

function domainHasRuntimeService(domainDir) {
  if (!domainHasFile(domainDir, "service.ts")) return false;
  try {
    const content = readFileSync(join(domainDir, "service.ts"), "utf-8");
    return content.length > 100 && !content.includes("SCAFFOLD_ONLY");
  } catch { return false; }
}

let violations = 0;

if (!existsSync(DOMAIN_STATUS_PATH)) {
  console.error("READINESS_FAIL: DOMAIN_STATUS_REGISTRY.yml not found");
  process.exit(1);
}

const registryContent = readFileSync(DOMAIN_STATUS_PATH, "utf-8");
const domains = parseYamlStatuses(registryContent);

for (const { name, status } of domains) {
  const domainDir = join(DOMAINS_DIR, name);
  if (!existsSync(domainDir)) continue;

  if (status === "SCAFFOLD_ONLY") {
    if (domainHasRuntimeService(domainDir) || domainHasRuntimeRouter(domainDir)) {
      console.error(`READINESS_VIOLATION: ${name} is SCAFFOLD_ONLY but has real runtime service/router`);
      violations++;
    }
  }

  if (status === "PARTIAL") {
    const hasService = domainHasFile(domainDir, "service.ts");
    const hasTests = domainHasTests(domainDir);
    const hasPublicApi = domainHasFile(domainDir, "public-api.ts");

    if (!hasService) {
      console.error(`READINESS_VIOLATION: ${name} is PARTIAL but missing service.ts`);
      violations++;
    }
    if (!hasTests) {
      console.error(`READINESS_VIOLATION: ${name} is PARTIAL but missing tests`);
      violations++;
    }
    if (!hasPublicApi) {
      console.error(`READINESS_VIOLATION: ${name} is PARTIAL but missing public-api.ts`);
      violations++;
    }
  }

  if (status === "IMPLEMENTED" || status === "BACKEND_DONE") {
    const requiredFiles = [
      "service.ts", "repository.ts", "policy.ts",
      "dto.ts", "public-api.ts",
    ];
    const missingFiles = requiredFiles.filter(f => !domainHasFile(domainDir, f));

    if (missingFiles.length > 0) {
      console.error(`READINESS_VIOLATION: ${name} is ${status} but missing: ${missingFiles.join(", ")}`);
      violations++;
    }
    if (!domainHasTests(domainDir)) {
      console.error(`READINESS_VIOLATION: ${name} is ${status} but has no tests`);
      violations++;
    }

    const hasMapper = domainHasFile(domainDir, "mapper.ts");
    if (!hasMapper) {
      const hasRepository = domainHasFile(domainDir, "repository.ts");
      if (hasRepository) {
        try {
          const repoContent = readFileSync(join(domainDir, "repository.ts"), "utf-8");
          if (/raw|record|row/i.test(repoContent)) {
            console.error(`READINESS_VIOLATION: ${name} is ${status} with raw records in repository but no mapper.ts`);
            violations++;
          }
        } catch {}
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-runtime-readiness-status: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_RUNTIME_READINESS_STATUS_PASS");
