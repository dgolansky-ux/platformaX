/**
 * features-v2/identity/profile — runtime adapter.
 *
 * Thin wrapper over the `ProfileApplicationService`
 * (`server/application-v2/profile`). The application service is the only place
 * that composes identity + media; this adapter forwards the typed calls and
 * exposes view DTOs to the frontend.
 *
 * Persistence is currently an in-memory boundary (no HTTP transport, no
 * Supabase repository yet — see BLOCKER_REQUIRES_PERSISTENCE_ADAPTER), so state
 * is volatile across reloads. The adapter is honest about this via
 * `isPersistent() === false`.
 *
 * When a real transport or persistence layer is wired, replace the in-memory
 * factories below with the connected adapters; the frontend contract does not
 * change.
 */
import {
  createProfileApplicationService,
  type ProfileApplicationService,
} from "@server/application-v2/profile/public-api";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
} from "@server/domains-v2/identity/public-api";
import {
  createEnvRequiredStoragePort,
  createInMemoryMediaRepository,
  createMediaService,
  type MediaStoragePort,
} from "@server/domains-v2/media/public-api";
import type {
  CompleteOnboardingInput,
  OnboardingProfileAdapter,
  UpdatePrivateProfileInput,
} from "./types";

export type ProfileAdapterDeps = {
  service: ProfileApplicationService;
  isPersistent: boolean;
};

export function createProfileAdapter(
  deps: ProfileAdapterDeps,
): OnboardingProfileAdapter {
  return {
    isPersistent: () => deps.isPersistent,
    completeOnboarding: (userId: string, input: CompleteOnboardingInput) =>
      deps.service.completeOnboarding(userId, input),
    getMyProfileView: (userId: string) => deps.service.getMyProfileView(userId),
    getPublicProfileView: (viewerId: string | null, profileUserId: string) =>
      deps.service.getPublicProfileView(viewerId, profileUserId),
    updateMyProfile: (userId: string, input: UpdatePrivateProfileInput) =>
      deps.service.updateMyProfile(userId, input),
    attachProfileAvatarRef: (userId: string, assetId: string) =>
      deps.service.attachProfileAvatarRef(userId, assetId),
    attachProfileBannerRef: (userId: string, assetId: string) =>
      deps.service.attachProfileBannerRef(userId, assetId),
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

const defaultStorage: MediaStoragePort = createEnvRequiredStoragePort();
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
