#!/usr/bin/env node
/**
 * scripts/check-no-storage-as-backend.mjs
 *
 * Rule: no `localStorage` / `sessionStorage` as a fake backend.
 * Persisting domain data (posts, users, communities, friends,
 * notifications, conversations, ...) into browser storage drifts
 * frontend state away from the real server, and feature-registry
 * statuses lose their meaning.
 *
 * NARROW (Slice 25): the guard scans `client/src/**\/*.{ts,tsx}` for
 * calls to `localStorage.setItem(` and `sessionStorage.setItem(`. It
 * fails if the call site is NOT in the allow-list below AND the
 * file does not carry `// PX-STORAGE-001-ACK: <reason>`.
 *
 * Allowed file prefixes (UI preferences, ephemeral session hints):
 *   - any path containing `/ui-prefs/`,
 *   - any path containing `/consent/`,
 *   - any path containing `/theme/`,
 *   - `client/src/app-v2/system/`  — system-level toggles only.
 *
 * The allow-list is INTENTIONALLY tiny. New allowed paths must be
 * added here AND registered in `EXCEPTIONS_REGISTER.md`.
 *
 * Failure mode: exits 1 with `STORAGE_AS_BACKEND_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CLIENT_ROOT = join(ROOT, "client", "src");
const ACK_MARKER = /PX-STORAGE-001-ACK:\s*([^\n*]+)/;

const SETITEM_RE = /\b(local|session)Storage\s*\.\s*setItem\s*\(/;

const ALLOWED_PATH_FRAGMENTS = [
  "/ui-prefs/",
  "/consent/",
  "/theme/",
  "client/src/app-v2/system/",
];

function toPosix(p) { return p.split(sep).join("/"); }

function listClientFiles() {
  const out = [];
  if (!existsSync(CLIENT_ROOT)) return out;
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "__tests__") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(full);
    }
  }
  walk(CLIENT_ROOT);
  return out;
}

let violations = 0;
let acked = 0;
let allowed = 0;
const files = listClientFiles();

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  if (!SETITEM_RE.test(content)) continue;

  if (ALLOWED_PATH_FRAGMENTS.some(p => rel.includes(p))) { allowed += 1; continue; }

  const ack = ACK_MARKER.exec(content);
  if (ack) {
    console.error(`STORAGE_AS_BACKEND_ACK: ${rel} — *Storage.setItem(...) call — PX-STORAGE-001-ACK: ${ack[1].trim()}`);
    acked += 1;
    continue;
  }
  console.error(`STORAGE_AS_BACKEND_VIOLATION: ${rel} — uses localStorage/sessionStorage setItem outside allow-list (ui-prefs/, consent/, theme/, app-v2/system/) and without PX-STORAGE-001-ACK marker`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-no-storage-as-backend: ${violations} violation(s) found across ${files.length} client file(s); ${allowed} allow-listed, ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_NO_STORAGE_AS_BACKEND_PASS (${files.length} client file(s) scanned; ${allowed} allow-listed, ${acked} ACKed)`);
