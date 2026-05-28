/**
 * identity — event envelope helpers (internal)
 *
 * Wraps raw identity events in the canonical `EventEnvelope` shape
 * (PX-EVENT-001 / ADR-009) at the publish site. Identity does not yet have a
 * transactional outbox, but every event that leaves the domain MUST already
 * carry the envelope so consumers see one shape and a stable `idempotencyKey`
 * once the outbox lands.
 */
import { makeEventEnvelope } from "@shared/contracts/event-envelope";
import type { IdentityEvent, IdentityEventEnvelope } from "../events";

export type { IdentityEventEnvelope } from "../events";

function envelopeIdFor(event: IdentityEvent): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Deterministic fallback avoids unsafe randomness: combine the event natural
  // key (type + actor + at) — collisions only happen on identical events at the
  // same instant, in which case the idempotency key (built from the same parts)
  // already protects consumers from duplicate processing.
  return `identity:${event.type}:${event.userId}:${event.at}`;
}

function idempotencyKeyFor(event: IdentityEvent): string {
  return `${event.type}:${event.userId}:${event.at}`;
}

export function wrapIdentityEvent(event: IdentityEvent): IdentityEventEnvelope {
  return makeEventEnvelope<IdentityEvent>({
    id: envelopeIdFor(event),
    type: event.type,
    occurredAt: event.at,
    actorId: event.userId,
    payload: event,
    idempotencyKey: idempotencyKeyFor(event),
  });
}
