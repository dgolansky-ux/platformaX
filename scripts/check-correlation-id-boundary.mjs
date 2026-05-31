#!/usr/bin/env node
/**
 * scripts/check-correlation-id-boundary.mjs
 *
 * Rule: PX-OBS-003 — request use-cases and their logger / error paths
 * must preserve a `correlationId` so a single request can be traced
 * end-to-end (request → use-case → domain → log → error).
 *
 * NARROW (Slice 25): the guard enforces ONE structural claim per
 * `server/application-v2/use-cases/<uc>/service.ts` file:
 *
 *   The file MUST mention the literal token `correlationId` at least
 *   once OR carry a file-level `// PX-OBS-003-ACK: <reason>` marker.
 *
 * The token can appear in a parameter signature, an input contract,
 * a logger payload, or even a comment that documents the deferred
 * wiring — what matters is that the use-case author considered the
 * concern. The guard does not validate that the value is propagated
 * to downstream calls (semantic check); that stays a manual review
 * item until a typed RequestContext is enforced repo-wide.
 *
 * Failure mode: exits 1 with `CORRELATION_ID_BOUNDARY_VIOLATION:`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const USE_CASES_ROOT = join(ROOT, "server", "application-v2", "use-cases");
const ACK_MARKER = /PX-OBS-003-ACK:\s*([^\n*]+)/;
const CORRELATION_TOKEN = /\bcorrelationId\b/;

function toPosix(p) { return p.split(sep).join("/"); }

function listUseCaseServices() {
  const out = [];
  if (!existsSync(USE_CASES_ROOT)) return out;
  for (const e of readdirSync(USE_CASES_ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name === "__tests__") continue;
    const candidate = join(USE_CASES_ROOT, e.name, "service.ts");
    if (existsSync(candidate)) out.push(candidate);
  }
  return out;
}

let violations = 0;
let acked = 0;
let ok = 0;
const files = listUseCaseServices();

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  if (CORRELATION_TOKEN.test(content)) { ok += 1; continue; }
  const ack = ACK_MARKER.exec(content);
  if (ack) {
    console.error(`CORRELATION_ID_BOUNDARY_ACK: ${rel} — no correlationId token in file — PX-OBS-003-ACK: ${ack[1].trim()}`);
    acked += 1;
    continue;
  }
  console.error(`CORRELATION_ID_BOUNDARY_VIOLATION: ${rel} — use-case service does not mention correlationId and carries no PX-OBS-003-ACK marker`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-correlation-id-boundary: ${violations} violation(s) found across ${files.length} use-case service(s); ${ok} green, ${acked} ACKed`);
  process.exit(1);
}
console.log(`CHECK_CORRELATION_ID_BOUNDARY_PASS (${files.length} use-case service(s) scanned; ${ok} green, ${acked} ACKed)`);
