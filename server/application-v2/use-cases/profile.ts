/**
 * application-v2/use-cases/profile — canonical cross-domain use-case entry point.
 *
 * ADR-010 / PX-APP-001: flows touching 2+ domains must live under
 * `server/application-v2/use-cases/<flow-name>.ts`. The profile flow composes
 * the identity and media domains into the profile view. Its implementation
 * currently lives in `../profile/` (service + dto + errors); this module is the
 * canonical entry point that consumers (frontend wiring, future HTTP controller)
 * import. Identity and media domain services stay single-owner — orchestration
 * happens here, never inside a domain's own `service.ts`.
 */
export { createProfileApplicationService } from "../profile/public-api";
export type {
  ProfileApplicationService,
  ProfileApplicationServiceDeps,
} from "../profile/public-api";
export type {
  OwnerProfileView,
  PublicProfileView,
  ProfileMediaRefView,
  PersonalStatusView,
  ProfileVisibility,
} from "../profile/public-api";
export type {
  ProfileApplicationError,
  ProfileApplicationErrorCode,
  ProfileApplicationResult,
} from "../profile/public-api";
export { makeProfileError } from "../profile/public-api";
