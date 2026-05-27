/**
 * identity — domain events
 *
 * Events published by identity. Other domains may subscribe to these to react
 * to profile lifecycle changes (e.g. search reindex, public summary refresh).
 *
 * Rule: PX-EVENT-001 (ADR-009). Events use the shared `EventEnvelope` shape:
 * { id, type, version, occurredAt, actorId, payload, idempotencyKey }.
 * Payloads carry only stable, PII-free identifiers — PII never leaves the
 * domain via events. Consumers call identity public API for private data.
 */
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asUserId, type UserId } from "@shared/contracts/ids";

export type IdentityOnboardingCompletedPayload = {
  userId: UserId;
};

export type IdentityProfilePublicSummaryChangedPayload = {
  userId: UserId;
};

export type OnboardingCompletedEvent = EventEnvelope<
  "identity.onboarding.completed",
  IdentityOnboardingCompletedPayload
>;

export type ProfilePublicSummaryChangedEvent = EventEnvelope<
  "identity.profile.public_summary_changed",
  IdentityProfilePublicSummaryChangedPayload
>;

export type IdentityEvent =
  | OnboardingCompletedEvent
  | ProfilePublicSummaryChangedEvent;

export interface IdentityEventOptions {
  /** ISO timestamp; falls back to the envelope clock when omitted. */
  occurredAt?: string;
  idempotencyKey?: string | null;
  generateId?: () => string;
}

export function identityOnboardingCompletedEvent(
  userId: string,
  options: IdentityEventOptions = {},
): OnboardingCompletedEvent {
  const actor = asUserId(userId);
  return createEventEnvelope(
    {
      type: "identity.onboarding.completed",
      actorId: actor,
      payload: { userId: actor },
      occurredAt: options.occurredAt,
      idempotencyKey: options.idempotencyKey ?? null,
    },
    { generateId: options.generateId },
  );
}

export function identityProfilePublicSummaryChangedEvent(
  userId: string,
  options: IdentityEventOptions = {},
): ProfilePublicSummaryChangedEvent {
  const actor = asUserId(userId);
  return createEventEnvelope(
    {
      type: "identity.profile.public_summary_changed",
      actorId: actor,
      payload: { userId: actor },
      occurredAt: options.occurredAt,
      idempotencyKey: options.idempotencyKey ?? null,
    },
    { generateId: options.generateId },
  );
}
