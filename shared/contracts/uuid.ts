/**
 * UUID helper — split-ready id generation aligned with the SQL migrations.
 *
 * Rules: PX-ID-001 (branded ids) and the persisted column types in
 * supabase/migrations (media_assets.id uuid, outbox_messages.id uuid,
 * outbox_messages.event_id uuid, outbox_messages.actor_id uuid).
 *
 * `createUuid` returns a UUID-formatted string. It prefers WebCrypto's
 * `crypto.randomUUID()` (Node 18+, browsers); otherwise it falls back to a
 * deterministic v4-like construction over `Math.random()`. The fallback
 * is acceptable because seeds/tests inject deterministic generators directly
 * — the fallback only runs in environments without WebCrypto.
 *
 * `isUuid` accepts any version (v1/v3/v4/v5/v7) and any case.
 *
 * IdempotencyKey is intentionally NOT a UUID — the migration types
 * `idempotency_keys.key text`, so callers may use namespaced prefixes
 * ("scope:resource:hash"). Use the branded `IdempotencyKey` from ./ids instead.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CryptoLike = { randomUUID?: () => string };

function fallbackV4(): string {
  // Best-effort v4 — only used when no WebCrypto is available. Tests should
  // inject their own deterministic generator; production runs hit WebCrypto.
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const bytes = new Array(16);
  for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  // Force version 4 and variant 10xx.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const part = (a: number, b: number) =>
    bytes.slice(a, b).map(hex).join("");
  return `${part(0, 4)}-${part(4, 6)}-${part(6, 8)}-${part(8, 10)}-${part(10, 16)}`;
}

export function createUuid(): string {
  const c = (globalThis as { crypto?: CryptoLike }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return fallbackV4();
}

export function isUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}
