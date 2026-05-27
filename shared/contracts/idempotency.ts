/**
 * Idempotency key contract (shared).
 *
 * Rule: PX-IDEMPOTENCY-001 (ADR-015). Branded `IdempotencyKey` + a generator for
 * retry-sensitive commands (create/publish/upload/finalize). The persistence
 * contract + in-memory adapter live in server/application-v2/runtime/idempotency.
 */
import { asIdempotencyKey, type IdempotencyKey } from "./ids";

export type { IdempotencyKey };
export { asIdempotencyKey };

type CryptoLike = { randomUUID?: () => string };

/** Generate a fresh idempotency key; injectable generator, else randomUUID. */
export function createIdempotencyKey(generateId?: () => string): IdempotencyKey {
  if (generateId) return asIdempotencyKey(generateId());
  const cryptoObj = (globalThis as { crypto?: CryptoLike }).crypto;
  if (cryptoObj?.randomUUID) return asIdempotencyKey(`idem_${cryptoObj.randomUUID()}`);
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16);
  return asIdempotencyKey(`idem_${Date.now().toString(36)}_${rand}`);
}
