/**
 * Idempotency key contract (shared).
 *
 * Rule: PX-IDEMPOTENCY-001 (ADR-015). Branded `IdempotencyKey` + a generator for
 * retry-sensitive commands (create/publish/upload/finalize). The persistence
 * contract + in-memory adapter live in server/application-v2/runtime/idempotency.
 *
 * Randomness is strictly WebCrypto-backed via `createUuid()` (no Math.random
 * fallback — PX-SEED-001 / no-unsafe-randomness).
 */
import { asIdempotencyKey, type IdempotencyKey } from "./ids";
import { createUuid } from "./uuid";

export type { IdempotencyKey };
export { asIdempotencyKey };

/** Generate a fresh idempotency key; injectable generator, else WebCrypto UUID. */
export function createIdempotencyKey(generateId?: () => string): IdempotencyKey {
  if (generateId) return asIdempotencyKey(generateId());
  return asIdempotencyKey(`idem_${createUuid()}`);
}
