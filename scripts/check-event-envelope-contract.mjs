#!/usr/bin/env node
/**
 * scripts/check-event-envelope-contract.mjs
 *
 * Rule: PX-EVENT-001 — every event type exported by a domain's
 * `events.ts` must travel inside `EventEnvelope` (from
 * `shared/contracts/event-envelope`). The envelope guarantees the
 * required fields `id`, `type`, `version`, `occurredAt`, `actorId`,
 * `payload`, `idempotencyKey`.
 *
 * Detection (literal substring; cheap and reliable):
 *   - The file is a placeholder (matches `^export\s*\{\s*\}` or has no
 *     `export type` / `export interface`) → trivially passes.
 *   - Otherwise, the file must import `EventEnvelope` from
 *     `@shared/contracts/event-envelope` or use a file-level
 *     `// PX-EVENT-001-ACK: <reason>` marker. The marker is logged but
 *     does not fail; it does require a corresponding row in
 *     `EXCEPTIONS_REGISTER.md` once Slice 25's exception expansion
 *     ships.
 *
 * Failure mode: exits 1, prints `EVENT_ENVELOPE_CONTRACT_VIOLATION:`
 * per finding. Fails closed.
 *
 * Coverage gaps:
 *   - Does not yet inspect the event payload field-by-field. A type
 *     that imports the envelope but defines an ad-hoc shape inside
 *     `payload` is currently accepted. Tighter inspection is a P1
 *     follow-up.
 *   - Does not yet inspect events used by application-v2 use-cases —
 *     those are documented separately in
 *     `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md §9`.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DOMAINS_ROOT = join(ROOT, "server", "domains-v2");

const ACK_MARKER = /PX-EVENT-001-ACK:\s*([^\n*]+)/;
const ENVELOPE_IMPORT_RE = /from\s+["']@shared\/contracts\/event-envelope["']/;
const ENVELOPE_TYPE_REF_RE = /\bEventEnvelope\b/;

function toPosix(p) { return p.split(sep).join("/"); }

function listEventsFiles() {
  const out = [];
  if (!existsSync(DOMAINS_ROOT)) return out;
  for (const e of readdirSync(DOMAINS_ROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const fp = join(DOMAINS_ROOT, e.name, "events.ts");
    if (existsSync(fp)) out.push(fp);
  }
  return out;
}

let violations = 0;
for (const file of listEventsFiles()) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));

  // Placeholder: no event types declared.
  const declaresEvent = /^export\s+(?:type|interface)\s+\w*Event/m.test(content);
  if (!declaresEvent) {
    // Trivially compliant. Skip.
    continue;
  }

  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;

  const usesEnvelope = ENVELOPE_IMPORT_RE.test(content) && ENVELOPE_TYPE_REF_RE.test(content);

  if (usesEnvelope) continue;
  if (acked) {
    console.error(`EVENT_ENVELOPE_CONTRACT_ACK: ${rel} — no EventEnvelope import; PX-EVENT-001-ACK: ${acked}`);
    continue;
  }
  console.error(`EVENT_ENVELOPE_CONTRACT_VIOLATION: ${rel} declares event types without EventEnvelope import from @shared/contracts/event-envelope`);
  violations += 1;
}

if (violations > 0) {
  console.error(`\ncheck-event-envelope-contract: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_EVENT_ENVELOPE_CONTRACT_PASS");
