/**
 * application-v2/use-cases/profile — public API surface
 *
 * Server-side composition entry point. Only callers under `server/` (today:
 * tests; future: an HTTP controller / transport adapter wired in `server/`)
 * may depend on this module — it exposes a runtime service factory plus the
 * view DTOs and the application error contract.
 *
 * The frontend MUST NOT import from `server/*`. Frontend feature adapters
 * depend on:
 *   - `shared/contracts/*` for the DTO/contract shapes,
 *   - a feature-local HTTP/adapter module under `client/src/features-v2/*`,
 * which talks to the future HTTP controller — never to this server-side
 * service factory directly. Internal helpers stay unexposed.
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
  PersonalStatusView,
  ProfileVisibility,
} from "./dto";

export type {
  ProfileApplicationError,
  ProfileApplicationErrorCode,
  ProfileApplicationResult,
} from "./errors";
export { makeProfileError } from "./errors";
