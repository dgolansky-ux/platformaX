/**
 * features-v2/identity/profile — runtime adapter (client-only, split-ready).
 *
 * The frontend MUST NOT bundle server runtime. This module exposes:
 *  - `createProfileAdapter(port)` — wraps any `ProfileApplicationPort` (e.g. a
 *    future HTTP transport) into the frontend `OnboardingProfileAdapter`.
 *  - `profileAdapter` — the default adapter. There is no HTTP transport yet, so
 *    it is an explicit client-only stub (`CLIENT_PROFILE_TRANSPORT_NOT_CONNECTED`)
 *    that returns a typed `PROFILE_TRANSPORT_NOT_CONNECTED` result and reports
 *    `isPersistent() === false`. It never composes identity/media services in the
 *    browser and never fakes persistence.
 *
 * The real identity + media composition lives server-side in
 * `server/application-v2/profile` and is tested there.
 */
import type {
  ProfileApplicationPort,
  ProfileApplicationResult,
} from "@shared/contracts/profile-view";
import type { OnboardingProfileAdapter } from "./types";

export type ProfileAdapterDeps = {
  port: ProfileApplicationPort;
  isPersistent: boolean;
};

export function createProfileAdapter(
  deps: ProfileAdapterDeps,
): OnboardingProfileAdapter {
  const { port } = deps;
  return {
    isPersistent: () => deps.isPersistent,
    completeOnboarding: (userId, input) => port.completeOnboarding(userId, input),
    getMyProfileView: (userId) => port.getMyProfileView(userId),
    getPublicProfileView: (viewerId, profileUserId) =>
      port.getPublicProfileView(viewerId, profileUserId),
    updateMyProfile: (userId, input) => port.updateMyProfile(userId, input),
    updatePersonalStatus: (userId, input) =>
      port.updatePersonalStatus(userId, input),
    clearPersonalStatus: (userId) => port.clearPersonalStatus(userId),
    attachProfileAvatarRef: (userId, assetId) =>
      port.attachProfileAvatarRef(userId, assetId),
    attachProfileBannerRef: (userId, assetId) =>
      port.attachProfileBannerRef(userId, assetId),
    attachProfileStatusPhotoRef: (userId, assetId) =>
      port.attachProfileStatusPhotoRef(userId, assetId),
  };
}

/** Marker for the disconnected default — there is no HTTP transport wired yet. */
export const CLIENT_PROFILE_TRANSPORT_NOT_CONNECTED =
  "CLIENT_PROFILE_TRANSPORT_NOT_CONNECTED" as const;

function notConnected(): ProfileApplicationResult<never> {
  return {
    ok: false,
    error: {
      code: "PROFILE_TRANSPORT_NOT_CONNECTED",
      message:
        "Profil nie jest jeszcze połączony z serwerem. Transport zostanie podłączony w kolejnym kroku.",
    },
  };
}

/**
 * Client-only port stub. Every call honestly reports that the profile transport
 * is not connected — no server runtime is bundled and nothing is persisted.
 */
export function createNotConnectedProfilePort(): ProfileApplicationPort {
  return {
    getMyProfileView: async () => notConnected(),
    getPublicProfileView: async () => notConnected(),
    completeOnboarding: async () => notConnected(),
    updateMyProfile: async () => notConnected(),
    updatePersonalStatus: async () => notConnected(),
    clearPersonalStatus: async () => notConnected(),
    attachProfileAvatarRef: async () => notConnected(),
    attachProfileBannerRef: async () => notConnected(),
    attachProfileStatusPhotoRef: async () => notConnected(),
  };
}

export const profileAdapter: OnboardingProfileAdapter = createProfileAdapter({
  port: createNotConnectedProfilePort(),
  isPersistent: false,
});
