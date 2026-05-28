/**
 * features-v2/identity/profile — runtime adapter
 *
 * Status: `MOCK_LOCAL_ONLY` / `BACKEND_NOT_STARTED`.
 *
 * The client UI depends on a single `OnboardingProfileAdapter` contract
 * (`@shared/contracts/profile`). This file ships a **mock** implementation that
 * holds the in-progress profile in a module-scoped `Map`, so the onboarding
 * shell and profile screens can run end-to-end without an HTTP transport,
 * without writing to browser-storage APIs, and without importing any
 * `@server/*` runtime. `isPersistent()` returns `false` so the UI surfaces the
 * volatile state honestly.
 *
 * When a real HTTP/RPC transport is wired, replace this file with an HTTP
 * client adapter implementing the same contract — UI screens do not change.
 */
import type {
  CompleteOnboardingResult,
  GetMyProfileViewResult,
  OnboardingProfileAdapter,
  OwnerProfileView,
  PersonalStatusView,
  ProfileApplicationError,
  PublicProfileView,
  UpdateMyProfileResult,
} from "@shared/contracts/profile";
import type {
  CompleteOnboardingInput,
  PersonalStatusVisibility,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "@shared/contracts/identity";
import { makeProfileError } from "@shared/contracts/profile";

const MOCK_NOW = "2026-05-28T00:00:00.000Z";

function displayNameOf(firstName: string | null, lastName: string | null): string {
  const parts: string[] = [];
  if (firstName && firstName.trim().length > 0) parts.push(firstName.trim());
  if (lastName && lastName.trim().length > 0) parts.push(lastName.trim());
  return parts.length > 0 ? parts.join(" ") : "Użytkownik";
}

function unauthError(): ProfileApplicationError {
  return makeProfileError("UNAUTHENTICATED", "Wymagane zalogowanie.");
}

function notFoundError(): ProfileApplicationError {
  return makeProfileError("PROFILE_NOT_FOUND", "Profil nie istnieje.");
}

function alreadyCompletedError(): ProfileApplicationError {
  return makeProfileError(
    "ONBOARDING_ALREADY_COMPLETED",
    "Onboarding został już ukończony.",
  );
}

/**
 * Build an empty owner view scaffold. The mock fills it as the UI mutates
 * fields; private-only fields like `phone` and `dateOfBirth` live here exactly
 * like in the real backend, so the UI types behave the same.
 */
function emptyOwnerView(userId: string): OwnerProfileView {
  return {
    userId,
    profileSlug: null,
    firstName: null,
    lastName: null,
    displayName: "Użytkownik",
    dateOfBirth: null,
    phone: null,
    bio: null,
    location: null,
    civilStatus: null,
    socialLinks: null,
    personalStatus: null,
    visibility: "public",
    onboardingCompleted: false,
    avatar: null,
    banner: null,
    createdAt: MOCK_NOW,
    updatedAt: MOCK_NOW,
    isOwner: true,
  };
}

function applyOnboarding(
  base: OwnerProfileView,
  input: CompleteOnboardingInput,
): OwnerProfileView {
  return {
    ...base,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: displayNameOf(input.firstName, input.lastName),
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    bio: input.bio ?? base.bio,
    avatar: input.avatarMediaRef ? { assetId: input.avatarMediaRef.assetId, url: null } : base.avatar,
    onboardingCompleted: true,
    updatedAt: MOCK_NOW,
  };
}

function applyPatch(
  base: OwnerProfileView,
  patch: UpdatePrivateProfileInput,
): OwnerProfileView {
  return {
    ...base,
    firstName: patch.firstName ?? base.firstName,
    lastName: patch.lastName ?? base.lastName,
    displayName: displayNameOf(
      patch.firstName ?? base.firstName,
      patch.lastName ?? base.lastName,
    ),
    dateOfBirth: patch.dateOfBirth ?? base.dateOfBirth,
    phone: patch.phone ?? base.phone,
    bio: patch.bio ?? base.bio,
    location: patch.location ?? base.location,
    profileSlug: patch.profileSlug ?? base.profileSlug,
    civilStatus: patch.civilStatus ?? base.civilStatus,
    socialLinks: patch.socialLinks ?? base.socialLinks,
    visibility: patch.visibility ?? base.visibility,
    avatar: patch.avatarMediaRef
      ? { assetId: patch.avatarMediaRef.assetId, url: null }
      : base.avatar,
    banner: patch.bannerMediaRef
      ? { assetId: patch.bannerMediaRef.assetId, url: null }
      : base.banner,
    updatedAt: MOCK_NOW,
  };
}

function statusViewFromInput(input: UpdatePersonalStatusInput): PersonalStatusView {
  return {
    text: input.text,
    emoji: input.emoji ?? null,
    description: input.description ?? null,
    visibility: input.visibility as PersonalStatusVisibility,
    photo: input.photoMediaRef
      ? { assetId: input.photoMediaRef.assetId, url: null }
      : null,
  };
}

function publicViewOf(owner: OwnerProfileView): PublicProfileView {
  return {
    userId: owner.userId,
    profileSlug: owner.profileSlug,
    displayName: owner.displayName,
    bio: owner.bio,
    location: owner.location,
    civilStatus: owner.civilStatus,
    socialLinks: owner.socialLinks,
    personalStatus: owner.personalStatus,
    visibility: owner.visibility,
    onboardingCompleted: owner.onboardingCompleted,
    avatar: owner.avatar,
    banner: owner.banner,
    isOwner: false,
  };
}

type Store = Map<string, OwnerProfileView>;

function requireUser(userId: string): ProfileApplicationError | null {
  return userId ? null : unauthError();
}

async function doComplete(
  store: Store,
  userId: string,
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const err = requireUser(userId);
  if (err) return { ok: false, error: err };
  const existing = store.get(userId);
  if (existing?.onboardingCompleted) {
    return { ok: false, error: alreadyCompletedError() };
  }
  const view = applyOnboarding(existing ?? emptyOwnerView(userId), input);
  store.set(userId, view);
  return { ok: true, value: view };
}

async function doGetOwner(
  store: Store,
  userId: string,
): Promise<GetMyProfileViewResult> {
  const err = requireUser(userId);
  if (err) return { ok: false, error: err };
  const view = store.get(userId);
  if (!view) return { ok: false, error: notFoundError() };
  return { ok: true, value: view };
}

async function doUpdate(
  store: Store,
  userId: string,
  patch: UpdatePrivateProfileInput,
): Promise<UpdateMyProfileResult> {
  const err = requireUser(userId);
  if (err) return { ok: false, error: err };
  const existing = store.get(userId);
  if (!existing) return { ok: false, error: notFoundError() };
  const updated = applyPatch(existing, patch);
  store.set(userId, updated);
  return { ok: true, value: updated };
}

async function doMutateOwner(
  store: Store,
  userId: string,
  mutate: (current: OwnerProfileView) => OwnerProfileView,
): Promise<UpdateMyProfileResult> {
  const err = requireUser(userId);
  if (err) return { ok: false, error: err };
  const existing = store.get(userId);
  if (!existing) return { ok: false, error: notFoundError() };
  const updated = mutate(existing);
  store.set(userId, updated);
  return { ok: true, value: updated };
}

const emptyStatus: PersonalStatusView = {
  text: "",
  emoji: null,
  description: null,
  visibility: "public",
  photo: null,
};

/**
 * Build a fresh mock adapter with its own in-memory store. Useful in tests so
 * each case starts from a clean slate. The default `profileAdapter` exported
 * below uses a single module-scoped store shared across the app session.
 */
export function createMockProfileAdapter(): OnboardingProfileAdapter {
  const store: Store = new Map();
  return {
    isPersistent: () => false,
    completeOnboarding: (userId, input) => doComplete(store, userId, input),
    getMyProfileView: (userId) => doGetOwner(store, userId),
    async getPublicProfileView(_viewerId, profileUserId) {
      const owner = store.get(profileUserId);
      if (!owner) return { ok: false, error: notFoundError() };
      return { ok: true, value: publicViewOf(owner) };
    },
    updateMyProfile: (userId, patch) => doUpdate(store, userId, patch),
    updatePersonalStatus: (userId, input) =>
      doMutateOwner(store, userId, (cur) => ({
        ...cur,
        personalStatus: statusViewFromInput(input),
        updatedAt: MOCK_NOW,
      })),
    clearPersonalStatus: (userId) =>
      doMutateOwner(store, userId, (cur) => ({
        ...cur,
        personalStatus: null,
        updatedAt: MOCK_NOW,
      })),
    attachProfileAvatarRef: (userId, assetId) =>
      doMutateOwner(store, userId, (cur) => ({
        ...cur,
        avatar: { assetId, url: null },
        updatedAt: MOCK_NOW,
      })),
    attachProfileBannerRef: (userId, assetId) =>
      doMutateOwner(store, userId, (cur) => ({
        ...cur,
        banner: { assetId, url: null },
        updatedAt: MOCK_NOW,
      })),
    attachProfileStatusPhotoRef: (userId, assetId) =>
      doMutateOwner(store, userId, (cur) => ({
        ...cur,
        personalStatus: {
          ...(cur.personalStatus ?? emptyStatus),
          photo: { assetId, url: null },
        },
        updatedAt: MOCK_NOW,
      })),
  };
}

/**
 * Default session-scoped mock adapter. Onboarding and profile screens share
 * the same store within a tab, so a completed onboarding round-trips into
 * `/profile`. State wipes on reload — `isPersistent()` returns `false`.
 */
export const profileAdapter: OnboardingProfileAdapter = createMockProfileAdapter();
