/**
 * Test-only adapter pair that drives `useProfileData` deterministically.
 *
 * Used to put `ProfilePage` into a specific state machine branch (ready,
 * anonymous, error, empty) without touching the real runtime adapters.
 */
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
} from "../../../features-v2/identity";
import type { OwnerProfileView } from "@shared/contracts/profile-view";

type Mode = "ready" | "anonymous";

function readyOwnerView(userId: string): OwnerProfileView {
  return {
    userId,
    profileSlug: null,
    firstName: "Anna",
    lastName: "Kowalska",
    displayName: "Anna Kowalska",
    dateOfBirth: null,
    phone: null,
    bio: null,
    location: null,
    civilStatus: null,
    socialLinks: null,
    personalStatus: null,
    visibility: "public",
    onboardingCompleted: true,
    avatar: null,
    banner: null,
    createdAt: "2026-05-27T00:00:00.000Z",
    updatedAt: "2026-05-27T00:00:00.000Z",
    isOwner: true,
  };
}

function makeAuth(mode: Mode, userId: string): IdentityAuthAdapter {
  const user = mode === "ready" ? { id: userId, email: null } : null;
  return {
    isConfigured: () => true,
    signUp: async () => ({ ok: false, error: { code: "UNKNOWN", message: "x" } }),
    signIn: async () => ({ ok: false, error: { code: "UNKNOWN", message: "x" } }),
    signOut: async () => ({ ok: true, user: null }),
    resetPassword: async () => ({ ok: true, user: null }),
    getCurrentUser: async () => user,
    onAuthStateChange: () => () => undefined,
  };
}

function makeProfile(userId: string): OnboardingProfileAdapter {
  const view = readyOwnerView(userId);
  return {
    isPersistent: () => true,
    async getMyProfileView() {
      return { ok: true, value: view };
    },
    async getPublicProfileView() {
      return {
        ok: false,
        error: { code: "PROFILE_NOT_FOUND", message: "not used in test" },
      };
    },
    async completeOnboarding() {
      return { ok: true, value: view };
    },
    async updateMyProfile() {
      return { ok: true, value: view };
    },
    async updatePersonalStatus() {
      return { ok: true, value: view };
    },
    async clearPersonalStatus() {
      return { ok: true, value: view };
    },
    async attachProfileAvatarRef() {
      return { ok: true, value: view };
    },
    async attachProfileBannerRef() {
      return { ok: true, value: view };
    },
    async attachProfileStatusPhotoRef() {
      return { ok: true, value: view };
    },
  };
}

export function readyOwnerDataDeps(userId = "owner-1") {
  return { authAdapter: makeAuth("ready", userId), profileAdapter: makeProfile(userId) };
}

export function anonymousDataDeps() {
  return { authAdapter: makeAuth("anonymous", ""), profileAdapter: makeProfile("anonymous") };
}
