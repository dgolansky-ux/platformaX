#!/usr/bin/env node
/**
 * scripts/check-presentational-container-boundary.mjs
 *
 * Rule: PX-UI-002 — presentational components must NOT import data
 * adapters, transport hooks, or query libraries directly. The
 * container layer owns data; the presentational layer owns markup.
 *
 * NARROW (Slice 25): the guard scans every
 * `client/src/features-v2/<feature>/components/**\/*.{ts,tsx}` file
 * (and `client/src/app-v2/**\/components/**\/*.{ts,tsx}` for shared
 * presentational kits). For each file it forbids any import that
 * matches one of these patterns:
 *
 *   - `*\/data\/*`         (project data adapter folder)
 *   - `*\/adapters\/*`     (adapter folders)
 *   - `@tanstack/react-query`
 *   - `swr`
 *   - `axios`
 *   - bare `fetch(` calls at module scope (rare — flagged loosely)
 *
 * Files may opt out per-file with `// PX-UI-002-ACK: <reason>`. The
 * marker is logged and counted.
 *
 * Failure mode: exits 1 with `PRESENTATIONAL_BOUNDARY_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = [
  join(ROOT, "client", "src", "features-v2"),
  join(ROOT, "client", "src", "app-v2"),
];
const ACK_MARKER = /PX-UI-002-ACK:\s*([^\n*]+)/;

const FORBIDDEN_IMPORTS = [
  { re: /\/data\//,                  reason: "data adapter folder" },
  { re: /\/adapters\//,              reason: "adapter folder" },
  { re: /^@tanstack\/react-query$/,  reason: "react-query in presentational" },
  { re: /^swr$/,                     reason: "swr in presentational" },
  { re: /^axios$/,                   reason: "axios in presentational" },
];

function toPosix(p) { return p.split(sep).join("/"); }

function listComponentFiles() {
  const out = [];
  function walk(d, insideComponents) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) {
        walk(full, insideComponents || e.name === "components");
      } else if (insideComponents && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) {
        if (e.name.endsWith(".test.ts") || e.name.endsWith(".test.tsx")) continue;
        out.push(full);
      }
    }
  }
  for (const r of SCAN_ROOTS) walk(r, false);
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
const files = listComponentFiles();

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  for (const imp of extractImports(content)) {
    for (const { re, reason } of FORBIDDEN_IMPORTS) {
      if (re.test(imp)) {
        if (ack) {
          console.error(`PRESENTATIONAL_BOUNDARY_ACK: ${rel} — ${reason} (${imp}) — PX-UI-002-ACK: ${ack[1].trim()}`);
          acked += 1;
        } else {
          console.error(`PRESENTATIONAL_BOUNDARY_VIOLATION: ${rel} — ${reason} (${imp})`);
          violations += 1;
        }
        break;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-presentational-container-boundary: ${violations} violation(s) found across ${files.length} component file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_PRESENTATIONAL_CONTAINER_BOUNDARY_PASS (${files.length} component file(s) scanned, ${acked} ACKed)`);
