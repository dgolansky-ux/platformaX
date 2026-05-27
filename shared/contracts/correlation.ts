/**
 * Correlation ID + request context (skeleton).
 *
 * Rule: PX-OBS-003. A correlation id should flow request → use-case → log →
 * error so a single request is traceable end to end. This is a contract +
 * generator skeleton (CORRELATION_CONTEXT_SKELETON_READY); it is NOT yet wired
 * through middleware/use-cases — full observability remains a follow-up.
 */
import type { UserId } from "./ids";

export const CORRELATION_CONTEXT_SKELETON_READY =
  "CORRELATION_CONTEXT_SKELETON_READY" as const;

export interface RequestContext {
  correlationId: string;
  actorId: UserId | null;
}

type CryptoLike = { randomUUID?: () => string };

/** Generate a correlation id; injectable generator, else crypto.randomUUID. */
export function createCorrelationId(generateId?: () => string): string {
  if (generateId) return generateId();
  const cryptoObj = (globalThis as { crypto?: CryptoLike }).crypto;
  if (cryptoObj?.randomUUID) return `cid_${cryptoObj.randomUUID()}`;
  const rand = Math.floor(Math.random() * 0xffffffff).toString(16);
  return `cid_${Date.now().toString(36)}_${rand}`;
}

/** Build a RequestContext. `actorId` is explicit (null for anonymous). */
export function createRequestContext(
  actorId: UserId | null,
  correlationId?: string,
): RequestContext {
  return { correlationId: correlationId ?? createCorrelationId(), actorId };
}
