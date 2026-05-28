/**
 * shared/wiring/profile-wiring — in-memory composition boundary for the profile feature.
 *
 * This module is the ONLY place allowed to import `@server/*` factories for
 * composition in the current in-memory boundary phase.  When a real HTTP/RPC
 * transport is wired, replace this file with an HTTP client adapter; the
 * `OnboardingProfileAdapter` contract does not change.
 *
 * `client/**` imports `profileAdapter` / `createProfileAdapter` from here
 * (via `@client/features-v2/identity/profile`) so it NEVER directly touches
 * `@server/*` paths.
 */
import {
  createProfileApplicationService,
} from "@server/application-v2/use-cases/profile";
import { createIdentityService } from "@server/domains-v2/identity/public-api";
import { createInMemoryIdentityProfileRepository } from "@server/domains-v2/identity/repository";
import { createMediaService } from "@server/domains-v2/media/public-api";
import {
  createEnvRequiredStoragePort,
  createInMemoryMediaRepository,
} from "@server/domains-v2/media/repository";
import type { ProfileApplicationService } from "@shared/contracts/profile";
import type {
  CompleteOnboardingInput,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "@shared/contracts/identity";
import type {
  OwnerProfileView,
  ProfileApplicationResult,
  PublicProfileView,
} from "@shared/contracts/profile";

export type CompleteOnboardingResult = ProfileApplicationResult<OwnerProfileView>;
export type GetMyProfileViewResult = ProfileApplicationResult<OwnerProfileView>;
export type GetPublicProfileViewResult = ProfileApplicationResult<PublicProfileView>;
export type UpdateMyProfileResult = ProfileApplicationResult<OwnerProfileView>;
export type AttachProfileMediaRefResult = ProfileApplicationResult<OwnerProfileView>;

export type OnboardingProfileAdapter = {
  isPersistent(): boolean;
  completeOnboarding(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
  getMyProfileView(userId: string): Promise<GetMyProfileViewResult>;
  getPublicProfileView(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<GetPublicProfileViewResult>;
  updateMyProfile(
    userId: string,
    input: UpdatePrivateProfileInput,
  ): Promise<UpdateMyProfileResult>;
  updatePersonalStatus(
    userId: string,
    input: UpdatePersonalStatusInput,
  ): Promise<UpdateMyProfileResult>;
  clearPersonalStatus(userId: string): Promise<UpdateMyProfileResult>;
  attachProfileAvatarRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
  attachProfileBannerRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
  attachProfileStatusPhotoRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
};

export type ProfileAdapterDeps = {
  service: ProfileApplicationService;
  isPersistent: boolean;
};

export function createProfileAdapter(
  deps: ProfileAdapterDeps,
): OnboardingProfileAdapter {
  return {
    isPersistent: () => deps.isPersistent,
    completeOnboarding: (userId, input) =>
      deps.service.completeOnboarding(userId, input),
    getMyProfileView: (userId) => deps.service.getMyProfileView(userId),
    getPublicProfileView: (viewerId, profileUserId) =>
      deps.service.getPublicProfileView(viewerId, profileUserId),
    updateMyProfile: (userId, input) =>
      deps.service.updateMyProfile(userId, input),
    updatePersonalStatus: (userId, input) =>
      deps.service.updatePersonalStatus(userId, input),
    clearPersonalStatus: (userId) => deps.service.clearPersonalStatus(userId),
    attachProfileAvatarRef: (userId, assetId) =>
      deps.service.attachProfileAvatarRef(userId, assetId),
    attachProfileBannerRef: (userId, assetId) =>
      deps.service.attachProfileBannerRef(userId, assetId),
    attachProfileStatusPhotoRef: (userId, assetId) =>
      deps.service.attachProfileStatusPhotoRef(userId, assetId),
  };
}

/**
 * Default in-memory boundary shared across the app. Volatile — wipes on reload.
 * This is the explicit boundary while no transport/persistence exists.
 * Onboarding and the profile view share this default so a completed onboarding
 * round-trips into `/profile` within the same session.
 */
const defaultIdentity = createIdentityService({
  repository: createInMemoryIdentityProfileRepository(),
});

const defaultStorage = createEnvRequiredStoragePort();
const defaultMedia = createMediaService({
  repository: createInMemoryMediaRepository(),
  storage: defaultStorage,
});

const defaultApplicationService = createProfileApplicationService({
  identity: defaultIdentity,
  media: defaultMedia,
});

export const profileAdapter: OnboardingProfileAdapter = createProfileAdapter({
  service: defaultApplicationService,
  isPersistent: false,
});
