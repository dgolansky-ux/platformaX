#!/usr/bin/env node
/**
 * scripts/check-visibility-matrix.mjs
 *
 * Rule: PX-VIS-001 — runtime profile / content / media visibility must
 * live in `policy.ts`, not in routers or ad-hoc UI code.
 *
 * Narrow heuristic:
 *
 *   - For each `server/domains-v2/<domain>/policy.ts` that exports
 *     non-trivial logic (size > 250 bytes), require at least one
 *     exported predicate matching `^(can|may|is)[A-Z]\w+` (e.g.
 *     `canReadPublicProfile`, `canEdit`, `isVisibleTo`). A
 *     `// PX-VIS-001-ACK: <reason>` marker logs and passes.
 *
 *   - For each `server/domains-v2/<domain>/router.ts` (if present),
 *     forbid raw viewer-string comparisons like
 *     `if (viewer === "stranger")` or `viewerRole == "friend"` —
 *     routers must call `policy.ts` instead.
 *
 * Failure mode: exits 1, prints `VISIBILITY_MATRIX_VIOLATION:` per
 * finding.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");

const ACK_MARKER = /PX-VIS-001-ACK:\s*([^\n*]+)/;
const PREDICATE_RE =
  /^export\s+(?:async\s+)?function\s+(can|may|is|visible|select|allow|filter)[A-Z][A-Za-z0-9_$]*/m;
const ROUTER_VIEWER_CHECK_RE =
  /\bif\s*\(\s*viewer(?:Role|Context|UserId)?\s*[=!]==?\s*["'](owner|friend|stranger|anonymous|admin)["']/;

function toPosix(p) { return p.split(sep).join("/"); }

function listDomainFiles(name) {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  for (const e of readdirSync(DOMAINS_ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const fp = join(DOMAINS_ROOT, e.name, name);
    if (existsSync(fp)) out.push(fp);
  }
  return out;
}

let violations = 0;

for (const file of listDomainFiles("policy.ts")) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  if (content.length < 250) continue; // placeholder; skip
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;
  const ok = PREDICATE_RE.test(content);
  if (ok) continue;
  if (acked) {
    console.error(`VISIBILITY_MATRIX_ACK: ${rel} — no can/may/is* predicate; PX-VIS-001-ACK: ${acked}`);
    continue;
  }
  console.error(`VISIBILITY_MATRIX_VIOLATION: ${rel} — non-trivial policy.ts without an exported can*/may*/is* predicate`);
  violations += 1;
}

for (const file of listDomainFiles("router.ts")) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  if (ROUTER_VIEWER_CHECK_RE.test(content)) {
    console.error(`VISIBILITY_MATRIX_VIOLATION: ${rel} — raw viewer-string comparison in router.ts; move to policy.ts`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-visibility-matrix: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_VISIBILITY_MATRIX_PASS");
