#!/usr/bin/env node
/**
 * scripts/check-branded-id-types.mjs
 *
 * Rule: PX-ID-001 — domain boundaries should use branded ID types
 * (UserId, MediaAssetId, ...) instead of raw `string` IDs.
 *
 * NARROW (Slice 25): the guard does NOT yet attempt structural type
 * inference. It only enforces the following claim on every
 * `server/domains-v2/<domain>/public-api.ts` file:
 *
 *   If the file declares ID-typed parameters or properties using the
 *   exact pattern `<name>Id: string` or `<name>Id?: string`, the file
 *   MUST import branded id helpers from
 *   `@shared/contracts/branded-ids` OR carry a file-level
 *   `// PX-ID-001-ACK: <reason>` marker.
 *
 * Rationale: existing pre-runtime code has not migrated yet. The ACK
 * marker documents the deferred wiring per file. Files added AFTER
 * Slice 25 should add the import (the cheaper option) instead of an
 * ACK; the ACK escape is intentionally annotated by the guard so a
 * reviewer can see how many remain.
 *
 * Failure mode: exits 1 with `BRANDED_ID_VIOLATION:` lines.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");
const ACK_MARKER = /PX-ID-001-ACK:\s*([^\n*]+)/;
const RAW_ID_RE = /\b([a-z][A-Za-z0-9]*Id)(\?)?:\s*string\b/g;
const BRANDED_IMPORT_RE = /from\s+["'](?:@shared|\.\.\/+|\.\/)[^"']*branded-ids["']/;

function toPosix(p) { return p.split(sep).join("/"); }

function listPublicApiFiles() {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "public-api.ts") out.push(full);
    }
  }
  walk(DOMAINS_ROOT);
  return out;
}

let violations = 0;
let acked = 0;
let files = 0;

for (const file of listPublicApiFiles()) {
  files += 1;
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  RAW_ID_RE.lastIndex = 0;
  const matches = [];
  let m;
  while ((m = RAW_ID_RE.exec(content)) !== null) matches.push(m[1]);
  if (matches.length === 0) continue;

  const hasBranded = BRANDED_IMPORT_RE.test(content);
  if (hasBranded) continue;

  const ack = ACK_MARKER.exec(content);
  if (ack) {
    console.error(`BRANDED_ID_ACK: ${rel} — raw string IDs (${[...new Set(matches)].join(", ")}) — PX-ID-001-ACK: ${ack[1].trim()}`);
    acked += 1;
    continue;
  }
  console.error(`BRANDED_ID_VIOLATION: ${rel} — raw string IDs (${[...new Set(matches)].join(", ")}) without branded-ids import and without PX-ID-001-ACK marker`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-branded-id-types: ${violations} violation(s) found across ${files} public-api file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_BRANDED_ID_TYPES_PASS (${files} public-api file(s) scanned, ${acked} ACKed)`);
