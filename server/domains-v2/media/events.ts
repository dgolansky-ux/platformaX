/**
 * media — domain events
 *
 * Published when an asset's lifecycle changes. Payloads carry only stable,
 * PII-free identifiers — consumers (identity, search) call the public API if
 * they need the asset projection.
 */
import type { EventEnvelope } from "@shared/contracts/event-envelope";

export type MediaUploadIntentCreatedEvent = {
  type: "media.upload.intent_created";
  assetId: string;
  ownerId: string;
  at: string;
};

export type MediaUploadConfirmedEvent = {
  type: "media.upload.confirmed";
  assetId: string;
  ownerId: string;
  at: string;
};

export type MediaEvent =
  | MediaUploadIntentCreatedEvent
  | MediaUploadConfirmedEvent;

/**
 * Canonical envelope shape for a media event crossing a domain boundary
 * (PX-EVENT-001). Media currently publishes in-process via the injected
 * `publish` callback — there is NO transactional outbox yet, so this type marks
 * the target wrapping; it does not imply outbox runtime readiness.
 */
export type MediaEventEnvelope = EventEnvelope<MediaEvent>;
