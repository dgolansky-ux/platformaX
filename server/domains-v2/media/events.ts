/**
 * media — domain events
 *
 * Published when an asset's lifecycle changes. Payloads carry only stable,
 * PII-free identifiers — consumers (identity, search, feeds) call the public
 * API if they need the asset projection.
 */
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import type { MediaOwnerType } from "@shared/contracts/media";

export type MediaUploadIntentCreatedEvent = {
  type: "media.upload.intent_created";
  assetId: string;
  intentId: string;
  ownerId: string;
  ownerType: MediaOwnerType;
  at: string;
};

export type MediaUploadConfirmedEvent = {
  type: "media.upload.confirmed";
  assetId: string;
  intentId: string;
  ownerId: string;
  ownerType: MediaOwnerType;
  at: string;
};

export type MediaAssetDeletedEvent = {
  type: "media.asset.deleted";
  assetId: string;
  ownerId: string;
  ownerType: MediaOwnerType;
  at: string;
};

export type MediaEvent =
  | MediaUploadIntentCreatedEvent
  | MediaUploadConfirmedEvent
  | MediaAssetDeletedEvent;

export type MediaEventEnvelope = EventEnvelope<MediaEvent>;
