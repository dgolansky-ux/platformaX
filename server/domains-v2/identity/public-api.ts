/**
 * identity — public API surface
 *
 * The only modules in this file that other domains may depend on:
 *  - factory: `createIdentityService`
 *  - factory: `createInMemoryIdentityProfileRepository`
 *  - types:    contracts, public DTO, events, validation limits, repository
 *             interface, viewer-role policy enum
 *
 * Owner-only return types (PrivateProfileDTO) are re-exported here ONLY as a
 * type. Consumers that need it have already authenticated the owner (e.g. the
 * onboarding adapter for the current user). Other domains should compose
 * PublicProfileDTO instead.
 *
 * Internal modules (repository.ts implementation details, mapper, validation,
 * record) remain unexposed.
 */
export { createIdentityService } from "./service";
export type {
  IdentityService,
  IdentityServiceDeps,
  IdentityEventPublisher,
  IdentityClock,
  IdentityRelationshipResolver,
} from "./service";

export {
  createInMemoryIdentityProfileRepository,
} from "./repository";
export type {
  IdentityProfileRepository,
  CreateProfileRecordInput,
  UpdateProfileRecordPatch,
} from "./repository";

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

export type { PrivateProfileDTO } from "./internal/private-profile-dto";

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

export { IDENTITY_VALIDATION_LIMITS } from "./internal/validation";

export type {
  IdentityEvent,
  OnboardingCompletedEvent,
  ProfilePublicSummaryChangedEvent,
} from "./events";
