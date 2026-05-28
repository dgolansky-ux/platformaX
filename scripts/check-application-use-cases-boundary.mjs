// PX-APP-001 — application/use-cases boundary
//
// Rules:
//  1. client/src must not import server runtime (server/domains-v2 or server/application-v2).
//  2. Files outside server/application-v2 must not import the public-api of 2+ domains
//     (those flows belong in server/application-v2/use-cases).
//  3. Exceptions: tests (__tests__), scripts/, governance/, scaffold-* — they may
//     reference multiple domains for inventory or scaffolding purposes.

import { readFileSync } from "node:fs";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const ROOT = process.cwd();

function listFiles() {
  return listSourceFiles({
    cwd: ROOT,
    roots: ["."],
    extensions: [".ts", ".tsx", ".mjs"],
  });
}

const violations = [];

const DOMAIN_PUBLIC_API_IMPORT_RE = /from\s+["']([^"']+)["']/g;

// Matches server/domains-v2/<name>/public-api  (relative or @server)
const DOMAIN_RE = /server\/domains-v2\/([\w-]+)\/public-api/;

function isTestPath(file) {
  return /__tests__\//.test(file) || /\.test\.(ts|tsx)$/.test(file);
}

function isGovernanceOrScript(file) {
  return (
    file.startsWith("scripts/") ||
    file.startsWith("docs/") ||
    /\/scaffold-/.test(file)
  );
}

function isClientFile(file) {
  return file.startsWith("client/src/");
}

function isApplicationV2(file) {
  return file.startsWith("server/application-v2/");
}

function isSameDomainPublicApi(file, domain) {
  // A domain file can re-export from its own public-api.
  return new RegExp(`server/domains-v2/${domain}/`).test(file);
}

for (const file of listFiles()) {
  // skip declaration / type-only headers and registries
  if (file.endsWith(".d.ts")) continue;
  let src;
  try {
    src = readFileSync(file, "utf-8");
  } catch {
    continue;
  }

  // Rule 1 — client/src must not import @server/* or server/...
  if (isClientFile(file) && !isTestPath(file)) {
    const re = /from\s+["'](@server\/[^"']+|(?:\.\.\/){1,}server\/[^"']+)["']/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      violations.push(`${file}: client imports server runtime "${m[1]}"`);
    }
  }

  // Rule 2 — files outside application-v2 must not import public-api of 2+ domains
  if (!isApplicationV2(file) && !isTestPath(file) && !isGovernanceOrScript(file)) {
    const domains = new Set();
    const re = new RegExp(DOMAIN_PUBLIC_API_IMPORT_RE.source, "g");
    let m;
    while ((m = re.exec(src)) !== null) {
      const spec = m[1];
      const dm = spec.match(DOMAIN_RE);
      if (!dm) continue;
      const domain = dm[1];
      if (isSameDomainPublicApi(file, domain)) continue;
      domains.add(domain);
    }
    if (domains.size >= 2) {
      violations.push(
        `${file}: imports public-api of ${domains.size} domains (${[...domains].join(", ")}) — orchestration must live in server/application-v2/use-cases`,
      );
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`APPLICATION_USE_CASES_BOUNDARY_VIOLATION: ${v}`);
  console.error(`\ncheck-application-use-cases-boundary: ${violations.length} violation(s)`);
  process.exit(1);
}

console.log("CHECK_APPLICATION_USE_CASES_BOUNDARY_PASS");
