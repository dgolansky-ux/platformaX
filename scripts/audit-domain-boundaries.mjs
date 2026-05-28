import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, posix } from "path";

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

function extractImportPaths(content) {
  const paths = [];
  const staticImport = /(?:import|export)\s+.*?\s+from\s+["']([^"']+)["']/g;
  const dynamicImport = /import\(\s*["']([^"']+)["']\s*\)/g;
  const requireCall = /require\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = staticImport.exec(content)) !== null) paths.push(m[1]);
  while ((m = dynamicImport.exec(content)) !== null) paths.push(m[1]);
  while ((m = requireCall.exec(content)) !== null) paths.push(m[1]);
  return paths;
}

function resolveRelativeImport(fileRelPath, importPath) {
  if (!importPath.startsWith(".")) return null;
  const fileDir = posix.dirname(fileRelPath);
  return posix.normalize(posix.join(fileDir, importPath));
}

function getImportedDomainAndModule(resolvedPath) {
  const m1 = resolvedPath.match(/^server\/domains-v2\/([^/]+)\/(.+)/);
  if (m1) return { domain: m1[1], module: m1[2].split("/")[0] };

  const m2 = resolvedPath.match(/^client\/src\/features-v2\/([^/]+)\/(.+)/);
  if (m2) return { domain: m2[1], module: m2[2].split("/")[0] };

  return null;
}

let violations = 0;

function checkPublicApiExportsInternals(fp, rel, content) {
  if (!rel.endsWith("public-api.ts")) return;
  const blockedExports = [
    "repository",
    "router",
    "mapper",
    "cache-keys",
    "cacheKeys",
    "schema",
    "internal",
  ];
  // Collapse multiline `export {\n ... \n} from "..."` onto one logical line so
  // an export spread across several lines cannot hide a repository/internal leak.
  const normalized = content.replace(/\}\s*\n\s*from\s+/g, "} from ");
  for (const blocked of blockedExports) {
    // `[^;]*` keeps the match scoped to a single (possibly multiline) statement;
    // `[^"']*` keeps it scoped to the imported module specifier.
    const pat = new RegExp(`export[^;]*from\\s+["'][^"']*${blocked}`, "im");
    if (pat.test(normalized)) {
      console.error(`BOUNDARY_VIOLATION: public-api.ts exports internal "${blocked}" in ${rel}`);
      violations++;
    }
  }
}

function checkClientServerBoundary(fp, rel, content) {
  // Frontend production code must never import the server runtime directly.
  // It depends on `@shared/contracts/*` (type-only) and `@shared/wiring/*`
  // (the single composition point that is allowed to touch `@server/*`).
  if (!rel.startsWith("client/")) return;
  if (
    rel.includes("__tests__/") ||
    rel.endsWith(".test.ts") ||
    rel.endsWith(".test.tsx")
  ) {
    return;
  }
  if (/from\s+["']@server\//.test(content) || /import\(\s*["']@server\//.test(content)) {
    console.error(
      `BOUNDARY_VIOLATION: client production file imports @server/* in ${rel} — use @shared/contracts/ (types) or @shared/wiring/ instead`,
    );
    violations++;
  }
}

function checkSharedUiDomainImports(fp, rel, content) {
  if (!rel.startsWith("client/src/features-v2/shared-ui/")) return;
  const domainPatterns = [
    /import.*from.*domains-v2/,
    /import.*from.*features-v2\/(?!shared-ui)/,
    /import.*from.*\/identity\//,
    /import.*from.*\/social\//,
    /import.*from.*\/content/,
    /import.*from.*\/communities/,
  ];
  for (const pat of domainPatterns) {
    if (pat.test(content)) {
      console.error(`BOUNDARY_VIOLATION: shared-ui imports business domain in ${rel}`);
      violations++;
      break;
    }
  }
}

function checkAppV2BackendInternals(fp, rel, content) {
  if (!rel.startsWith("client/src/app-v2/")) return;
  const backendPatterns = [
    /import.*from.*server\//,
    /import.*from.*domains-v2.*\/(repository|service|policy|router|mapper|cache-keys)/,
  ];
  for (const pat of backendPatterns) {
    if (pat.test(content)) {
      console.error(`BOUNDARY_VIOLATION: app-v2 imports backend internals in ${rel}`);
      violations++;
    }
  }
}

function checkFeatureCrossDomainInternals(fp, rel, content) {
  if (!rel.startsWith("client/src/features-v2/")) return;
  if (rel.startsWith("client/src/features-v2/shared-ui/")) return;
  const currentFeature = rel.split("/")[3];
  if (!currentFeature) return;
  const crossFeatureInternal = new RegExp(`from\\s+["'].*features-v2/(?!${currentFeature}/)(?!shared-ui/)[^"']+["']`);
  if (crossFeatureInternal.test(content)) {
    const match = content.match(crossFeatureInternal);
    if (match && !match[0].includes("/public-api") && !match[0].includes("/contracts") && !match[0].includes("/events")) {
      console.error(`BOUNDARY_VIOLATION: feature "${currentFeature}" imports internals of another feature in ${rel}`);
      violations++;
    }
  }
}

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    const currentDomain = getDomainName(rel);
    const importPaths = extractImportPaths(content);

    checkPublicApiExportsInternals(fp, rel, content);
    checkClientServerBoundary(fp, rel, content);
    checkSharedUiDomainImports(fp, rel, content);
    checkAppV2BackendInternals(fp, rel, content);
    checkFeatureCrossDomainInternals(fp, rel, content);

    // Test files legitimately compose concrete implementations across domains
    // (they wire identity + media + application to exercise an adapter), so the
    // cross-domain *module* checks below do not apply to them — consistent with
    // check-architecture-import-graph.mjs, which skips __tests__ entirely.
    const isTestFile =
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(rel) || rel.includes("__tests__/");
    if (isTestFile) continue;

    for (const imp of importPaths) {
      if (rel.startsWith("client/src/app-v2/")) {
        const legacyPatterns = ["features/", "pages/", "components/", "legacy"];
        for (const lp of legacyPatterns) {
          if (imp.includes(lp)) {
            console.error(`BOUNDARY_VIOLATION: legacy import "${lp}" in ${rel}`);
            violations++;
          }
        }
        continue;
      }

      if (!currentDomain) continue;

      const crossPatternAbs = new RegExp(`domains-v2/(?!${currentDomain}/)\\w+/(${CROSS_DOMAIN_BLOCKED.join("|").replace(/\./g, "\\.")})`);
      if (crossPatternAbs.test(imp)) {
        const isAllowed = CROSS_DOMAIN_ALLOWED.some((a) => imp.includes(a));
        if (!isAllowed) {
          console.error(`BOUNDARY_VIOLATION: cross-domain import in ${rel} (import: "${imp}")`);
          violations++;
        }
        continue;
      }

      if (imp.startsWith(".")) {
        const resolved = resolveRelativeImport(rel, imp);
        if (!resolved) continue;

        const target = getImportedDomainAndModule(resolved);
        if (!target) continue;
        if (target.domain === currentDomain) continue;

        const isBlockedModule = CROSS_DOMAIN_BLOCKED.some(
          (b) => target.module === b || target.module.startsWith(b + ".")
        );
        const isAllowedModule = CROSS_DOMAIN_ALLOWED.some(
          (a) => target.module === a || target.module.startsWith(a + ".")
        );

        if (isBlockedModule && !isAllowedModule) {
          console.error(
            `BOUNDARY_VIOLATION: cross-domain "${target.module}" import from "${target.domain}" in ${rel} (import: "${imp}", resolved: "${resolved}")`
          );
          violations++;
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
