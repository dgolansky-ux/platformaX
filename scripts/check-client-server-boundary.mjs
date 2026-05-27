/**
 * Guard: production + test client code must not import server runtime.
 *
 * Rule: PX-APP-001 / split-ready. The frontend (`client/src/**`) must remain
 * bundleable as a standalone artifact. It may import `@shared/*` but never
 * `@server/*`, a relative path into `server/`, or a bare `server/...` specifier.
 * Cross-boundary types live in `shared/contracts`.
 *
 * Preference is ZERO `@server` anywhere under client/src, including tests.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = join(ROOT, "client/src");

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function extractImportSpecifiers(content) {
  const specs = [];
  const patterns = [
    /(?:import|export)\s+[^"';]*?\s+from\s+["']([^"']+)["']/g,
    /(?:import|export)\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) specs.push(m[1]);
  }
  return specs;
}

function isServerImport(spec) {
  if (spec === "@server" || spec.startsWith("@server/")) return true;
  if (spec === "server" || spec.startsWith("server/")) return true;
  // Relative path that climbs into a `server/` directory.
  if (spec.startsWith(".") && /(^|\/)server\//.test(spec)) return true;
  if (/(^|\/)\.\.\/server(\/|$)/.test(spec)) return true;
  return false;
}

let violations = 0;
for (const fp of walk(CLIENT_DIR)) {
  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  for (const spec of extractImportSpecifiers(content)) {
    if (isServerImport(spec)) {
      console.error(
        `CLIENT_SERVER_BOUNDARY_VIOLATION: ${rel} imports server runtime "${spec}" — use @shared/contracts instead`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-client-server-boundary: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_CLIENT_SERVER_BOUNDARY_PASS");
