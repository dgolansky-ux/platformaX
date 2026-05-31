#!/usr/bin/env node
/**
 * scripts/check-transactional-outbox-pattern.mjs
 *
 * Rule: PX-EVENT-002 — when a source-of-truth write happens AND a
 * cross-domain event needs to be published, both writes must happen
 * inside the same DB transaction (transactional outbox).
 *
 * Narrow heuristic: this is a notoriously hard rule to enforce
 * statically. The guard catches the obvious anti-pattern only —
 * publishing an event AFTER a separate write call, on the same code
 * branch, outside any visible `tx`/`trx`/`transaction` scope:
 *
 *   await repository.save(...);
 *   await publishEvent({ ... });        ← red flag without tx
 *
 * If the file uses an `outbox.insert(` call adjacent to the save, or
 * the publish is inside a `(tx | trx | transaction).run(` / `db.transaction(`
 * arrow body, the guard passes.
 *
 * Ack marker: `// PX-EVENT-002-ACK: <reason>` at file level logs and
 * passes. Slice 25 will narrow this guard once a real outbox table
 * lands.
 *
 * Coverage gaps:
 *   - The guard does NOT confirm a real DB transaction (impossible
 *     statically). It rejects only the obvious "publish without any
 *     transaction scope" shape.
 *   - The guard does NOT inspect the use-case layer for cross-domain
 *     fan-out; that surface is already covered by
 *     `check-scalability-hot-paths.mjs`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const ACK_MARKER = /PX-EVENT-002-ACK:\s*([^\n*]+)/;

function toPosix(p) { return p.split(sep).join("/"); }

function listFiles() {
  const out = [];
  function walk(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "service.ts" || e.name === "repository.ts") out.push(full);
    }
  }
  walk(join(ROOT, "server", "domains-v2"));
  walk(join(ROOT, "server", "application-v2", "use-cases"));
  return out;
}

const PUBLISH_CALL_RE = /\b(?:publish|emit)(?:Event|Domain[A-Z][A-Za-z0-9_]*)\s*\(/g;
const TX_SCOPE_RE = /\b(?:tx|trx|transaction)\.run\s*\(|db\.transaction\s*\(|withTransaction\s*\(|outbox\.insert\s*\(/;

let violations = 0;
for (const file of listFiles()) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  PUBLISH_CALL_RE.lastIndex = 0;
  if (!PUBLISH_CALL_RE.test(content)) continue;
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;
  const txOk = TX_SCOPE_RE.test(content);
  if (txOk) continue;
  if (acked) {
    console.error(`TRANSACTIONAL_OUTBOX_PATTERN_ACK: ${rel} — publish without tx/outbox scope; PX-EVENT-002-ACK: ${acked}`);
    continue;
  }
  console.error(`TRANSACTIONAL_OUTBOX_PATTERN_VIOLATION: ${rel} — calls publish/emit*Event without a visible tx/outbox.insert/db.transaction scope`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-transactional-outbox-pattern: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_TRANSACTIONAL_OUTBOX_PATTERN_PASS");
