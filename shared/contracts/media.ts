/**
 * shared/contracts/media — stable media contract types for cross-boundary use.
 *
 * Both `client/**` and `server/**` may import from here.
 * `client/**` must NOT import directly from `@server/domains-v2/media/...`.
 */
export type {
  MediaAssetRef,
  UploadFileMeta,
  MediaErrorCode,
  MediaError,
  MediaResult,
} from "@server/domains-v2/media/public-api";

export type {
  MediaPurpose,
  MediaAssetStatus,
  MediaRefDTO,
  MediaAssetDTO,
  UploadIntentDTO,
  UploadTransportState,
} from "@server/domains-v2/media/public-api";

export type {
  MediaService,
  MediaStoragePort,
} from "@server/domains-v2/media/public-api";
