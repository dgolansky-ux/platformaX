/**
 * UUID helper — split-ready id generation aligned with the SQL migrations.
 *
 * Rules: PX-ID-001 (branded ids) and the persisted column types in
 * supabase/migrations (media_assets.id uuid, outbox_messages.id uuid,
 * outbox_messages.event_id uuid, outbox_messages.actor_id uuid).
 *
 * Source of randomness — strictly WebCrypto:
 *   1. `globalThis.crypto.randomUUID()` (Node 18+, browsers).
 *   2. Fallback to `crypto.getRandomValues()` to build a v4 UUID.
 *   3. If neither is available, throw a controlled error
 *      (`UUID_GENERATOR_UNAVAILABLE`). We never fall back to `Math.random`
 *      because it is not cryptographically secure and creates an
 *      unsafe-randomness guard violation (PX-SEED-001 / PX-ID-001 spirit).
 *
 * Browser/Vite-safe: no `node:crypto` import — both branches come from the
 * global `crypto` object exposed in Node 18+ and every modern browser.
 *
 * `isUuid` accepts any version (v1/v3/v4/v5/v7) and any case.
 *
 * IdempotencyKey is intentionally NOT a UUID — the migration types
 * `idempotency_keys.key text`, so callers may use namespaced prefixes
 * ("scope:resource:hash"). Use the branded `IdempotencyKey` from ./ids instead.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CryptoLike = {
  randomUUID?: () => string;
  getRandomValues?: <T extends ArrayBufferView>(buf: T) => T;
};

export class UuidGeneratorUnavailableError extends Error {
  constructor() {
    super(
      "UUID_GENERATOR_UNAVAILABLE: no globalThis.crypto.randomUUID and no getRandomValues — cannot generate a UUID safely.",
    );
    this.name = "UuidGeneratorUnavailableError";
  }
}

function getRandomValuesV4(c: CryptoLike): string {
  const bytes = new Uint8Array(16);
  c.getRandomValues!(bytes);
  // Force version 4 and variant 10xx, per RFC 4122 §4.4.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const part = (a: number, b: number) =>
    Array.from(bytes.slice(a, b)).map(hex).join("");
  return `${part(0, 4)}-${part(4, 6)}-${part(6, 8)}-${part(8, 10)}-${part(10, 16)}`;
}

export function createUuid(): string {
  const c = (globalThis as { crypto?: CryptoLike }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") return getRandomValuesV4(c);
  throw new UuidGeneratorUnavailableError();
}

export function isUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}
