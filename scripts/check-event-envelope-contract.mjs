/**
 * Guard: real (PARTIAL/IMPLEMENTED) domains emit events through `EventEnvelope`.
 *
 * Rule: PX-EVENT-001 (ADR-009). Once a domain has runtime, it must not regress to
 * an ad-hoc `{ type, userId, at }` event shape. This guard inspects each
 * `server/domains-v2/<domain>/events.ts` whose domain is **not** `SCAFFOLD_ONLY`
 * (per `docs/governance/DOMAIN_STATUS_REGISTRY.yml`) and fails when:
 *
 *  - the file does not import `EventEnvelope` / `createEventEnvelope` from
 *    `@shared/contracts/event-envelope`,
 *  - any exported event payload type lists a PII-shaped key
 *    (email, phone, dateOfBirth, token, session, password, secret),
 *  - any exported event type literal is not namespaced (`domain.entity.action`),
 *  - any exported event type uses the deprecated bare `at:` field instead of
 *    `occurredAt` (a regression hint from the pre-envelope era).
 *
 * SCAFFOLD_ONLY domains are skipped — they have no runtime yet and may still
 * carry placeholder shapes.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DOMAINS_DIR = join(ROOT, "server/domains-v2");
const STATUS_REGISTRY = join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml");

const FORBIDDEN_PAYLOAD_KEYS = [
  "email",
  "phone",
  "dateOfBirth",
  "birthDate",
  "token",
  "session",
  "password",
  "secret",
];

const REQUIRED_IMPORTS = ["EventEnvelope", "createEventEnvelope"];

function fail(msg) {
  console.error(`EVENT_ENVELOPE_CONTRACT_VIOLATION: ${msg}`);
}

function readDomainStatuses() {
  // Minimal line-based parse — same convention as check-domain-status-registry.
  const map = {};
  if (!existsSync(STATUS_REGISTRY)) return map;
  const content = readFileSync(STATUS_REGISTRY, "utf-8");
  const lines = content.split("\n");
  let currentName = null;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const nameMatch = line.match(/^\s*-\s*name:\s*(\S+)/);
    if (nameMatch) {
      currentName = nameMatch[1].trim();
      continue;
    }
    if (currentName) {
      const statusMatch = line.match(/^\s+status:\s*(\S+)/);
      if (statusMatch) {
        map[currentName] = statusMatch[1].trim();
      }
    }
  }
  return map;
}

function findEventsFiles() {
  const out = [];
  if (!existsSync(DOMAINS_DIR)) return out;
  for (const entry of readdirSync(DOMAINS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const eventsPath = join(DOMAINS_DIR, entry.name, "events.ts");
    if (existsSync(eventsPath)) {
      out.push({ domain: entry.name, path: eventsPath });
    }
  }
  return out;
}

/** Strip line + block comments so prose mentions are not matched. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** Extract all string-literal event `type:` values declared in EventEnvelope generics. */
function extractEnvelopeTypeLiterals(code) {
  const literals = new Set();
  // EventEnvelope< "x", ... >
  for (const m of code.matchAll(/EventEnvelope<\s*"([^"]+)"/g)) {
    literals.add(m[1]);
  }
  // type: "x", inside createEventEnvelope({ type: "x", ... })
  for (const m of code.matchAll(/\btype:\s*"([^"]+)"/g)) {
    literals.add(m[1]);
  }
  return [...literals];
}

/** Detect "Payload = { ... }" exports and list their key names. */
function extractPayloadKeys(code) {
  const result = [];
  // export type SomethingPayload = { ... };
  const re = /export\s+type\s+(\w*Payload)\s*=\s*\{([\s\S]*?)\}\s*;/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1];
    const body = m[2];
    const keys = [];
    // Accept multi-line members and inline `;` / `,` separated ones.
    for (const k of body.matchAll(/(?:^|[\n;,])\s*([A-Za-z_][\w]*)\s*[?]?:/g)) {
      keys.push(k[1]);
    }
    result.push({ name, keys });
  }
  return result;
}

function isNamespacedEventType(literal) {
  // Expect at least domain.entity.action — two dots, lowercase segments,
  // payloads-friendly snake_case allowed inside segments.
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(literal)) return false;
  return true;
}

let violations = 0;
const statuses = readDomainStatuses();

for (const { domain, path } of findEventsFiles()) {
  const status = statuses[domain] ?? "UNKNOWN";
  // SCAFFOLD_ONLY domains are exempt — they have no runtime yet.
  if (status === "SCAFFOLD_ONLY") continue;

  const rel = relative(ROOT, path).replace(/\\/g, "/");
  const raw = readFileSync(path, "utf-8");
  const code = stripComments(raw);

  // 1) Required import from @shared/contracts/event-envelope.
  const importsEnvelope = /from\s+["']@shared\/contracts\/event-envelope["']/.test(raw);
  if (!importsEnvelope) {
    fail(`${rel} (${domain}, ${status}) does not import @shared/contracts/event-envelope`);
    violations++;
  } else {
    for (const symbol of REQUIRED_IMPORTS) {
      const re = new RegExp(`\\b${symbol}\\b[^"';]*?from\\s+["']@shared/contracts/event-envelope["']`);
      const importLine = raw.match(/import[\s\S]*?from\s+["']@shared\/contracts\/event-envelope["']/g);
      const importBlob = importLine ? importLine.join("\n") : "";
      if (!importBlob.includes(symbol)) {
        fail(`${rel} must import "${symbol}" from @shared/contracts/event-envelope`);
        violations++;
      }
    }
  }

  // 2) No bare `at:` ISO timestamp (the pre-envelope shape).
  //    EventEnvelope uses `occurredAt`. Mentioning `at` as a property name in an
  //    exported event/payload type is a regression signal.
  for (const m of code.matchAll(/export\s+type\s+(\w*Event\w*|\w*Payload)\s*=\s*\{([\s\S]*?)\}/g)) {
    const body = m[2];
    if (/(?:^|[\n;,])\s*at\s*[?]?:\s*string\b/.test(body)) {
      fail(`${rel} exports "${m[1]}" with a bare \`at\` field — use EventEnvelope.occurredAt`);
      violations++;
    }
  }

  // 3) Payload types must not list PII-shaped keys.
  for (const { name, keys } of extractPayloadKeys(code)) {
    for (const k of keys) {
      const lower = k.toLowerCase();
      for (const forbidden of FORBIDDEN_PAYLOAD_KEYS) {
        if (lower === forbidden.toLowerCase()) {
          fail(`${rel} payload "${name}" carries forbidden key "${k}" — events must be PII-free`);
          violations++;
        }
      }
    }
  }

  // 4) Event type literals must be dot-namespaced.
  for (const literal of extractEnvelopeTypeLiterals(code)) {
    if (!isNamespacedEventType(literal)) {
      fail(`${rel} declares non-namespaced event type "${literal}" — use "domain.entity.action"`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\ncheck-event-envelope-contract: ${violations} violation(s)`);
  process.exit(1);
}

console.log("CHECK_EVENT_ENVELOPE_CONTRACT_PASS");
