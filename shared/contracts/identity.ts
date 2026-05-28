/**
 * shared/contracts/identity — stable identity contract types for cross-boundary use.
 *
 * Both `client/**` and `server/**` may import from here.
 * `client/**` must NOT import directly from `@server/domains-v2/identity/...`.
 *
 * These re-export the canonical definitions from the identity domain public-api
 * so there is a single source of truth; no duplication.
 */
export type {
  UserId,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
  IdentityResult,
  IdentityError,
  IdentityErrorCode,
} from "@server/domains-v2/identity/public-api";

export type {
  CivilStatus,
  SocialLinkKind,
  SocialLinks,
  ProfileVisibility,
  PersonalStatusVisibility,
  PersonalStatusDTO,
  MediaAssetRef as IdentityMediaAssetRef,
} from "@server/domains-v2/identity/public-api";
