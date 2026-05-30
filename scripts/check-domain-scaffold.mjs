import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const DOMAINS_DIR = join(ROOT, "server/domains-v2");

const KNOWN_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "notifications-v2",
  "media", "search", "moderation", "audit", "system",
];

const REQUIRED_FILES = [
  "README.md",
  "public-api.ts",
  "contracts.ts",
  "events.ts",
  "dto.ts",
  "policy.ts",
  "index.ts",
];

const SCAFFOLD_STATUSES = ["SCAFFOLD_ONLY", "NOT_STARTED"];
const RUNTIME_FILES = ["service.ts", "repository.ts", "router.ts"];

let violations = 0;

for (const domain of KNOWN_DOMAINS) {
  const domainDir = join(DOMAINS_DIR, domain);
  if (!existsSync(domainDir)) continue;

  for (const reqFile of REQUIRED_FILES) {
    const filePath = join(domainDir, reqFile);
    if (!existsSync(filePath)) {
      console.error(`DOMAIN_SCAFFOLD_VIOLATION: "${domain}" missing required file: ${reqFile}`);
      violations++;
    }
  }

  const testDir = join(domainDir, "__tests__");
  const hasTest = existsSync(testDir) && readdirSync(testDir).some((f) => f.endsWith(".test.ts"));
  if (!hasTest) {
    const readmePath = join(domainDir, "README.md");
    if (existsSync(readmePath)) {
      const readme = readFileSync(readmePath, "utf-8");
      if (!readme.includes("SCAFFOLD_ONLY")) {
        console.error(`DOMAIN_SCAFFOLD_VIOLATION: "${domain}" has no contract test and status is not SCAFFOLD_ONLY`);
        violations++;
      }
    }
  }

  const readmePath = join(domainDir, "README.md");
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, "utf-8");
    for (const rf of RUNTIME_FILES) {
      if (existsSync(join(domainDir, rf))) {
        if (readme.includes("SCAFFOLD_ONLY") && !readme.includes("runtime justification")) {
          console.warn(`DOMAIN_SCAFFOLD_WARNING: "${domain}" has ${rf} but status is SCAFFOLD_ONLY — consider updating README`);
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-scaffold: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DOMAIN_SCAFFOLD_PASS");
