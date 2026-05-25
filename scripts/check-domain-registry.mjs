import { existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const DOMAINS_DIR = join(ROOT, "server/domains-v2");

const KNOWN_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
];

const ALLOWED_STATUSES = [
  "NOT_STARTED", "SCAFFOLD_ONLY", "UI_SHELL_ONLY", "MOCK_LOCAL_ONLY",
  "PARTIAL", "IMPLEMENTED", "BLOCKED", "MANUAL_REVIEW_REQUIRED",
];

const BLOCKED_STATUSES = [
  "DONE", "FULL_DONE", "VISUAL_DONE", "BACKEND_DONE", "CLEAN", "PRODUCTION_READY",
];

const NON_DOMAIN_FILES = ["domain-registry.ts"];

let violations = 0;

for (const domain of KNOWN_DOMAINS) {
  const domainDir = join(DOMAINS_DIR, domain);
  if (!existsSync(domainDir)) {
    console.error(`DOMAIN_REGISTRY_VIOLATION: registered domain "${domain}" has no folder at server/domains-v2/${domain}`);
    violations++;
  }
}

if (existsSync(DOMAINS_DIR)) {
  const entries = readdirSync(DOMAINS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      if (!NON_DOMAIN_FILES.includes(entry.name)) continue;
      continue;
    }
    if (!KNOWN_DOMAINS.includes(entry.name)) {
      console.error(`DOMAIN_REGISTRY_VIOLATION: unknown domain folder "server/domains-v2/${entry.name}" not in registry`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_DOMAIN_REGISTRY_PASS");
