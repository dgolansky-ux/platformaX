#!/usr/bin/env node
/**
 * scripts/check-public-hub-source-of-truth.mjs
 *
 * Rule: the public-hub COMPOSITION_DOMAIN composes a read-only hub
 * view from already-public summaries. It MUST NOT own its own data,
 * read raw rows from another domain's repository, or import another
 * domain's writable repository / service module.
 *
 * NARROW (Slice 25): the guard scans every file under
 * `server/domains-v2/public-hub/**` (excluding `__tests__`). It
 * forbids imports whose specifier matches any of:
 *
 *   - any path ending in `/repository` or `/repository.ts`
 *   - any path containing `/db/`
 *   - any path containing `/adapters/` (transport adapters)
 *   - `@supabase/supabase-js` (no direct supabase client here)
 *   - other domain `service.ts` / `public-api.ts` imports that pull
 *     in mutator-shaped names (heuristic: skipped here — manual
 *     review keeps that check for now)
 *
 * The composition pattern allows public-hub to consume resolver
 * interfaces declared in its own `contracts.ts` only. Implementations
 * of those resolvers live in the calling owner-domain, not inside
 * public-hub itself.
 *
 * ACK marker: `// PX-HUB-001-ACK: <reason>`.
 *
 * Failure mode: exits 1 with `PUBLIC_HUB_SOURCE_OF_TRUTH_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const HUB_ROOT = join(ROOT, "server", "domains-v2", "public-hub");
const ACK_MARKER = /PX-HUB-001-ACK:\s*([^\n*]+)/;

const FORBIDDEN_IMPORTS = [
  { re: /\/repository(?:\.ts)?$/,    reason: "imports repository module" },
  { re: /\/db\//,                    reason: "imports db module" },
  { re: /\/adapters\//,              reason: "imports transport adapter" },
  { re: /^@supabase\//,              reason: "imports supabase client" },
];

function toPosix(p) { return p.split(sep).join("/"); }

function listHubFiles() {
  const out = [];
  if (!existsSync(HUB_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".ts")) out.push(full);
    }
  }
  walk(HUB_ROOT);
  return out;
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
const files = listHubFiles();

if (files.length === 0) {
  console.log("CHECK_PUBLIC_HUB_SOURCE_OF_TRUTH_PASS (0 public-hub files; trivially clean)");
  process.exit(0);
}

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  for (const imp of extractImports(content)) {
    for (const { re, reason } of FORBIDDEN_IMPORTS) {
      if (re.test(imp)) {
        if (ack) {
          console.error(`PUBLIC_HUB_SOURCE_OF_TRUTH_ACK: ${rel} — ${reason} (${imp}) — PX-HUB-001-ACK: ${ack[1].trim()}`);
          acked += 1;
        } else {
          console.error(`PUBLIC_HUB_SOURCE_OF_TRUTH_VIOLATION: ${rel} — ${reason} (${imp})`);
          violations += 1;
        }
        break;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-public-hub-source-of-truth: ${violations} violation(s) found across ${files.length} public-hub file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_PUBLIC_HUB_SOURCE_OF_TRUTH_PASS (${files.length} public-hub file(s) scanned, ${acked} ACKed)`);
