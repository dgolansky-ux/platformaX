/**
 * Guard: presentational `sections/` must not own data.
 *
 * Rule: PX-UI-002 (presentational/container split). Components under a profile
 * `sections/` directory are props-only/presentational. They must NOT import data
 * hooks, feature adapters, or the data layer. Data lives in `data/`; components
 * that own data live in `containers/`.
 *
 * Forbidden inside `sections/`:
 *  - imports from `../data` / `./data`
 *  - imports from `features-v2` (feature adapters)
 *  - imports of `*-adapter`
 *  - references to data hooks: useProfileData / useProfileBioEdit / useProfileMediaUpload
 *
 * Type-only imports of shell view types (`../types`) are allowed.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const CLIENT_DIR = join(ROOT, "client/src");

const DATA_HOOK_NAMES = [
  "useProfileData",
  "useProfileBioEdit",
  "useProfileMediaUpload",
];

function walk(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
      results.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function isInSectionsDir(rel) {
  return /(^|\/)sections\//.test(rel);
}

function extractImportSpecifiers(content) {
  const specs = [];
  const re = /(?:import|export)\s+[^"';]*?\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) specs.push(m[1]);
  return specs;
}

let violations = 0;

for (const fp of walk(CLIENT_DIR)) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  if (!isInSectionsDir(rel)) continue;

  let content;
  try { content = readFileSync(fp, "utf-8"); } catch { continue; }

  for (const spec of extractImportSpecifiers(content)) {
    if (/(^|\/)data(\/|$)/.test(spec) || spec.endsWith("/data")) {
      console.error(`PRESENTATIONAL_BOUNDARY_VIOLATION: ${rel} imports the data layer ("${spec}") — move it to containers/`);
      violations++;
    }
    if (/features-v2/.test(spec) && !spec.includes("shared-ui")) {
      console.error(`PRESENTATIONAL_BOUNDARY_VIOLATION: ${rel} imports a feature adapter ("${spec}") — presentational sections take props only`);
      violations++;
    }
    if (/-adapter(\/|$)?/.test(spec)) {
      console.error(`PRESENTATIONAL_BOUNDARY_VIOLATION: ${rel} imports an adapter ("${spec}") — presentational sections take props only`);
      violations++;
    }
  }

  for (const hook of DATA_HOOK_NAMES) {
    // Match a call expression (e.g. `useProfileData(`) — not a mention in a
    // comment/docstring — so presentational sections that merely reference a
    // hook name in prose are not flagged.
    const re = new RegExp(`\\b${hook}\\s*\\(`);
    if (re.test(content)) {
      console.error(`PRESENTATIONAL_BOUNDARY_VIOLATION: ${rel} calls data hook "${hook}" — move it to containers/`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-presentational-container-boundary: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_PRESENTATIONAL_CONTAINER_BOUNDARY_PASS");
