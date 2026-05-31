#!/usr/bin/env node
/**
 * scripts/check-resource-context-refs.mjs
 *
 * Rule: PX-CTX-001 — content / feed / media / milestone resources
 * MUST declare an explicit context (`contextType`, `contextOwnerId`,
 * `contextRefId`) in their contract / DTO definitions. Without these,
 * a resource cannot be tied back to where it lives in the social
 * graph, which leaks ownership across visibility surfaces.
 *
 * NARROW (Slice 25): the guard scans
 * `server/domains-v2/content-v2/**\/contracts.ts` and
 * `server/domains-v2/content-v2/**\/dto.ts`. Each file MUST contain
 * the token `contextType` somewhere in its body OR carry a file-
 * level `// PX-CTX-001-ACK: <reason>` marker.
 *
 * The token check is a structural heuristic, not an AST validation
 * of the actual property declaration. Manual review continues to
 * verify that `contextOwnerId` and `contextRefId` are also present
 * on every resource type.
 *
 * Failure mode: exits 1 with `RESOURCE_CONTEXT_REFS_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT_ROOT = join(ROOT, "server", "domains-v2", "content-v2");
const ACK_MARKER = /PX-CTX-001-ACK:\s*([^\n*]+)/;
const TOKEN_RE = /\bcontextType\b/;

function toPosix(p) { return p.split(sep).join("/"); }

function listContractFiles() {
  const out = [];
  if (!existsSync(CONTENT_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "contracts.ts" || e.name === "dto.ts") out.push(full);
    }
  }
  walk(CONTENT_ROOT);
  return out;
}

let violations = 0;
let acked = 0;
let ok = 0;
const files = listContractFiles();

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  if (TOKEN_RE.test(content)) { ok += 1; continue; }
  const ack = ACK_MARKER.exec(content);
  if (ack) {
    console.error(`RESOURCE_CONTEXT_REFS_ACK: ${rel} — no contextType token in file — PX-CTX-001-ACK: ${ack[1].trim()}`);
    acked += 1;
    continue;
  }
  console.error(`RESOURCE_CONTEXT_REFS_VIOLATION: ${rel} — content-v2 contract/DTO does not declare contextType and carries no PX-CTX-001-ACK marker`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-resource-context-refs: ${violations} violation(s) found across ${files.length} contract file(s); ${ok} green, ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_RESOURCE_CONTEXT_REFS_PASS (${files.length} content-v2 contract file(s) scanned; ${ok} green, ${acked} ACKed)`);
