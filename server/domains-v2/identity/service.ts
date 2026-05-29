/**
 * identity — service (use-cases)
 *
 * Personal-profile use-cases: onboarding, getMyProfile/updatePrivateProfile,
 * personal-status update/clear, attach* media refs, getPublicProfile.
 *
 * Depends on `IdentityProfileRepository` (interface), policy, mapper, patch
 * builders and validation. No DB client — concrete repository adapter is
 * injected. Identity never imports the media domain; media-asset ownership
 * validation lives in application-v2/use-cases/profile, which calls
 * `media.verifyProfileAssetForAttach` before invoking attach* methods here.
 */
import type {
  CompleteOnboardingInput,
  IdentityError,
  IdentityResult,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "./contracts";
import type { PublicProfileDTO } from "./dto";
import { wrapIdentityEvent, type IdentityEventEnvelope } from "./internal/envelope";
import { completeOnboardingFlow } from "./internal/onboarding";
import type { PrivateProfileDTO } from "./internal/private-profile-dto";
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

export type IdentityEventPublisher = (envelope: IdentityEventEnvelope) => void;
export type IdentityClock = () => string;
export type IdentityRelationshipResolver = (
  viewerId: string,
  profileUserId: string,
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
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  getMyProfile(userId: string): Promise<IdentityResult<PrivateProfileDTO>>;
  updatePrivateProfile(
    userId: string,
    input: UpdatePrivateProfileInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  updatePersonalStatus(
    userId: string,
    input: UpdatePersonalStatusInput,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  clearPersonalStatus(userId: string): Promise<IdentityResult<PrivateProfileDTO>>;
  attachAvatarMediaRef(
    userId: string,
    assetId: string,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  attachBannerMediaRef(
    userId: string,
    assetId: string,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  attachStatusPhotoMediaRef(
    userId: string,
    assetId: string,
  ): Promise<IdentityResult<PrivateProfileDTO>>;
  getPublicProfile(
    viewerId: string | null,
    profileUserId: string,
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
  viewerId: string | null,
  profileUserId: string,
): ViewerRole {
  if (viewerId && viewerId === profileUserId) return "owner";
  return "stranger";
}

export function createIdentityService(
  deps: IdentityServiceDeps,
): IdentityService {
  const repo = deps.repository;
  const clock = deps.clock ?? (() => new Date().toISOString());
  const publish = deps.publish ?? (() => {});
  const resolveRole = deps.resolveViewerRole
    ? async (viewerId: string | null, profileUserId: string) => {
        if (!viewerId) return "stranger" as ViewerRole;
        if (viewerId === profileUserId) return "owner" as ViewerRole;
        return deps.resolveViewerRole!(viewerId, profileUserId);
      }
    : async (viewerId: string | null, profileUserId: string) =>
        defaultRoleResolver(viewerId, profileUserId);

  async function patchAndReturn(
    userId: string,
    patch: UpdateProfileRecordPatch,
  ): Promise<IdentityResult<PrivateProfileDTO>> {
    const now = clock();
    const record = await repo.update(userId, patch, now);
    if (!record) return { ok: false, error: errNotFound() };
    publish(
      wrapIdentityEvent({
        type: "identity.profile.public_summary_changed",
        userId,
        at: now,
      }),
    );
    return { ok: true, value: toPrivateProfileDTO(record) };
  }

  async function doAttachStatusPhoto(
    userId: string,
    assetId: string,
  ): Promise<IdentityResult<PrivateProfileDTO>> {
    if (!assetId) {
      return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
    }
    const existing = await repo.findByUserId(userId);
    if (!existing) return { ok: false, error: errNotFound() };
    if (!existing.statusText || !existing.statusVisibility) {
      return {
        ok: false,
        error: errInvalid({
          status: "Brak aktywnego statusu — ustaw status przed dodaniem zdjęcia",
        }),
      };
    }
    return patchAndReturn(userId, { statusPhotoAssetId: assetId });
  }

  return {
    completeOnboarding: (userId, input) =>
      completeOnboardingFlow(repo, { clock, publish }, userId, input),

    async getMyProfile(userId) {
      if (!canReadPrivateProfile("owner")) return { ok: false, error: errForbidden() };
      const record = await repo.findByUserId(userId);
      if (!record) return { ok: false, error: errNotFound() };
      return { ok: true, value: toPrivateProfileDTO(record) };
    },

    async updatePrivateProfile(userId, input) {
      const errors = validateUpdateInput(input);
      if (Object.keys(errors).length > 0) {
        return { ok: false, error: errInvalid(errors) };
      }
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(userId, buildPrivateProfilePatch(input));
    },

    async updatePersonalStatus(userId, input) {
      const errors = validatePersonalStatusInput(input);
      if (Object.keys(errors).length > 0) {
        return { ok: false, error: errInvalid(errors) };
      }
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(userId, buildPersonalStatusPatch(input));
    },

    async clearPersonalStatus(userId) {
      if (!canUpdatePrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
      return patchAndReturn(userId, CLEAR_PERSONAL_STATUS_PATCH);
    },

    async attachAvatarMediaRef(userId, assetId) {
      if (!assetId) {
        return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
      }
      return patchAndReturn(userId, { avatarAssetId: assetId });
    },

    async attachBannerMediaRef(userId, assetId) {
      if (!assetId) {
        return { ok: false, error: errInvalid({ assetId: "Brak identyfikatora zasobu" }) };
      }
      return patchAndReturn(userId, { bannerAssetId: assetId });
    },

    attachStatusPhotoMediaRef: doAttachStatusPhoto,

    async getPublicProfile(viewerId, profileUserId) {
      const record = await repo.findByUserId(profileUserId);
      if (!record) return { ok: false, error: errNotFound() };
      const role = await resolveRole(viewerId, profileUserId);
      if (!canReadPublicProfile(role, record.visibility)) {
        return { ok: false, error: errForbidden() };
      }
      return { ok: true, value: toPublicProfileDTO(record, role) };
    },
  };
}
