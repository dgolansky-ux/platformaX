/**
 * media — domain events
 *
 * Published when an asset's lifecycle changes. Payloads carry only stable,
 * PII-free identifiers — consumers (identity, search) call the public API if
 * they need the asset projection.
 */
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
