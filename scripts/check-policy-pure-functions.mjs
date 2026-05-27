/**
 * Guard: domain policies are pure functions.
 *
 * Rule: PX-POLICY-001 (ADR-014). Every `policy.ts` under server/domains-v2 must
 * contain only pure decision functions (canView/canEdit/canAttach/canDelete). They
 * must not import persistence/transport (repository/service/router/db/supabase/
 * client) and must not perform IO or non-determinism (fetch, storage, Date.now,
 * new Date, Math.random, process.env). Only types/DTO/shared contracts may be
 * imported.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DOMAINS_DIR = join(ROOT, "server/domains-v2");

const FORBIDDEN_IMPORT_TOKENS = [
  "repository",
  "service",
  "router",
  "supabase",
  "cache-keys",
  "/db",
];

const FORBIDDEN_RUNTIME = [
  { re: /\bfetch\s*\(/, label: "fetch()" },
  { re: /\bDate\.now\s*\(/, label: "Date.now()" },
  { re: /\bnew\s+Date\s*\(/, label: "new Date()" },
  { re: /\bMath\.random\s*\(/, label: "Math.random()" },
  { re: /\bprocess\.env\b/, label: "process.env" },
  { re: /\blocalStorage\b/, label: "localStorage" },
  { re: /\bsessionStorage\b/, label: "sessionStorage" },
  { re: /\bcreateClient\s*\(/, label: "createClient()" },
];

function findPolicyFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "__tests__"].includes(entry.name)) continue;
      out.push(...findPolicyFiles(full));
    } else if (entry.name === "policy.ts") {
      out.push(full);
    }
  }
  return out;
}

function importSpecifiers(content) {
  const specs = [];
  const re = /(?:import|export)\s+[^"';]*?\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) specs.push(m[1]);
  return specs;
}

/** Strip line + block comments so prose mentions are not matched. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

let violations = 0;
const policyFiles = findPolicyFiles(DOMAINS_DIR);

for (const fp of policyFiles) {
  const rel = relative(ROOT, fp).replace(/\\/g, "/");
  const raw = readFileSync(fp, "utf-8");
  const code = stripComments(raw);

  for (const spec of importSpecifiers(raw)) {
    // type-only imports are still subject to the ban — a policy must not even
    // reference a repository/service module at the boundary.
    for (const token of FORBIDDEN_IMPORT_TOKENS) {
      if (spec.includes(token)) {
        console.error(`POLICY_PURITY_VIOLATION: ${rel} imports non-pure module "${spec}" (matched "${token}")`);
        violations++;
      }
    }
  }

  for (const { re, label } of FORBIDDEN_RUNTIME) {
    if (re.test(code)) {
      console.error(`POLICY_PURITY_VIOLATION: ${rel} performs IO/non-deterministic "${label}" — policies must be pure`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-policy-pure-functions: ${violations} violation(s)`);
  process.exit(1);
}

console.log(`CHECK_POLICY_PURE_FUNCTIONS_PASS (${policyFiles.length} policy files validated)`);
