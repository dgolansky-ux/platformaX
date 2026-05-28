/**
 * application-v2/profile — application service (thin orchestrator).
 *
 * Owns nothing. Composes `IdentityService` + `MediaService` via their
 * public-api and produces the transport-neutral `OwnerProfileView` /
 * `PublicProfileView`. Composition of views and error translation live in
 * their own modules:
 *  - `./profile-view-composer.ts` — pure async helpers that resolve media refs
 *  - `./error-mapper.ts` — IdentityError / MediaError → ProfileApplicationError
 *
 * Constraints (enforced by reading code, tests and arch guards):
 *  - imports only `public-api.ts` from identity and media — no internals.
 *  - owns NO entities or persistence.
 *  - does NOT mutate domain state directly; calls domain services.
 *  - never returns raw domain DTOs to the UI — only the view DTOs in `./dto`.
 *  - never logs PII; safe-error messages only.
 *  - the public application port (`ProfileApplicationPort`) accepts raw
 *    `string` ids (transport boundary). This service brands them via
 *    `asUserId` / `asMediaAssetId` before calling owner-gated domain services
 *    (PX-ID-001 / ADR-012).
 *  - file size capped at 280 lines (`check-application-service-size.mjs`).
 */
import type {
  CompleteOnboardingInput,
  IdentityService,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "@server/domains-v2/identity/public-api";
import type {
  MediaPurpose,
  MediaService,
} from "@server/domains-v2/media/public-api";
import { asMediaAssetId, asUserId } from "@shared/contracts/ids";
import type { ProfileApplicationResult } from "./errors";
import {
  mapIdentityError,
  mapMediaError,
  unauthError,
} from "./error-mapper";
import { composeOwnerView, composePublicView } from "./profile-view-composer";
import type { OwnerProfileView, PublicProfileView } from "./dto";

export type ProfileApplicationServiceDeps = {
  identity: IdentityService;
  media: MediaService;
};

export interface ProfileApplicationService {
  getMyProfileView(
    currentUserId: string,
  ): Promise<ProfileApplicationResult<OwnerProfileView>>;
  getPublicProfileView(
    viewerUserId: string | null,
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

async function attachRef(
  deps: ProfileApplicationServiceDeps,
  currentUserId: string,
  assetId: string,
  purpose: MediaPurpose,
): Promise<ProfileApplicationResult<OwnerProfileView>> {
  if (!currentUserId) return { ok: false, error: unauthError() };
  const branded = asUserId(currentUserId);
  const brandedAssetId = asMediaAssetId(assetId);
  const verified = await deps.media.verifyProfileAssetForAttach(
    branded,
    brandedAssetId,
    purpose,
  );
  if (!verified.ok) return { ok: false, error: mapMediaError(verified.error) };

  let updated;
  if (purpose === "avatar") {
    updated = await deps.identity.attachAvatarMediaRef(branded, brandedAssetId);
  } else if (purpose === "banner") {
    updated = await deps.identity.attachBannerMediaRef(branded, brandedAssetId);
  } else {
    updated = await deps.identity.attachStatusPhotoMediaRef(branded, brandedAssetId);
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
      const result = await deps.identity.getMyProfile(asUserId(currentUserId));
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async getPublicProfileView(viewerUserId, profileUserId) {
      const result = await deps.identity.getPublicProfile(
        viewerUserId ? asUserId(viewerUserId) : null,
        asUserId(profileUserId),
      );
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composePublicView(deps.media, result.value) };
    },

    async completeOnboarding(currentUserId, input) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.completeOnboarding(asUserId(currentUserId), input);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async updateMyProfile(currentUserId, patch) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.updatePrivateProfile(asUserId(currentUserId), patch);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async updatePersonalStatus(currentUserId, input) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.updatePersonalStatus(asUserId(currentUserId), input);
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    async clearPersonalStatus(currentUserId) {
      if (!currentUserId) return { ok: false, error: unauthError() };
      const result = await deps.identity.clearPersonalStatus(asUserId(currentUserId));
      if (!result.ok) return { ok: false, error: mapIdentityError(result.error) };
      return { ok: true, value: await composeOwnerView(deps.media, result.value) };
    },

    attachProfileAvatarRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "avatar"),

    attachProfileBannerRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "banner"),

    attachProfileStatusPhotoRef: (currentUserId, assetId) =>
      attachRef(deps, currentUserId, assetId, "statusPhoto"),
  };
}
