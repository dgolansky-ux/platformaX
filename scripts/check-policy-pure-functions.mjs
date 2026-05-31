#!/usr/bin/env node
/**
 * scripts/check-policy-pure-functions.mjs
 *
 * Rule: PX-POLICY-001 — `policy.ts` must contain pure functions only.
 *
 * Forbidden in any `server/domains-v2/<domain>/policy.ts`:
 *   - imports from `./repository`, `./service`, `./router`, `./mapper`,
 *     `./db/**`, `./adapters/**`,
 *   - imports from cross-domain public-api / repository / service /
 *     router (anything with one of those entry-point file names),
 *   - imports from `fs`, `node:fs`, `node:fs/promises`,
 *     `node:child_process`, `child_process`, `node:crypto`, `crypto`,
 *     `@supabase/supabase-js`, any `supabase` adapter,
 *   - imports that fetch the network (`undici`, `node:http(s)`,
 *     bare `axios`/`got`), or call `fetch(` at module scope,
 *   - direct calls to `Date.now()`, `Math.random()`,
 *     `crypto.randomUUID()` — these are non-deterministic and pull
 *     policy decisions outside the input-pure contract.
 *
 * Allowed (always):
 *   - imports of own-domain `contracts.ts`, `dto.ts`, `policy-*.ts`,
 *   - imports from `shared/contracts/**`, `shared/utils/**`.
 *
 * Ack escape hatch: a file-level `// PX-POLICY-001-ACK: <reason>`
 * marker registers a known deviation. The marker is logged but does
 * not fail. Slice 25+ will require the marker also be registered in
 * `EXCEPTIONS_REGISTER.md`.
 *
 * Failure mode: exits 1, prints `POLICY_PURE_FUNCTIONS_VIOLATION:` per
 * finding. Fails closed.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");

const ACK_MARKER = /PX-POLICY-001-ACK:\s*([^\n*]+)/;

function toPosix(p) { return p.split(sep).join("/"); }

function listPolicyFiles() {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "policy.ts" || /^policy[-.]/.test(e.name)) out.push(full);
    }
  }
  walk(DOMAINS_ROOT);
  return out;
}

const FORBIDDEN_IMPORT_REGEXES = [
  { re: /^\.\/repository(?:\.|$|\/)/,     reason: "imports own repository" },
  { re: /^\.\/service(?:\.|$|\/)/,        reason: "imports own service" },
  { re: /^\.\/router(?:\.|$|\/)/,         reason: "imports own router" },
  { re: /^\.\/mapper(?:\.|$|\/)/,         reason: "imports own mapper" },
  { re: /^\.\/db(\/|$)/,                  reason: "imports own db module" },
  { re: /^\.\/adapters(?:\/|$)/,          reason: "imports own adapter" },
  { re: /\/(repository|service|router|mapper)(?:\.|$)/, reason: "imports another module's runtime layer" },
  { re: /(^|\/)fs(\/|$)/,                 reason: "imports fs" },
  { re: /^node:fs/,                       reason: "imports node:fs" },
  { re: /^node:child_process/,            reason: "imports node:child_process" },
  { re: /^child_process$/,                reason: "imports child_process" },
  { re: /^node:crypto/,                   reason: "imports node:crypto" },
  { re: /^crypto$/,                       reason: "imports crypto" },
  { re: /^@supabase\//,                   reason: "imports supabase client" },
  { re: /(^|\/)supabase(\/|$)/,           reason: "imports supabase" },
  { re: /^undici$/,                       reason: "imports undici" },
  { re: /^node:https?$/,                  reason: "imports node:http(s)" },
  { re: /^axios$/,                        reason: "imports axios" },
  { re: /^got$/,                          reason: "imports got" },
];

const FORBIDDEN_CALLS = [
  { re: /\bDate\.now\s*\(/,            kind: "Date.now()" },
  { re: /\bMath\.random\s*\(/,         kind: "Math.random()" },
  { re: /\bcrypto\.randomUUID\s*\(/,   kind: "crypto.randomUUID()" },
  { re: /\bfetch\s*\(/,                kind: "fetch()" },
];

/**
 * Returns only RUNTIME imports. `import type { ... }` and
 * `import { type X }` (type-only) have no runtime impact and cannot
 * pull persistence into policy.ts at runtime, so they are skipped.
 */
function extractImports(content) {
  const out = [];
  const re = /^\s*(?:export\s+)?import\s+([^"';]*?)from\s+["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const clause = m[1];
    const target = m[2];
    if (/^\s*type\s+/.test(clause)) continue; // import type { ... } from "..."
    if (/^\s*type\b/.test(clause)) continue;  // import type X from "..."
    out.push(target);
  }
  return out;
}

let violations = 0;
const policyFiles = listPolicyFiles();

for (const file of policyFiles) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;

  let fileFindings = 0;
  for (const imp of extractImports(content)) {
    for (const { re, reason } of FORBIDDEN_IMPORT_REGEXES) {
      if (re.test(imp)) {
        if (acked) {
          console.error(`POLICY_PURE_FUNCTIONS_ACK: ${rel} — ${reason} (${imp}) — PX-POLICY-001-ACK: ${acked}`);
        } else {
          console.error(`POLICY_PURE_FUNCTIONS_VIOLATION: ${rel} — ${reason} (${imp})`);
          violations += 1;
          fileFindings += 1;
        }
        break;
      }
    }
  }

  for (const { re, kind } of FORBIDDEN_CALLS) {
    if (re.test(content)) {
      if (acked) {
        console.error(`POLICY_PURE_FUNCTIONS_ACK: ${rel} — non-deterministic call ${kind} — PX-POLICY-001-ACK: ${acked}`);
      } else {
        console.error(`POLICY_PURE_FUNCTIONS_VIOLATION: ${rel} — non-deterministic call ${kind}`);
        violations += 1;
        fileFindings += 1;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-policy-pure-functions: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_POLICY_PURE_FUNCTIONS_PASS");
