#!/usr/bin/env node
/**
 * scripts/check-features-v2-internal-import.mjs
 *
 * Rules: PX-ARCH-003 / PX-ARCH-004 (frontend feature boundary).
 *
 * app-v2 and any features-v2 feature MUST import other features-v2
 * features only via their public surface (`features-v2/<feature>` —
 * which resolves to the feature's `index.ts`). Reaching into deep
 * internals such as `features-v2/<feature>/data/...`,
 * `features-v2/<feature>/adapters/...`, or
 * `features-v2/<feature>/internal/...` bypasses the feature's
 * curated API and welds the consumer to internal structure.
 *
 * NARROW (Slice 25): the guard scans `client/src/app-v2/**` and
 * `client/src/features-v2/**` (cross-feature only). It rejects any
 * import whose target matches one of:
 *
 *   - `features-v2/<X>/data/...`
 *   - `features-v2/<X>/adapters/...`
 *   - `features-v2/<X>/internal/...`
 *
 * where `<X>` is a different feature than the importing file's own.
 * Same-feature deep imports are allowed because they stay inside the
 * feature's own boundary. ACK marker: `// PX-ARCH-004-ACK: <reason>`.
 *
 * Failure mode: exits 1 with `FEATURE_INTERNAL_IMPORT_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const APP_ROOT = join(ROOT, "client", "src", "app-v2");
const FEATURES_ROOT = join(ROOT, "client", "src", "features-v2");
const ACK_MARKER = /PX-ARCH-004-ACK:\s*([^\n*]+)/;

const INTERNAL_RE = /features-v2\/([a-z0-9-]+)\/(data|adapters|internal)\//;

function toPosix(p) { return p.split(sep).join("/"); }

function listFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(full);
    }
  }
  walk(root);
  return out;
}

function importingFeature(rel) {
  const m = /^client\/src\/features-v2\/([a-z0-9-]+)\//.exec(rel);
  return m ? m[1] : null;
}

function extractImports(content) {
  const out = [];
  const re = /^\s*(?:export\s+)?import\s+[^"';]*?from\s+["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(content)) !== null) out.push(m[1]);
  return out;
}

let violations = 0;
let acked = 0;
const files = [...listFiles(APP_ROOT), ...listFiles(FEATURES_ROOT)];

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ownFeature = importingFeature(rel);
  const ack = ACK_MARKER.exec(content);
  for (const imp of extractImports(content)) {
    const m = INTERNAL_RE.exec(imp);
    if (!m) continue;
    const targetFeature = m[1];
    if (ownFeature && ownFeature === targetFeature) continue;
    if (ack) {
      console.error(`FEATURE_INTERNAL_IMPORT_ACK: ${rel} — ${imp} (target=${targetFeature}/${m[2]}) — PX-ARCH-004-ACK: ${ack[1].trim()}`);
      acked += 1;
    } else {
      console.error(`FEATURE_INTERNAL_IMPORT_VIOLATION: ${rel} — imports cross-feature internal: ${imp} (use features-v2/${targetFeature} public surface instead)`);
      violations += 1;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-features-v2-internal-import: ${violations} violation(s) found across ${files.length} file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_FEATURES_V2_INTERNAL_IMPORT_PASS (${files.length} file(s) scanned, ${acked} ACKed)`);
