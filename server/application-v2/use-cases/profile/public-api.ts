/**
 * use-cases/profile — canonical entry point.
 *
 * Rule: PX-APP-001 (ADR-010). Multi-domain orchestration lives under
 * `server/application-v2/use-cases/<flow>/`. The profile use-case spans
 * identity + media and therefore MUST be addressed from here.
 *
 * The current implementation continues to live at
 * `server/application-v2/profile/` so existing tests and the published
 * `ProfileApplicationPort` shape (`@shared/contracts/profile-view`) remain
 * binary-compatible. This file re-exports that implementation as the
 * canonical surface; new code should import from
 * `@server/application-v2/use-cases/profile/public-api`.
 */
export {
  createProfileApplicationService,
  makeProfileError,
} from "../../profile/public-api";
export type {
  ProfileApplicationService,
  ProfileApplicationServiceDeps,
  OwnerProfileView,
  PublicProfileView,
  ProfileMediaRefView,
  PersonalStatusView,
  ProfileVisibility,
  ProfileApplicationError,
  ProfileApplicationErrorCode,
  ProfileApplicationResult,
} from "../../profile/public-api";
