import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, dirname, resolve, posix } from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "client/src/app-v2",
  "client/src/features-v2",
  "server/domains-v2",
  "shared",
];

const BLOCKED_IMPORTS = [
  "client/src/features/",
  "client/src/pages/",
  "client/src/components/",
  "server/domains/",
  "legacy/",
  "legacy-source/",
  "old-code/",
  "Starykod/",
];

const BLOCKED_RELATIVE_KEYWORDS = [
  "/features/",
  "/pages/",
  "/components/",
  "/domains/",
  "/legacy/",
  "/legacy-source/",
  "/old-code/",
  "/Starykod/",
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

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = join(ROOT, scanDir);
  const files = walk(absDir);
  for (const fp of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(fp)) continue;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch { continue; }
    const rel = relative(ROOT, fp).replace(/\\/g, "/");
    const importPaths = extractImportPaths(content);

    for (const imp of importPaths) {
      for (const blocked of BLOCKED_IMPORTS) {
        if (imp.includes(blocked)) {
          console.error(`LEGACY_IMPORT_VIOLATION: "${blocked}" imported in ${rel}`);
          violations++;
        }
      }

      if (imp.startsWith(".")) {
        const resolved = resolveRelativeImport(rel, imp);
        if (resolved) {
          for (const blocked of BLOCKED_IMPORTS) {
            if (resolved.startsWith(blocked) || resolved.includes("/" + blocked)) {
              console.error(`LEGACY_IMPORT_VIOLATION: relative import resolves to "${blocked}" in ${rel} (import: "${imp}")`);
              violations++;
            }
          }
          for (const keyword of BLOCKED_RELATIVE_KEYWORDS) {
            if (("/" + resolved).includes(keyword)) {
              console.error(`LEGACY_IMPORT_VIOLATION: relative import contains legacy path "${keyword}" in ${rel} (import: "${imp}")`);
              violations++;
            }
          }
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-no-legacy-imports: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_NO_LEGACY_IMPORTS_PASS");
