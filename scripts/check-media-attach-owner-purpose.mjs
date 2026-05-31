#!/usr/bin/env node
/**
 * scripts/check-media-attach-owner-purpose.mjs
 *
 * Rule: PX-MEDIA-004 — media attach paths must validate the asset's
 * `ownerUserId` AND `purpose` before the attach succeeds.
 *
 * Scope: `server/domains-v2/media/**\/service.ts`,
 * `server/domains-v2/media/**\/repository.ts`,
 * `server/domains-v2/identity/**\/service.ts` (avatar/banner attach),
 * `server/domains-v2/identity/**\/workplaces/**\/service.ts`,
 * `server/application-v2/use-cases/media/service.ts`.
 *
 * For every function whose name starts with `attach` (or
 * `attachAvatar`, `attachBanner`, etc.), the body must mention BOTH
 * `ownerUserId` AND `purpose`. A file-level
 * `// PX-MEDIA-004-ACK: <reason>` marker logs and passes.
 *
 * Note: the existing `scripts/check-media-base64.mjs` covers the
 * separate "no base64 upload" half of PX-MEDIA-004; this guard covers
 * only the attach-validation half.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const ACK_MARKER = /PX-MEDIA-004-ACK:\s*([^\n*]+)/;
const TARGET_DIRS = [
  join(ROOT, "server", "domains-v2", "media"),
  join(ROOT, "server", "domains-v2", "identity"),
  join(ROOT, "server", "application-v2", "use-cases", "media"),
];

const ATTACH_FN_RE =
  /(?:^|[\s,;=({])(?:async\s+)?(?:function\s+)?(attach[A-Z][A-Za-z0-9_$]*)\s*[=:]?\s*\(([^)]*)\)\s*(?:[^{=]*=>|\{|:)/g;

function toPosix(p) { return p.split(sep).join("/"); }

function listFiles() {
  const out = [];
  for (const root of TARGET_DIRS) {
    if (!existsSync(root)) continue;
    function walk(d) {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name === "__tests__") continue;
        const full = join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/(service|repository)\.ts$/.test(e.name)) out.push(full);
      }
    }
    walk(root);
  }
  return out;
}

function balancedSlice(content, fromIndex) {
  const start = content.indexOf("{", fromIndex);
  if (start === -1) return "";
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") { depth -= 1; if (depth === 0) return content.slice(start, i + 1); }
  }
  return content.slice(start);
}

let violations = 0;
for (const file of listFiles()) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;
  ATTACH_FN_RE.lastIndex = 0;
  const seen = new Set();
  let m;
  while ((m = ATTACH_FN_RE.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const headEnd = ATTACH_FN_RE.lastIndex;
    const body = balancedSlice(content, headEnd);
    const hasOwner = /ownerUserId|ownerId|ownerType/.test(body);
    const hasPurpose = /\bpurpose\b/.test(body);
    if (hasOwner && hasPurpose) continue;
    if (acked) {
      console.error(`MEDIA_ATTACH_OWNER_PURPOSE_ACK: ${rel} fn ${name} — owner=${hasOwner} purpose=${hasPurpose}; PX-MEDIA-004-ACK: ${acked}`);
      continue;
    }
    console.error(`MEDIA_ATTACH_OWNER_PURPOSE_VIOLATION: ${rel} fn ${name} — owner=${hasOwner} purpose=${hasPurpose} (both required)`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-media-attach-owner-purpose: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_MEDIA_ATTACH_OWNER_PURPOSE_PASS");
