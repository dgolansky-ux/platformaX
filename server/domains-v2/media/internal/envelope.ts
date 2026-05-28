/**
 * media — event envelope helpers (internal)
 *
 * Wraps raw media events in the canonical `EventEnvelope` shape
 * (PX-EVENT-001 / ADR-009) at the publish site. Media does not yet have a
 * transactional outbox, but every event that leaves the domain MUST already
 * carry the envelope so consumers see one shape and a stable `idempotencyKey`
 * once the outbox lands.
 */
import { makeEventEnvelope } from "@shared/contracts/event-envelope";
import type { MediaEvent, MediaEventEnvelope } from "../events";

export type { MediaEventEnvelope } from "../events";

function envelopeIdFor(event: MediaEvent): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `media:${event.type}:${event.assetId}:${event.at}`;
}

function idempotencyKeyFor(event: MediaEvent): string {
  return `${event.type}:${event.assetId}:${event.at}`;
}

export function wrapMediaEvent(event: MediaEvent): MediaEventEnvelope {
  return makeEventEnvelope<MediaEvent>({
    id: envelopeIdFor(event),
    type: event.type,
    occurredAt: event.at,
    actorId: event.ownerId,
    payload: event,
    idempotencyKey: idempotencyKeyFor(event),
  });
}
