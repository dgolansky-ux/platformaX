/**
 * media — domain events
 *
 * Published when an asset's lifecycle changes. Rule: PX-EVENT-001 (ADR-009).
 * Events use the shared `EventEnvelope` shape. Payloads carry only stable,
 * PII-free identifiers — consumers (identity, search) call the public API if
 * they need the asset projection.
 */
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import { createEventEnvelope } from "@shared/contracts/event-envelope";
import { asMediaAssetId, asUserId, type MediaAssetId, type UserId } from "@shared/contracts/ids";
import type { MediaPurpose } from "./dto";

export type MediaUploadIntentCreatedPayload = {
  assetId: MediaAssetId;
  ownerId: UserId;
  purpose: MediaPurpose;
};

export type MediaUploadConfirmedPayload = {
  assetId: MediaAssetId;
  ownerId: UserId;
  purpose: MediaPurpose;
};

export type MediaUploadIntentCreatedEvent = EventEnvelope<
  "media.upload.intent_created",
  MediaUploadIntentCreatedPayload
>;

export type MediaUploadConfirmedEvent = EventEnvelope<
  "media.upload.confirmed",
  MediaUploadConfirmedPayload
>;

export type MediaEvent =
  | MediaUploadIntentCreatedEvent
  | MediaUploadConfirmedEvent;

export interface MediaEventInput {
  assetId: string;
  ownerId: string;
  purpose: MediaPurpose;
  occurredAt?: string;
  idempotencyKey?: string | null;
  generateId?: () => string;
}

function buildPayload(input: MediaEventInput): {
  payload: { assetId: MediaAssetId; ownerId: UserId; purpose: MediaPurpose };
  actorId: UserId;
} {
  const actor = asUserId(input.ownerId);
  return {
    actorId: actor,
    payload: {
      assetId: asMediaAssetId(input.assetId),
      ownerId: actor,
      purpose: input.purpose,
    },
  };
}

export function mediaUploadIntentCreatedEvent(
  input: MediaEventInput,
): MediaUploadIntentCreatedEvent {
  const { payload, actorId } = buildPayload(input);
  return createEventEnvelope(
    {
      type: "media.upload.intent_created",
      actorId,
      payload,
      occurredAt: input.occurredAt,
      idempotencyKey: input.idempotencyKey ?? null,
    },
    { generateId: input.generateId },
  );
}

export function mediaUploadConfirmedEvent(
  input: MediaEventInput,
): MediaUploadConfirmedEvent {
  const { payload, actorId } = buildPayload(input);
  return createEventEnvelope(
    {
      type: "media.upload.confirmed",
      actorId,
      payload,
      occurredAt: input.occurredAt,
      idempotencyKey: input.idempotencyKey ?? null,
    },
    { generateId: input.generateId },
  );
}
