/**
 * media — mappers
 *
 * Internal record + variant + intent records -> public DTOs. Public projections
 * drop storage key, owner id, byte size, original filename, provider identity
 * and any other private detail. Dedicated PII/leak tests live in
 * __tests__/public-mapper-no-leak.test.ts.
 */
import type {
  MediaAssetDTO,
  MediaVariantDTO,
  UploadIntentDTO,
} from "@shared/contracts/media";
import type {
  MediaAssetRecord,
  MediaVariantRecord,
  UploadIntentRecord,
} from "./internal/record";
import type { UploadTarget } from "./repository";

export function toMediaVariantDTO(record: MediaVariantRecord): MediaVariantDTO {
  return {
    variantType: record.variantType,
    status: record.status,
    url: record.status === "ready" ? record.url : null,
    width: record.width,
    height: record.height,
  };
}

export function toMediaAssetDTO(
  record: MediaAssetRecord,
  variants: readonly MediaVariantRecord[] = [],
): MediaAssetDTO {
  const variantDTOs = variants.map(toMediaVariantDTO);
  const url = record.status === "ready" ? record.cdnUrl ?? record.publicUrl : null;
  return {
    assetId: record.assetId,
    purpose: record.purpose,
    ownerType: record.ownerType,
    status: record.status,
    visibility: record.visibility,
    url,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
    durationSeconds: record.durationSeconds,
    variants: variantDTOs,
  };
}

export function toUploadIntentDTO(
  intent: UploadIntentRecord,
  asset: MediaAssetRecord,
  target: UploadTarget,
  mimeType: string,
): UploadIntentDTO {
  return {
    intentId: intent.intentId,
    assetId: asset.assetId,
    purpose: asset.purpose,
    ownerType: asset.ownerType,
    ownerId: asset.ownerId,
    uploadUrl: target.uploadUrl,
    method: "PUT",
    storageKey: asset.storageKey,
    maxBytes: intent.maxSizeBytes,
    maxFiles: intent.maxFiles,
    allowedMimeTypes: intent.allowedMimeTypes,
    mimeType,
    transport: target.transport,
    expiresAt: target.expiresAt ?? intent.expiresAt,
  };
}
