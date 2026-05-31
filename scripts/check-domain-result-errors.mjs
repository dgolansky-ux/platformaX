#!/usr/bin/env node
/**
 * scripts/check-domain-result-errors.mjs
 *
 * Rule: PX-ERROR-001 — domain public boundaries should return typed
 * Result / DomainError values instead of throwing raw `new Error(...)`
 * across the public surface.
 *
 * NARROW (Slice 25): the guard scans
 *   - server/domains-v2/<domain>/public-api.ts
 *   - server/domains-v2/<domain>/service.ts
 *   - server/application-v2/use-cases/<uc>/public-api.ts
 *   - server/application-v2/use-cases/<uc>/service.ts
 * for the literal pattern `throw new Error(`. If found and no
 * `// PX-ERROR-001-ACK: <reason>` marker is present in the file, the
 * file fails the guard.
 *
 * This does not enforce a specific Result shape — only that authors
 * pause before throwing across a public boundary. Internal helper
 * files (mapper.ts, policy.ts, repository.ts, etc.) are out of scope
 * for this narrow guard; they are covered by code review.
 *
 * Failure mode: exits 1 with `DOMAIN_RESULT_ERROR_VIOLATION:` lines.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const ROOTS = [
  join(ROOT, "server", "domains-v2"),
  join(ROOT, "server", "application-v2", "use-cases"),
];
const PUBLIC_BOUNDARY_FILES = new Set(["public-api.ts", "service.ts"]);
const ACK_MARKER = /PX-ERROR-001-ACK:\s*([^\n*]+)/;
const THROW_RE = /\bthrow\s+new\s+Error\s*\(/;

function toPosix(p) { return p.split(sep).join("/"); }

function listFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (PUBLIC_BOUNDARY_FILES.has(e.name)) out.push(full);
    }
  }
  walk(root);
  return out;
}

let violations = 0;
let acked = 0;
let files = 0;

for (const root of ROOTS) {
  for (const file of listFiles(root)) {
    files += 1;
    const content = readFileSync(file, "utf-8");
    const rel = toPosix(relative(ROOT, file));
    if (!THROW_RE.test(content)) continue;
    const ack = ACK_MARKER.exec(content);
    if (ack) {
      console.error(`DOMAIN_RESULT_ERROR_ACK: ${rel} — throw new Error(...) — PX-ERROR-001-ACK: ${ack[1].trim()}`);
      acked += 1;
      continue;
    }
    console.error(`DOMAIN_RESULT_ERROR_VIOLATION: ${rel} — throws new Error(...) across public boundary without PX-ERROR-001-ACK marker`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-domain-result-errors: ${violations} violation(s) found across ${files} boundary file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_DOMAIN_RESULT_ERRORS_PASS (${files} boundary file(s) scanned, ${acked} ACKed)`);
