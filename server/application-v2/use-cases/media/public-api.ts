/**
 * application-v2/use-cases/media — public API.
 *
 * Stable surface the transport layer (future HTTP/RPC controller) and tests
 * depend on. Other application-v2 use-cases SHOULD compose with this rather
 * than duplicate cross-domain media orchestration.
 */
export {
  createMediaApplicationService,
} from "./service";

export type {
  MediaApplicationService,
  MediaApplicationServiceDeps,
  SurfaceUploadInput,
  GenericUploadInput,
  CompleteUploadInput,
} from "./service";

export type {
  MediaPermissionsPort,
  ChannelLeadPermission,
} from "./permissions";

export { createDenyAllMediaPermissionsPort } from "./permissions";

export type {
  MediaApplicationError,
  MediaApplicationErrorCode,
  MediaApplicationResult,
} from "./errors";

export { makeMediaAppError, mapMediaDomainError } from "./errors";
