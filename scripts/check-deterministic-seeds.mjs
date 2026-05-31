#!/usr/bin/env node
/**
 * scripts/check-deterministic-seeds.mjs
 *
 * Rule: PX-SEED-001 — dev and test seeds, fixtures, and snapshot
 * builders MUST be deterministic. Non-deterministic primitives
 * (`Math.random`, `Date.now`, `crypto.randomUUID`, `randomUUID(`)
 * make tests flaky and snapshot diffs noisy.
 *
 * NARROW (Slice 25): the guard scans
 *   - `tests/**`
 *   - `**\/fixtures/**` (any path containing /fixtures/)
 *   - `**\/seed*.{ts,mjs,js}` files
 *   - `supabase/seeds/**`
 * for the four forbidden tokens. If a file uses one and has no
 * `// PX-SEED-001-ACK: <reason>` marker, the guard fails.
 *
 * Test files (`*.test.ts(x)`) themselves are OUT of scope — they may
 * legitimately use Date.now for time-sensitive assertions.
 *
 * Failure mode: exits 1 with `DETERMINISTIC_SEEDS_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = [
  join(ROOT, "tests"),
  join(ROOT, "supabase"),
  join(ROOT, "client"),
  join(ROOT, "server"),
  join(ROOT, "shared"),
];
const ACK_MARKER = /PX-SEED-001-ACK:\s*([^\n*]+)/;

const FORBIDDEN = [
  { re: /\bMath\.random\s*\(/,          kind: "Math.random()" },
  { re: /\bDate\.now\s*\(/,             kind: "Date.now()" },
  { re: /\bcrypto\.randomUUID\s*\(/,    kind: "crypto.randomUUID()" },
  { re: /\brandomUUID\s*\(/,            kind: "randomUUID()" },
];

function toPosix(p) { return p.split(sep).join("/"); }

function isSeedFile(rel) {
  if (rel.startsWith("tests/")) return true;
  if (rel.includes("/fixtures/")) return true;
  if (rel.startsWith("supabase/seeds/")) return true;
  const base = rel.split("/").pop() || "";
  if (/^seed[s]?[.-]/i.test(base)) return true;
  if (/[.\-]seed[s]?\./i.test(base)) return true;
  return false;
}

function isTestFile(rel) {
  return /\.test\.[mc]?[jt]sx?$/.test(rel) || rel.includes("/__tests__/");
}

function listCandidateFiles() {
  const out = [];
  function walk(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mjs|js|cjs)$/.test(e.name)) out.push(full);
    }
  }
  for (const r of SCAN_ROOTS) walk(r);
  return out;
}

let violations = 0;
let acked = 0;
let scanned = 0;

for (const file of listCandidateFiles()) {
  const rel = toPosix(relative(ROOT, file));
  if (!isSeedFile(rel)) continue;
  if (isTestFile(rel)) continue;
  scanned += 1;
  const content = readFileSync(file, "utf-8");
  const ack = ACK_MARKER.exec(content);
  for (const { re, kind } of FORBIDDEN) {
    if (re.test(content)) {
      if (ack) {
        console.error(`DETERMINISTIC_SEEDS_ACK: ${rel} — ${kind} — PX-SEED-001-ACK: ${ack[1].trim()}`);
        acked += 1;
      } else {
        console.error(`DETERMINISTIC_SEEDS_VIOLATION: ${rel} — ${kind} without PX-SEED-001-ACK marker`);
        violations += 1;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-deterministic-seeds: ${violations} violation(s) found across ${scanned} seed/fixture file(s); ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_DETERMINISTIC_SEEDS_PASS (${scanned} seed/fixture file(s) scanned, ${acked} ACKed)`);
