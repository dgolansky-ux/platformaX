/**
 * shared/contracts/event-envelope — EventEnvelope contract.
 *
 * ADR-009 / PX-EVENT-001: every cross-domain event must travel inside a stable
 * envelope so consumers can deduplicate, version and audit it. Identity and
 * media domains use this shape for any fan-out event. The envelope carries an
 * `idempotencyKey` so a retried publish is processed at most once (PX-IDEMP-001).
 */
export type EventEnvelope<TPayload = unknown> = {
  /** Stable unique event ID, e.g. crypto.randomUUID(). */
  id: string;
  /** Fully qualified event type, e.g. "identity.onboarding.completed". */
  type: string;
  /** Schema version for forward/backward compatibility. Starts at 1. */
  version: number;
  /** ISO-8601 timestamp of when the event occurred. */
  occurredAt: string;
  /** Actor who triggered the event (userId or "system"). */
  actorId: string;
  /** Typed event payload. */
  payload: TPayload;
  /** Idempotency key — prevents duplicate processing on retry. */
  idempotencyKey: string;
};

/** Build an EventEnvelope, defaulting `version` to the current schema (1). */
export function makeEventEnvelope<TPayload>(input: {
  id: string;
  type: string;
  occurredAt: string;
  actorId: string;
  payload: TPayload;
  idempotencyKey: string;
  version?: number;
}): EventEnvelope<TPayload> {
  return {
    id: input.id,
    type: input.type,
    version: input.version ?? 1,
    occurredAt: input.occurredAt,
    actorId: input.actorId,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
  };
}
