#!/usr/bin/env node
/**
 * scripts/check-backend-ownership-invariants.mjs
 *
 * Rule: PX-OWN-001 — every write/update/delete/attach in a domain
 * `service.ts` or `repository.ts` must perform an owner check before
 * the mutation. The guard rejects mutation calls that take only an
 * entity id and no `ownerUserId` / `ownerId` in the same lexical scope.
 *
 * Narrow heuristic — code-shape only:
 *
 *   For every function in `server/domains-v2/*\/service.ts` or
 *   `server/domains-v2/*\/repository.ts` whose name starts with
 *   `update`, `delete`, `remove`, `archive`, `attach`, `detach`,
 *   `transfer`, `revoke`:
 *
 *     - Inspect the function body. If it does NOT mention
 *       `ownerUserId`, `ownerId`, `ownerRole`, `assertOwner` or the
 *       string `owner` followed by `===` / `!=` / `match`, AND the
 *       file does NOT carry a `// PX-OWN-001-ACK: <reason>` marker,
 *       the function is flagged.
 *
 * Coverage gaps:
 *   - We do not chase imports. A function that delegates owner check
 *     to a helper imported from a sibling module must still mention
 *     `assertOwner(` or similar literal in its own body OR carry the
 *     ACK marker; this is by design — explicit > clever.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");
const ACK_MARKER = /PX-OWN-001-ACK:\s*([^\n*]+)/;

const MUTATION_RE =
  /(?:^|[\s,;=({])(?:async\s+)?(?:function\s+)?((?:update|delete|remove|archive|attach|detach|transfer|revoke|disable)[A-Z][A-Za-z0-9_$]*)\s*[=:]?\s*\(([^)]*)\)\s*(?:[^{=]*=>|\{|:)/g;

const OWNER_SIGNAL_RE =
  /\bowner(?:UserId|Id|Role)\b|assertOwner|requireOwner|verifyOwner|policy\.(?:can|may|is)|\bcanEdit\(|\bcanDelete\(|\bcanAttach\(|\bcanArchive\(|\bcanUpdate\(|\bcanRemove\(|\bisOwner\(|\bOwner\b|ownership|Authorize|requirePerm|hasPermission/;

function toPosix(p) { return p.split(sep).join("/"); }

function listMutationFiles() {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "service.ts" || e.name === "repository.ts" || /(service|repository)\.ts$/.test(e.name)) out.push(full);
    }
  }
  walk(DOMAINS_ROOT);
  return out;
}

function balancedSlice(content, fromIndex) {
  // Find the next "{" after fromIndex, then match braces.
  const start = content.indexOf("{", fromIndex);
  if (start === -1) return "";
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return content.slice(start);
}

let violations = 0;
for (const file of listMutationFiles()) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;
  MUTATION_RE.lastIndex = 0;
  const seen = new Set();
  let m;
  while ((m = MUTATION_RE.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const headEnd = MUTATION_RE.lastIndex;
    const body = balancedSlice(content, headEnd);
    if (OWNER_SIGNAL_RE.test(body)) continue;
    if (acked) {
      console.error(`BACKEND_OWNERSHIP_INVARIANTS_ACK: ${rel} fn ${name} — no owner signal in body; PX-OWN-001-ACK: ${acked}`);
      continue;
    }
    console.error(`BACKEND_OWNERSHIP_INVARIANTS_VIOLATION: ${rel} fn ${name} — body has no ownerUserId / ownerId / assertOwner / policy.canX signal`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-backend-ownership-invariants: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_BACKEND_OWNERSHIP_INVARIANTS_PASS");
