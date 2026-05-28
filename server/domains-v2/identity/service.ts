/**
 * identity — service (use-cases)
 *
 * Personal-profile use-cases: onboarding, getMyProfile/updatePrivateProfile,
 * personal-status update/clear, attach* media refs, getPublicProfile.
 *
 * Depends on `IdentityProfileRepository` (interface), policy, mapper, patch
 * builders and validation. No DB client — concrete repository adapter is
 * injected. Identity never imports the media domain; media-asset ownership
 * validation lives in application-v2/profile, which calls
 * `media.verifyProfileAssetForAttach` before invoking attach* methods here.
 *
 * Boundary types (PX-ID-001 / ADR-012): public service signatures use the
 * branded `UserId` and `MediaAssetId` types from `@shared/contracts/ids`,
 * not raw `string`. Repository persistence records keep the raw string column
 * shape; the service is the boundary that brands them.
 */
import type {
  CompleteOnboardingInput,
  IdentityError,
  IdentityResult,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "./contracts";
import type { PublicProfileDTO } from "./dto";
import type { IdentityEvent } from "./events";
import { identityProfilePublicSummaryChangedEvent } from "./events";
import { completeOnboardingFlow } from "./internal/onboarding";
import type { PrivateProfileDTO } from "./private-dto";
import {
  buildPersonalStatusPatch,
  buildPrivateProfilePatch,
  CLEAR_PERSONAL_STATUS_PATCH,
} from "./internal/patch";
import {
  validatePersonalStatusInput,
  validateUpdateInput,
} from "./internal/validation";
import { toPrivateProfileDTO, toPublicProfileDTO } from "./mapper";
import {
  canReadPrivateProfile,
  canReadPublicProfile,
  canUpdatePrivateProfile,
  type ViewerRole,
} from "./policy";
import type {
  IdentityProfileRepository,
  UpdateProfileRecordPatch,
} from "./repository";
import type { MediaAssetId, UserId } from "@shared/contracts/ids";

export type IdentityEventPublisher = (event: IdentityEvent) => void;
export type IdentityClock = () => string;
export type IdentityRelationshipResolver = (
  viewerUserId: UserId,
  profileUserId: UserId,
) => Promise<ViewerRole> | ViewerRole;

export type IdentityServiceDeps = {
  repository: IdentityProfileRepository;
  clock?: IdentityClock;
  publish?: IdentityEventPublisher;
  /** How identity decides if a viewer is owner/friend/stranger. */
  resolveViewerRole?: IdentityRelationshipResolver;
};

export interface IdentityService {
  completeOnboarding(
    currentUserId: UserId,
    input: CompleteOnboardingInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  getMyProfile(currentUserId: UserId): Promise<IdentityResult<PrivateProfileDTO>>;
  updatePrivateProfile(
    currentUserId: UserId,
    input: UpdatePrivateProfileInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  updatePersonalStatus(
    currentUserId: UserId,
    input: UpdatePersonalStatusInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  clearPersonalStatus(currentUserId: UserId): Promise<IdentityResult<PrivateProfileDTO>>;
  attachAvatarMediaRef(
    currentUserId: UserId,
    assetId: MediaAssetId,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  attachBannerMediaRef(
    currentUserId: UserId,
    assetId: MediaAssetId,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  attachStatusPhotoMediaRef(
    currentUserId: UserId,
    assetId: MediaAssetId,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  getPublicProfile(
    viewerUserId: UserId | null,
    profileUserId: UserId,
  ): Promise<IdentityResult<PublicProfileDTO>>;
}

function errInvalid(fields: Record<string, string>): IdentityError {
  return { code: "INVALID_INPUT", message: "Niepoprawne dane wejściowe", fields };
}
function errForbidden(): IdentityError {
  return { code: "FORBIDDEN", message: "Brak uprawnień do tej operacji" };
}
function errNotFound(): IdentityError {
  return { code: "NOT_FOUND", message: "Profil nie istnieje" };
}

function defaultRoleResolver(
  viewerUserId: UserId | null,
  profileUserId: UserId,
): ViewerRole {
  if (viewerUserId && viewerUserId === profileUserId) return "owner";
  return "stranger";
}

export function createIdentityService(
  deps: IdentityServiceDeps,
): IdentityService {
  const repo = deps.repository;
  const clock = deps.clock ?? (() => new Date().toISOString());
  const publish = deps.publish ?? (() => {});
  const resolveRole = deps.resolveViewerRole
    ? async (viewerUserId: UserId | null, profileUserId: UserId) => {
        if (!viewerUserId) return "stranger" as ViewerRole;
        if (viewerUserId === profileUserId) return "owner" as ViewerRole;
        return deps.resolveViewerRole!(viewerUserId, profileUserId);
      }
    : async (viewerUserId: UserId | null, profileUserId: UserId) =>
        defaultRoleResolver(viewerUserId, profileUserId);

  async function patchAndReturn(
    currentUserId: UserId,
    patch: UpdateProfileRecordPatch,
  ): Promise<IdentityResult<PrivateProfileDTO>> {
    const now = clock();
    const record = await repo.update(currentUserId, patch, now);
    if (!record) return { ok: false, error: errNotFound() };
    publish(identityProfilePublicSummaryChangedEvent(currentUserId, { occurredAt: now }));
    return { ok: true, value: toPrivateProfileDTO(record) };
  }

  async function doAttachStatusPhoto(
    currentUserId: UserId,
    assetId: MediaAssetId,
  ): Promise<IdentityResult<PrivateProfileDTO>> {
    if (!assetId) {
      return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
    }
    const existing = await repo.findByUserId(currentUserId);
    if (!existing) return { ok: false, error: errNotFound() };
    if (!existing.statusText || !existing.statusVisibility) {
      return {
        ok: false,
        error: errInvalid({
          status: "Brak aktywnego statusu — ustaw status przed dodaniem zdjęcia",
        }),
      };
    }
    return patchAndReturn(currentUserId, { statusPhotoAssetId: assetId });
  }

  return {
    completeOnboarding: (currentUserId, input) =>
      completeOnboardingFlow(repo, { clock, publish }, currentUserId, input),

    async getMyProfile(currentUserId) {
      if (!canReadPrivateProfile("owner")) return { ok: false, error: errForbidden() };
      const record = await repo.findByUserId(currentUserId);
      if (!record) return { ok: false, error: errNotFound() };
      return { ok: true, value: toPrivateProfileDTO(record) };
    },

    async updatePrivateProfile(currentUserId, input) {
      const errors = validateUpdateInput(input);
      if (Object.keys(errors).length > 0) {
        return { ok: false, error: errInvalid(errors) };
      }
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(currentUserId, buildPrivateProfilePatch(input));
    },

    async updatePersonalStatus(currentUserId, input) {
      const errors = validatePersonalStatusInput(input);
      if (Object.keys(errors).length > 0) {
        return { ok: false, error: errInvalid(errors) };
      }
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(currentUserId, buildPersonalStatusPatch(input));
    },

    async clearPersonalStatus(currentUserId) {
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(currentUserId, CLEAR_PERSONAL_STATUS_PATCH);
    },

    async attachAvatarMediaRef(currentUserId, assetId) {
      if (!assetId) {
        return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
      }
      return patchAndReturn(currentUserId, { avatarAssetId: assetId });
    },

    async attachBannerMediaRef(currentUserId, assetId) {
      if (!assetId) {
        return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
      }
      return patchAndReturn(currentUserId, { bannerAssetId: assetId });
    },

    attachStatusPhotoMediaRef: doAttachStatusPhoto,

    async getPublicProfile(viewerUserId, profileUserId) {
      const record = await repo.findByUserId(profileUserId);
      if (!record) return { ok: false, error: errNotFound() };
      const role = await resolveRole(viewerUserId, profileUserId);
      if (!canReadPublicProfile(role, record.visibility)) {
        return { ok: false, error: errForbidden() };
      }
      return { ok: true, value: toPublicProfileDTO(record, role) };
    },
  };
}
