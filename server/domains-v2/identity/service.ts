/**
 * identity — service (use-cases)
 *
 * Owns the four use-cases that constitute the first runtime slice:
 *  - completeOnboarding(userId, input)
 *  - getMyProfile(userId)
 *  - updatePrivateProfile(userId, input)
 *  - getPublicProfile(viewerId, profileUserId)
 *
 * Service depends on `IdentityProfileRepository` (interface), policy, mapper
 * and validation. It does NOT depend on a DB client — that is supplied via a
 * concrete repository adapter when one is wired.
 *
 * Events are emitted through a typed `IdentityEventPublisher`. If none is
 * passed, events are dropped silently — that path exists for unit tests and
 * the in-memory boundary.
 */
import type {
  CompleteOnboardingInput,
  IdentityError,
  IdentityResult,
  UpdatePrivateProfileInput,
} from "./contracts";
import type { PublicProfileDTO } from "./dto";
import type { IdentityEvent } from "./events";
import type { PrivateProfileDTO } from "./internal/private-profile-dto";
import type { PrivateProfileRecord } from "./internal/record";
import {
  normalisePhone,
  normaliseText,
  validateOnboardingInput,
  validateUpdateInput,
} from "./internal/validation";
import { toPrivateProfileDTO, toPublicProfileDTO } from "./mapper";
import {
  canCompleteOnboarding,
  canReadPrivateProfile,
  canReadPublicProfile,
  canUpdatePrivateProfile,
  type ViewerRole,
} from "./policy";
import type {
  IdentityProfileRepository,
  UpdateProfileRecordPatch,
} from "./repository";

export type IdentityEventPublisher = (event: IdentityEvent) => void;

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

  getPublicProfile(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<IdentityResult<PublicProfileDTO>>;
}

function errInvalid(fields: Record<string, string>): IdentityError {
  return {
    code: "INVALID_INPUT",
    message: "Niepoprawne dane wejściowe",
    fields,
  };
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

  return {
    async completeOnboarding(userId, input) {
      const errors = validateOnboardingInput(input);
      if (Object.keys(errors).length > 0) {
        return { ok: false, error: errInvalid(errors) };
      }
      if (!canCompleteOnboarding("owner")) {
        return { ok: false, error: errForbidden() };
      }

      const existing = await repo.findByUserId(userId);
      if (existing?.onboardingCompleted) {
        return {
          ok: false,
          error: {
            code: "ALREADY_COMPLETED",
            message: "Onboarding został już ukończony",
          },
        };
      }

      const now = clock();
      const normalisedBio = normaliseText(input.bio ?? null);
      const payload = {
        userId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        dateOfBirth: input.dateOfBirth,
        phone: normalisePhone(input.phone),
        avatarAssetId: input.avatarMediaRef?.assetId ?? null,
        bannerAssetId: null,
        bio: normalisedBio,
        visibility: "public" as const,
        onboardingCompleted: true,
      };

      const record: PrivateProfileRecord = existing
        ? ((await repo.update(
            userId,
            payload,
            now,
          )) as PrivateProfileRecord)
        : await repo.create(payload, now);

      publish({ type: "identity.onboarding.completed", userId, at: now });
      publish({
        type: "identity.profile.public_summary_changed",
        userId,
        at: now,
      });

      return { ok: true, value: toPrivateProfileDTO(record) };
    },

    async getMyProfile(userId) {
      if (!canReadPrivateProfile("owner")) {
        return { ok: false, error: errForbidden() };
      }
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

      const patch: UpdateProfileRecordPatch = {};
      if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
      if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
      if (input.dateOfBirth !== undefined) patch.dateOfBirth = input.dateOfBirth;
      if (input.phone !== undefined) patch.phone = normalisePhone(input.phone);
      if (input.avatarMediaRef !== undefined) {
        patch.avatarAssetId = input.avatarMediaRef?.assetId ?? null;
      }
      if (input.bannerMediaRef !== undefined) {
        patch.bannerAssetId = input.bannerMediaRef?.assetId ?? null;
      }
      if (input.bio !== undefined) patch.bio = normaliseText(input.bio);
      if (input.visibility !== undefined) patch.visibility = input.visibility;

      const now = clock();
      const record = await repo.update(userId, patch, now);
      if (!record) return { ok: false, error: errNotFound() };

      publish({
        type: "identity.profile.public_summary_changed",
        userId,
        at: now,
      });
      return { ok: true, value: toPrivateProfileDTO(record) };
    },

    async getPublicProfile(viewerId, profileUserId) {
      const record = await repo.findByUserId(profileUserId);
      if (!record) return { ok: false, error: errNotFound() };
      const role = await resolveRole(viewerId, profileUserId);
      if (!canReadPublicProfile(role, record.visibility)) {
        return { ok: false, error: errForbidden() };
      }
      return { ok: true, value: toPublicProfileDTO(record) };
    },
  };
}
