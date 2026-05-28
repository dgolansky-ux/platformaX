/**
 * media — mappers
 *
 * Internal record -> DTOs. The public projection drops storage key, owner id,
 * byte size and the storage backend identity. The owner-only upload intent
 * projection keeps `storageKey` / `uploadUrl` / `maxBytes` because those are
 * required by the owner client to push bytes directly to storage; it is only
 * ever returned from owner-gated commands.
 *
 * Dedicated leak tests live in __tests__/public-mapper-no-leak.test.ts.
 */
import type { MediaAssetDTO, OwnerUploadIntentDTO } from "./dto";
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

export function toOwnerUploadIntentDTO(
  record: MediaAssetRecord,
  target: UploadTarget,
  maxBytes: number,
): OwnerUploadIntentDTO {
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

/**
 * @deprecated Use `toOwnerUploadIntentDTO`. Kept as a thin alias so external
 * callers that imported the old name compile during the transitional window.
 */
export const toUploadIntentDTO = toOwnerUploadIntentDTO;
