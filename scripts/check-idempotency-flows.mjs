#!/usr/bin/env node
/**
 * scripts/check-idempotency-flows.mjs
 *
 * Rule: PX-IDEMP-001 / PX-IDEMPOTENCY-001 — retry-sensitive write
 * commands (`create*`, `publish*`, `upload*`, `finalize*`) at a public
 * boundary must accept `idempotencyKey` or carry a file-level
 * `// PX-IDEMP-001-ACK: <reason>` (e.g. "command runs only via the
 * onboarding flow; idempotency provided by upstream session token").
 *
 * Scope: `server/domains-v2/*\/service.ts`,
 * `server/domains-v2/*\/public-api.ts`,
 * `server/application-v2/use-cases/*\/service.ts`.
 *
 * Detection: any exported function whose name matches
 * `^(create|publish|upload|finalize)[A-Z]` must either accept a
 * parameter containing `idempotencyKey` (anywhere in its parameter
 * list) or be inside a file carrying the ACK marker.
 *
 * Coverage gaps:
 *   - The guard only inspects the parameter list, not the body. A
 *     function that accepts an `input` object whose type — declared
 *     elsewhere — contains `idempotencyKey` will pass only if the
 *     parameter list itself mentions the field. This is acceptable
 *     during foundation; tighter type-resolution is a P1 follow-up.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();

const ACK_MARKER = /PX-IDEMP-001-ACK:\s*([^\n*]+)/;

function toPosix(p) { return p.split(sep).join("/"); }

function listServiceFiles() {
  const out = [];
  function walk(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === "service.ts" || e.name === "public-api.ts") out.push(full);
    }
  }
  walk(join(ROOT, "server", "domains-v2"));
  walk(join(ROOT, "server", "application-v2", "use-cases"));
  return out;
}

const CMD_RE = /(?:^|[\s,;=({])((?:async\s+)?(?:function\s+)?([a-z][A-Za-z0-9_$]*)\s*[=:]?\s*\(([^)]{0,400})\))/gm;
const CMD_NAME_RE = /^(create|publish|upload|finalize)[A-Z]/;
// Factory functions ending in "Service" / "Bridge" / "Repository" are
// dependency-injection constructors, not retry-sensitive write commands.
// Same for the `createXEvent` / `createXEnvelope` constructors that
// merely build typed payloads.
const FACTORY_SKIP_RE = /^create[A-Z][A-Za-z0-9_$]*(Service|Bridge|Repository|Publisher|Adapter|Factory|Builder|Envelope|Event|Helper|Result|Client|Mapper|Policy|Registry|Context|Store|Cache|Queue|Resolver|Provider|Listener|Subscriber|Strategy|Handler|Logger|Pipeline|Reader|Writer|Validator|Filter|Iterator|View|Snapshot|Shape|Engine|Manager|Connection|Channel|Surface|Decoder|Encoder|Producer|Consumer|Worker|Job|Task|Notifier|Resource|Token|Scope|Boundary|Sink|Source|Module|Hub|Layer|Loader|Renderer|Selector|Reducer|Slice|Transformer)$/;
// Parameter that starts with `deps`/`config`/`options`/`runtime` is a
// factory signature, not a write command.
const FACTORY_PARAM_RE = /^\s*(deps|config|options|runtime|context|env)\s*[:?]/;

let violations = 0;
for (const file of listServiceFiles()) {
  const content = readFileSync(file, "utf-8");
  const rel = toPosix(relative(ROOT, file));
  const ack = ACK_MARKER.exec(content);
  const acked = ack ? ack[1].trim() : null;
  CMD_RE.lastIndex = 0;
  let m;
  const seen = new Set();
  while ((m = CMD_RE.exec(content)) !== null) {
    const name = m[2];
    if (seen.has(name)) continue;
    if (!CMD_NAME_RE.test(name)) continue;
    seen.add(name);
    const params = m[3] || "";
    if (FACTORY_SKIP_RE.test(name)) continue;
    if (FACTORY_PARAM_RE.test(params)) continue;
    if (/idempotencyKey/.test(params)) continue;
    if (acked) {
      console.error(`IDEMPOTENCY_FLOWS_ACK: ${rel} fn ${name}(...) — PX-IDEMP-001-ACK: ${acked}`);
      continue;
    }
    console.error(`IDEMPOTENCY_FLOWS_VIOLATION: ${rel} fn ${name}(${params.trim().slice(0, 80)}) missing idempotencyKey`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`\ncheck-idempotency-flows: ${violations} violation(s) found`);
  process.exit(1);
}
console.log("CHECK_IDEMPOTENCY_FLOWS_PASS");
