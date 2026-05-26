import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, dirname, basename } from "path";

const ROOT = process.cwd();

const FORBIDDEN_CROSS_DOMAIN_FILES = [
  "repository", "service", "policy", "router",
  "mapper", "cache-keys",
];

const FORBIDDEN_CROSS_DOMAIN_DIRS = ["internal"];

const ALLOWED_CROSS_DOMAIN_FILES = [
  "public-api", "contracts", "events",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function getDomainName(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, "/");
  const match = rel.match(/^server\/domains-v2\/([^/]+)\//);
  if (match) return match[1];
  const featureMatch = rel.match(/^client\/src\/features-v2\/([^/]+)\//);
  if (featureMatch) return featureMatch[1];
  return null;
}

function extractImports(content) {
  const imports = [];
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

function resolveRelativeImport(importPath, sourceFile) {
  if (!importPath.startsWith(".")) return null;
  const sourceDir = dirname(sourceFile);
  return join(sourceDir, importPath).replace(/\\/g, "/");
}

let violations = 0;

const domainsDir = join(ROOT, "server/domains-v2");
const domainGraph = {};

if (existsSync(domainsDir)) {
  const domainDirs = readdirSync(domainsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !["node_modules", ".git"].includes(d.name))
    .map(d => d.name);

  for (const domain of domainDirs) {
    const domainPath = join(domainsDir, domain);
    const files = walk(domainPath);
    const deps = new Set();

    for (const fp of files) {
      if (!/\.(ts|tsx|js|mjs)$/.test(fp)) continue;
      let content;
      try { content = readFileSync(fp, "utf-8"); } catch { continue; }

      const imports = extractImports(content);
      const rel = relative(ROOT, fp).replace(/\\/g, "/");

      for (const imp of imports) {
        if (!imp.startsWith(".")) continue;

        const resolved = resolveRelativeImport(imp, rel);
        if (!resolved) continue;

        const otherDomainMatch = resolved.match(/server\/domains-v2\/([^/]+)\//);
        if (!otherDomainMatch) continue;

        const otherDomain = otherDomainMatch[1];
        if (otherDomain === domain) continue;

        deps.add(otherDomain);

        const importedFileName = imp.split("/").pop().replace(/\.(ts|tsx|js|mjs)$/, "");
        const importPathParts = imp.split("/");

        const isInternalDir = importPathParts.some(part => FORBIDDEN_CROSS_DOMAIN_DIRS.includes(part));
        if (isInternalDir) {
          console.error(`ARCH_IMPORT_VIOLATION: ${rel} imports internal of ${otherDomain}: ${imp}`);
          violations++;
          continue;
        }

        const isForbiddenFile = FORBIDDEN_CROSS_DOMAIN_FILES.some(f => importedFileName === f);
        if (isForbiddenFile) {
          console.error(`ARCH_IMPORT_VIOLATION: ${rel} imports forbidden module ${importedFileName} from ${otherDomain}: ${imp}`);
          violations++;
        }
      }
    }
    domainGraph[domain] = deps;
  }

  function findCycles(graph) {
    const visited = new Set();
    const inStack = new Set();
    const cycles = [];

    function dfs(node, path) {
      visited.add(node);
      inStack.add(node);
      path.push(node);

      const neighbors = graph[node] || new Set();
      for (const neighbor of neighbors) {
        if (inStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart).concat(neighbor));
        } else if (!visited.has(neighbor) && graph[neighbor]) {
          dfs(neighbor, path);
        }
      }

      path.pop();
      inStack.delete(node);
    }

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    return cycles;
  }

  const cycles = findCycles(domainGraph);
  for (const cycle of cycles) {
    console.error(`ARCH_CYCLE_VIOLATION: circular dependency: ${cycle.join(" -> ")}`);
    violations++;
  }
}

const featuresDir = join(ROOT, "client/src/features-v2");
if (existsSync(featuresDir)) {
  const featureDirs = readdirSync(featuresDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== "shared-ui" && !["node_modules", ".git"].includes(d.name))
    .map(d => d.name);

  for (const feature of featureDirs) {
    const featurePath = join(featuresDir, feature);
    const files = walk(featurePath);

    for (const fp of files) {
      if (!/\.(ts|tsx|js|mjs)$/.test(fp)) continue;
      let content;
      try { content = readFileSync(fp, "utf-8"); } catch { continue; }

      const imports = extractImports(content);
      const rel = relative(ROOT, fp).replace(/\\/g, "/");

      for (const imp of imports) {
        if (!imp.startsWith(".")) continue;
        const resolved = resolveRelativeImport(imp, rel);
        if (!resolved) continue;

        const otherFeatureMatch = resolved.match(/client\/src\/features-v2\/([^/]+)\//);
        if (!otherFeatureMatch) continue;
        const otherFeature = otherFeatureMatch[1];
        if (otherFeature === feature || otherFeature === "shared-ui") continue;

        console.error(`FEATURE_ISOLATION_VIOLATION: ${rel} imports internals of feature ${otherFeature}: ${imp}`);
        violations++;
      }
    }
  }
}

const sharedUiDir = join(ROOT, "client/src/features-v2/shared-ui");
if (existsSync(sharedUiDir)) {
  const sharedFiles = walk(sharedUiDir);
  const productDomains = ["identity", "social", "communities-v2", "content-v2", "channels", "chat", "events", "modules", "media", "public-hub"];

  for (const fp of sharedFiles) {
    if (!/\.(ts|tsx|js|mjs)$/.test(fp)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }

    const imports = extractImports(content);
    const rel = relative(ROOT, fp).replace(/\\/g, "/");

    for (const imp of imports) {
      for (const domain of productDomains) {
        if (imp.includes(`/features-v2/${domain}/`) || imp.includes(`/domains-v2/${domain}/`)) {
          console.error(`SHARED_UI_VIOLATION: ${rel} imports product domain ${domain}: ${imp}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-architecture-import-graph: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_ARCHITECTURE_IMPORT_GRAPH_PASS");
