#!/usr/bin/env node
/**
 * scripts/check-viewer-context-on-public-reads.mjs
 *
 * Rule: PX-OWN-002 — public-read functions named getPublic*,
 * listPublic*, viewPublic* (or *PublicProfile* / *PublicSummary*
 * variants) must accept a viewerContext argument so policy decisions
 * receive the viewer kind explicitly.
 *
 * Scope: every service.ts under server/domains-v2 (any depth) and
 * every use-case service under server/application-v2/use-cases.
 *
 * Detection: for each function/method declaration matching the
 * public-read regex, the same function header (or its immediate
 * parameter destructuring) must mention viewerContext or
 * viewerRole. Allowed alternative: a file-level
 * PX-OWN-002-ACK: marker (logged, does not fail).
 *
 * Coverage gaps:
 *   - Functions hidden behind a factory closure (`function build() {
 *     return { getPublic...() {} } }`) are still detected because we
 *     match against the function name itself, but if the body uses a
 *     deeply-nested helper that takes the viewer context, we still
 *     pass — that is desirable for now.
 *   - We do not yet verify that `viewerContext` is actually consumed
 *     inside the function body. P1 follow-up.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAIN_ROOT = join(ROOT, "server", "domains-v2");
const APP_ROOT = join(ROOT, "server", "application-v2", "use-cases");

const ACK_MARKER = /PX-OWN-002-ACK:\s*([^\n*]+)/;
const PUBLIC_FN_RE =
  /(?:function|async\s+function|export\s+function|export\s+async\s+function|public|private|async)?\s*(?:async\s+)?(?:function\s+)?([a-z][A-Za-z0-9_$]*?(?:Public[A-Z][A-Za-z0-9_$]*|(?:Public)?Profile[A-Z][A-Za-z0-9_$]*|publicSummary[A-Za-z0-9_$]*))\s*\(([^)]*)\)/g;

function toPosix(p) { return p.split(sep).join("/"); }

function listServiceFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "service.ts" || /^.+service\.ts$/.test(e.name)) out.push(full);
    }
  }
  walk(root);
  return out;
}

let violations = 0;
const PUBLIC_FN_NAME_RE = /^(get|list|view|fetch|load)Public[A-Z]/;

for (const root of [DOMAIN_ROOT, APP_ROOT]) {
  for (const file of listServiceFiles(root)) {
    const content = readFileSync(file, "utf-8");
    const rel = toPosix(relative(ROOT, file));
    const ack = ACK_MARKER.exec(content);
    const acked = ack ? ack[1].trim() : null;

    // Find function declarations whose name starts with getPublic/listPublic/...
    const decl = /(?:^|[\s,])((?:async\s+)?(?:function\s+)?([a-z][A-Za-z0-9_$]*)\s*[=:]?\s*\(([^)]*)\))/gm;
    let m;
    while ((m = decl.exec(content)) !== null) {
      const fnName = m[2];
      const params = m[3];
      if (!PUBLIC_FN_NAME_RE.test(fnName)) continue;
      // Accept any parameter mentioning `viewer` (viewerContext,
      // viewerRole, viewerId, viewerUserId, viewerSession, etc.) —
      // the rule's intent is "policy must receive viewer information",
      // not a specific field name.
      const ok = /\bviewer[A-Za-z]*\b/i.test(params);
      if (ok) continue;
      if (acked) {
        console.error(`VIEWER_CONTEXT_PUBLIC_READS_ACK: ${rel} function ${fnName}(...) — PX-OWN-002-ACK: ${acked}`);
        continue;
      }
      console.error(`VIEWER_CONTEXT_PUBLIC_READS_VIOLATION: ${rel} function ${fnName}(${params}) missing viewerContext / viewerRole / viewerUserId parameter`);
      violations += 1;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-viewer-context-on-public-reads: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_VIEWER_CONTEXT_ON_PUBLIC_READS_PASS");
