#!/usr/bin/env node
/**
 * scripts/check-read-model-owner.mjs
 *
 * Rule: PX-READMODEL-001 — every read-model / projection table has
 * exactly one owning domain.
 *
 * Heuristic: a "read-model owner declaration" lives in a domain
 * `README.md` (or `read-models.md`) under a heading
 * `## Read models` / `## Projections`. The guard scans those files,
 * extracts the projection identifiers (lines starting with `- ` after
 * the heading), and asserts each identifier appears in at most one
 * domain.
 *
 * If no domain declares a projection, the guard passes trivially —
 * the rule cannot bite until projections exist.
 *
 * Ack: a `<!-- PX-READMODEL-001-ACK: <reason> -->` HTML comment in a
 * second domain's README explicitly allows the same projection to be
 * listed there as a SUBSCRIBER (not an owner). The first domain
 * listing the projection is treated as the owner.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");
const ACK_RE = /PX-READMODEL-001-ACK:\s*([^\n>-]+)/;

function toPosix(p) { return p.split(sep).join("/"); }

function listReadmes() {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  for (const e of readdirSync(DOMAINS_ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    for (const name of ["README.md", "read-models.md"]) {
      const fp = join(DOMAINS_ROOT, e.name, name);
      if (existsSync(fp)) out.push({ domain: e.name, file: fp });
    }
  }
  return out;
}

function extractProjections(content) {
  const out = [];
  const sections = content.split(/^##\s+/gm);
  for (const section of sections) {
    if (!/^Read models|^Projections/i.test(section)) continue;
    const lines = section.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*-\s+`([^`]+)`/);
      if (m) out.push(m[1]);
    }
  }
  return out;
}

const claims = new Map(); // projection -> [{ domain, file, acked }]
for (const { domain, file } of listReadmes()) {
  const content = readFileSync(file, "utf-8");
  const ack = ACK_RE.exec(content);
  const acked = ack ? ack[1].trim() : null;
  for (const proj of extractProjections(content)) {
    const arr = claims.get(proj) || [];
    arr.push({ domain, file: toPosix(relative(ROOT, file)), acked });
    claims.set(proj, arr);
  }
}

let violations = 0;
for (const [proj, list] of claims) {
  if (list.length <= 1) continue;
  const owner = list[0];
  const extras = list.slice(1);
  for (const extra of extras) {
    if (extra.acked) {
      console.error(`READ_MODEL_OWNER_ACK: projection "${proj}" listed in ${extra.file} as subscriber; owner is ${owner.domain} (${owner.file}). PX-READMODEL-001-ACK: ${extra.acked}`);
      continue;
    }
    console.error(`READ_MODEL_OWNER_VIOLATION: projection "${proj}" listed by ${extra.domain} (${extra.file}) without subscriber ack; owner is ${owner.domain} (${owner.file})`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-read-model-owner: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_READ_MODEL_OWNER_PASS");
