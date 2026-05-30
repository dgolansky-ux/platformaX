import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FEATURES_DIR = join(ROOT, "client/src/features-v2");

const KNOWN_FEATURES = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
  "shared-ui", "friend-feed", "professional-profile",
];

const SHARED_UI = "shared-ui";

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let violations = 0;

for (const feature of KNOWN_FEATURES) {
  const featureDir = join(FEATURES_DIR, feature);
  if (!existsSync(featureDir)) {
    console.error(`FEATURE_REGISTRY_VIOLATION: registered feature "${feature}" has no folder at client/src/features-v2/${feature}`);
    violations++;
  }
}

if (existsSync(FEATURES_DIR)) {
  const entries = readdirSync(FEATURES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      if (entry.name === "feature-registry.ts") continue;
      continue;
    }
    if (!KNOWN_FEATURES.includes(entry.name)) {
      console.error(`FEATURE_REGISTRY_VIOLATION: unknown feature folder "client/src/features-v2/${entry.name}" not in registry`);
      violations++;
    }
  }
}

const sharedUiDir = join(FEATURES_DIR, SHARED_UI);
if (existsSync(sharedUiDir)) {
  const files = walk(sharedUiDir).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
  const DOMAIN_LOGIC_PATTERNS = [
    /import\s+.*from\s+["'].*domains-v2/,
    /import\s+.*from\s+["'].*repository/,
    /import\s+.*from\s+["'].*service/,
  ];
  for (const fp of files) {
    const content = readFileSync(fp, "utf-8");
    for (const pat of DOMAIN_LOGIC_PATTERNS) {
      if (pat.test(content)) {
        const rel = fp.replace(ROOT, "").replace(/\\/g, "/");
        console.error(`FEATURE_REGISTRY_VIOLATION: shared-ui contains domain logic in ${rel}`);
        violations++;
        break;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-feature-registry: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_FEATURE_REGISTRY_PASS");
