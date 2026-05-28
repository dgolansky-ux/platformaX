/**
 * identity — public API surface
 *
 * The only modules in this file that other domains may depend on:
 *  - factory: `createIdentityService`
 *  - types:    contracts, public DTO, events, validation limits, repository
 *             port interface, viewer-role policy enum
 *
 * The in-memory repository *implementation* (`createInMemoryIdentityProfileRepository`)
 * is intentionally NOT public — composition imports it from `./repository`
 * directly (see `@shared/wiring`). The repository *port interface* is re-exported
 * via `./ports`; owner-only return types via `./private-dto`; validation limits
 * via `./limits`. None of these are `./internal/*` paths, so the boundary guard
 * stays satisfied while internal modules remain the single source of truth.
 */
export { createIdentityService } from "./service";
export type {
  IdentityService,
  IdentityServiceDeps,
  IdentityEventPublisher,
  IdentityClock,
  IdentityRelationshipResolver,
} from "./service";

export type {
  IdentityProfileRepository,
  CreateProfileRecordInput,
  UpdateProfileRecordPatch,
} from "./ports";

export type {
  PublicProfileDTO,
  ProfileVisibility,
  PersonalStatusVisibility,
  PersonalStatusDTO,
  CivilStatus,
  SocialLinkKind,
  SocialLinks,
  MediaAssetRef,
} from "./dto";

export type { PrivateProfileDTO } from "./private-dto";

export type {
  UserId,
  CompleteOnboardingInput,
  UpdatePrivateProfileInput,
  UpdatePersonalStatusInput,
  IdentityResult,
  IdentityError,
  IdentityErrorCode,
} from "./contracts";

export type { ViewerRole } from "./policy";
export {
  canReadPrivateProfile,
  canReadPublicProfile,
  canUpdatePrivateProfile,
  canCompleteOnboarding,
} from "./policy";

export { IDENTITY_VALIDATION_LIMITS } from "./limits";

export type {
  IdentityEvent,
  OnboardingCompletedEvent,
  ProfilePublicSummaryChangedEvent,
} from "./events";
