/**
 * shared/contracts/profile — stable profile application-layer types for cross-boundary use.
 *
 * Both `client/**` and `server/**` may import from here.
 * `client/**` must NOT import directly from `@server/application-v2/profile/...`.
 */
export type {
  OwnerProfileView,
  PublicProfileView,
  ProfileMediaRefView,
  PersonalStatusView,
  ProfileVisibility,
} from "@server/application-v2/use-cases/profile";

export type {
  ProfileApplicationService,
  ProfileApplicationServiceDeps,
} from "@server/application-v2/use-cases/profile";

export type {
  ProfileApplicationResult,
  ProfileApplicationError,
  ProfileApplicationErrorCode,
} from "@server/application-v2/use-cases/profile";
