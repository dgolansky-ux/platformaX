/**
 * application-v2/profile — public API surface
 *
 * The only entry point the frontend feature adapter (or a future HTTP
 * controller) may depend on. Exposes the service factory plus the view DTOs
 * and the application error contract. Internal helpers stay unexposed.
 */
export { createProfileApplicationService } from "./service";
export type {
  ProfileApplicationService,
  ProfileApplicationServiceDeps,
} from "./service";

export type {
  OwnerProfileView,
  PublicProfileView,
  ProfileMediaRefView,
  ProfileVisibility,
} from "./dto";

export type {
  ProfileApplicationError,
  ProfileApplicationErrorCode,
  ProfileApplicationResult,
} from "./errors";
export { makeProfileError } from "./errors";
