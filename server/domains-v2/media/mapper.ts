/**
 * media — mappers
 *
 * Internal record -> public DTOs. The public projection drops storage key,
 * owner id, byte size and the storage backend identity. Dedicated PII/leak
 * tests live in __tests__/public-mapper-no-leak.test.ts.
 */
import type { MediaAssetDTO, UploadIntentDTO } from "./dto";
import type { MediaAssetRecord } from "./internal/record";
import type { UploadTarget } from "./repository";

export function toMediaAssetDTO(record: MediaAssetRecord): MediaAssetDTO {
  return {
    assetId: record.assetId,
    purpose: record.purpose,
    status: record.status,
    url: record.status === "ready" ? record.publicUrl : null,
    mimeType: record.mimeType,
    width: record.width,
    height: record.height,
  };
}

export function toUploadIntentDTO(
  record: MediaAssetRecord,
  target: UploadTarget,
  maxBytes: number,
): UploadIntentDTO {
  return {
    assetId: record.assetId,
    purpose: record.purpose,
    uploadUrl: target.uploadUrl,
    method: "PUT",
    storageKey: record.storageKey,
    maxBytes,
    mimeType: record.mimeType,
    transport: target.transport,
    expiresAt: target.expiresAt,
  };
}
