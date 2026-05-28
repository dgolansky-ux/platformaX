/**
 * Correlation ID + request context (skeleton).
 *
 * Rule: PX-OBS-003. A correlation id should flow request → use-case → log →
 * error so a single request is traceable end to end. This is a contract +
 * generator skeleton (CORRELATION_CONTEXT_SKELETON_READY); it is NOT yet wired
 * through middleware/use-cases — full observability remains a follow-up.
 */
import type { UserId } from "./ids";
import { createUuid } from "./uuid";

export const CORRELATION_CONTEXT_SKELETON_READY =
  "CORRELATION_CONTEXT_SKELETON_READY" as const;

export interface RequestContext {
  correlationId: string;
  actorId: UserId | null;
}

/**
 * Generate a correlation id. Pluggable for tests (`generateId`); otherwise
 * defers to `createUuid()` which is strictly WebCrypto-backed
 * (no `Math.random` fallback — PX-OBS-003 / PX-SEED-001 / no-unsafe-randomness).
 */
export function createCorrelationId(generateId?: () => string): string {
  if (generateId) return generateId();
  return `cid_${createUuid()}`;
}

/** Build a RequestContext. `actorId` is explicit (null for anonymous). */
export function createRequestContext(
  actorId: UserId | null,
  correlationId?: string,
): RequestContext {
  return { correlationId: correlationId ?? createCorrelationId(), actorId };
}
