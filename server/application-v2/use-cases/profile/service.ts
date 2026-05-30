/**
 * application-v2/use-cases/profile — application service
 *
 * Thin composition layer: orchestrates identity + media public APIs into a
 * single profile view DTO and translates raw domain errors into the small,
 * frontend-safe ProfileApplicationError code-set.
 *
 * Constraints (enforced by reading code, tests and arch guards):
 *  - imports only `public-api.ts` from identity and media — no internals.
 *  - owns NO entities or persistence.
 *  - does NOT mutate domain state directly; calls domain services.
 *  - never returns raw domain DTOs to the UI — only the view DTOs in `./dto`.
 *  - never logs PII; safe-error messages only.
 */
import type {
  CompleteOnboardingInput,
  IdentityError,
  IdentityService,
  PersonalStatusDTO,
  PrivateProfileDTO,
  PublicProfileDTO,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "@server/domains-v2/identity/public-api";
import type {
  MediaAssetDTO,
  MediaError,
  MediaPurpose,
  MediaService,
} from "@server/domains-v2/media/public-api";
import {
  makeProfileError,
  type ProfileApplicationError,
  type ProfileApplicationResult,
} from "./errors";
import type {
  OwnerProfileView,
  PersonalStatusView,
  ProfileMediaRefView,
  PublicProfileView,
} from "./dto";

export type ProfileApplicationServiceDeps = {
  identity: IdentityService;
  media: MediaService;
};

export interface ProfileApplicationService {
  getMyProfileView(
    currentUserId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  getPublicProfileView(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<ProfileApplicationResult<PublicProfileView>>;
  completeOnboarding(
    currentUserId: string,
    input: CompleteOnboardingInput,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  updateMyProfile(
    currentUserId: string,
    patch: UpdatePrivateProfileInput,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  updatePersonalStatus(
    currentUserId: string,
    input: UpdatePersonalStatusInput,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  clearPersonalStatus(
    currentUserId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  attachProfileAvatarRef(
    currentUserId: string,
    assetId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  attachProfileBannerRef(
    currentUserId: string,
    assetId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  attachProfileStatusPhotoRef(
    currentUserId: string,
    assetId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
}

function displayNameOf(first: string | null, last: string | null): string {
  const parts: string[] = [];
  if (first && first.trim().length > 0) parts.push(first.trim());
  if (last && last.trim().length > 0) parts.push(last.trim());
  return parts.length > 0 ? parts.join(" ") : "Użytkownik";
}

function unauthError(): ProfileApplicationError {
  return makeProfileError("UNAUTHENTICATED", "Wymagane zalogowanie.");
}

function mapIdentityError(err: IdentityError): ProfileApplicationError {
  switch (err.code) {
    case "NOT_FOUND":
      return makeProfileError("PROFILE_NOT_FOUND", "Profil nie istnieje.");
    case "FORBIDDEN":
      return makeProfileError("PROFILE_FORBIDDEN", "Brak uprawnień do tego profilu.");
    case "INVALID_INPUT":
      return makeProfileError(
        "PROFILE_VALIDATION_FAILED",
        "Niepoprawne dane profilu.",
        err.fields,
      );
    case "ALREADY_COMPLETED":
      return makeProfileError(
        "ONBOARDING_ALREADY_COMPLETED",
        "Onboarding został już ukończony.",
      );
  }
}

function mapMediaError(err: MediaError): ProfileApplicationError {
  switch (err.code) {
    case "NOT_FOUND":
      return makeProfileError("MEDIA_ASSET_NOT_FOUND", "Zasób nie istnieje.");
    case "FORBIDDEN":
      return makeProfileError("MEDIA_ASSET_FORBIDDEN", "Brak uprawnień do zasobu.");
    case "INVALID_INPUT":
    case "INVALID_PURPOSE":
    case "INVALID_OWNER_TYPE":
    case "UNSUPPORTED_TYPE":
      return makeProfileError(
        "MEDIA_ASSET_TYPE_MISMATCH",
        "Typ zasobu nie pasuje do żądanej referencji.",
      );
    case "NOT_READY":
    case "STORAGE_UNAVAILABLE":
    case "TOO_LARGE":
    case "TOO_MANY_FILES":
    case "INTENT_EXPIRED":
    case "INTENT_ALREADY_USED":
      return makeProfileError(
        "MEDIA_ASSET_NOT_READY",
        "Zasób nie jest jeszcze gotowy do podpięcia.",
      );
  }
}

function refViewFromAsset(asset: MediaAssetDTO): ProfileMediaRefView {
  return { assetId: asset.assetId, url: asset.url };
}

async function resolveRefView(
  media: MediaService,
  assetId: string | undefined | null,
): Promise<ProfileMediaRefView | null> {
  if (!assetId) return null;
  const result = await media.getPublicMediaUrl({ assetId });
  if (!result.ok) return { assetId, url: null };
  return refViewFromAsset(result.value);
}

async function statusView(
  media: MediaService,
  status: PersonalStatusDTO | null,
): Promise<PersonalStatusView | null> {
  if (!status) return null;
  const photo = await resolveRefView(media, status.photoMediaRef?.assetId);
  return {
    text: status.text,
    emoji: status.emoji,
    description: status.description,
    visibility: status.visibility,
    photo,
  };
}

async function composeOwnerView(
  media: MediaService,
  dto: PrivateProfileDTO,
): Promise<OwnerProfileView> {
  const [avatar, banner, personalStatus] = await Promise.all([
    resolveRefView(media, dto.avatarMediaRef?.assetId),
    resolveRefView(media, dto.bannerMediaRef?.assetId),
    statusView(media, dto.personalStatus),
  ]);
  return {
    userId: dto.userId,
    profileSlug: dto.profileSlug,
    firstName: dto.firstName,
    lastName: dto.lastName,
    displayName: displayNameOf(dto.firstName, dto.lastName),
    dateOfBirth: dto.dateOfBirth,
    phone: dto.phone,
    bio: dto.bio,
    location: dto.location,
    civilStatus: dto.civilStatus,
    socialLinks: dto.socialLinks,
    personalStatus,
    visibility: dto.visibility,
    onboardingCompleted: dto.onboardingCompleted,
    avatar,
    banner,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    isOwner: true,
  };
}

async function composePublicView(
  media: MediaService,
  dto: PublicProfileDTO,
): Promise<PublicProfileView> {
  const [avatar, banner, personalStatus] = await Promise.all([
    resolveRefView(media, dto.avatarMediaRef?.assetId),
    resolveRefView(media, dto.bannerMediaRef?.assetId),
    statusView(media, dto.personalStatus),
  ]);
  return {
    userId: dto.userId,
    profileSlug: dto.profileSlug,
    displayName: dto.displayName,
    bio: dto.bio,
    location: dto.location,
    civilStatus: dto.civilStatus,
    socialLinks: dto.socialLinks,
    personalStatus,
    visibility: dto.visibility,
    onboardingCompleted: dto.onboardingCompleted,
    avatar,
    banner,
    isOwner: false,
  };
}

async function attachRef(
  deps: ProfileApplicationServiceDeps,
  currentUserId: string,
  assetId: string,
  purpose: MediaPurpose,
): Promise<ProfileApplicationResult<OwnerProfileView>> {
  if (!currentUserId) return { ok: false, error: unauthError() };
  const verified = await deps.media.verifyOwnedAssetForAttach(
    currentUserId,
    assetId,
    purpose,
  );
  if (!verified.ok) return { ok: false, error: mapMediaError(verified.error) };

  let updated;
  if (purpose === "profile_avatar") {
    updated = await deps.identity.attachAvatarMediaRef(currentUserId, assetId);
  } else if (purpose === "profile_banner") {
    updated = await deps.identity.attachBannerMediaRef(currentUserId, assetId);
  } else {
    updated = await deps.identity.attachStatusPhotoMediaRef(currentUserId, assetId);
  }
  if (!updated.ok) return { ok: false, error: mapIdentityError(updated.error) };
  return { ok: true, value: await composeOwnerView(deps.media, updated.value) };
}

export function createProfileApplicationService(
  deps: ProfileApplicationServiceDeps,
): ProfileApplicationService {
  return {
    async getMyProfileView(currentUserId) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.getMyProfile(currentUserId);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async getPublicProfileView(viewerId, profileUserId) {
      const result = await deps.identity.getPublicProfile(viewerId, profileUserId);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composePublicView(deps.media, result.value) };
    },

    async completeOnboarding(currentUserId, input) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.completeOnboarding(currentUserId, input);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async updateMyProfile(currentUserId, patch) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.updatePrivateProfile(currentUserId, patch);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async updatePersonalStatus(currentUserId, input) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.updatePersonalStatus(currentUserId, input);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async clearPersonalStatus(currentUserId) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.clearPersonalStatus(currentUserId);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    attachProfileAvatarRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "profile_avatar"),

    attachProfileBannerRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "profile_banner"),

    attachProfileStatusPhotoRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "profile_bio_media"),
  };
}
