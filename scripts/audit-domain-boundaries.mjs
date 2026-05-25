import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "server/domains-v2",
  "client/src/features-v2",
  "client/src/app-v2",
];

const CROSS_DOMAIN_BLOCKED = [
  "repository",
  "repository.drizzle",
  "service",
  "policy",
  "router",
  "mapper",
  "db",
  "schema",
  "cache-keys",
  "internal",
];

const CROSS_DOMAIN_ALLOWED = [
  "public-api",
  "contracts",
  "events",
  "dto",
  "shared",
];

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

function getDomainName(relPath) {
  if (relPath.startsWith("server/domains-v2/")) {
    const parts = relPath.split("/");
    return parts[2] || null;
  }
  if (relPath.startsWith("client/src/features-v2/")) {
    const parts = relPath.split("/");
    return parts[3] || null;
  }
  return null;
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    const currentDomain = getDomainName(rel);

    const importLines = content.split("\n").filter(l =>
      l.includes("import") && (l.includes("from") || l.includes("require"))
    );

    for (const line of importLines) {
      if (rel.startsWith("client/src/app-v2/")) {
        const legacyPatterns = ["features/", "pages/", "components/", "legacy"];
        for (const lp of legacyPatterns) {
          if (line.includes(lp)) {
            console.error(`BOUNDARY_VIOLATION: legacy import "${lp}" in ${rel}`);
            violations++;
          }
        }
        continue;
      }

      if (!currentDomain) continue;

      for (const blocked of CROSS_DOMAIN_BLOCKED) {
        const crossPattern = new RegExp(`domains-v2/(?!${currentDomain}/)\\w+/${blocked}`);
        if (crossPattern.test(line)) {
          const isAllowed = CROSS_DOMAIN_ALLOWED.some(a => line.includes(a));
          if (!isAllowed) {
            console.error(`BOUNDARY_VIOLATION: cross-domain "${blocked}" import in ${rel}`);
            violations++;
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\naudit-domain-boundaries: ${violations} violation(s)`);
  process.exit(1);
}

console.log("AUDIT_DOMAIN_BOUNDARIES_PASS");
