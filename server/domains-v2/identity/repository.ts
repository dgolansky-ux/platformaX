/**
 * identity — repository contract + in-memory adapter
 *
 * Persistence is abstracted behind `IdentityProfileRepository`. The current
 * runtime ships only an in-memory adapter: it satisfies the contract used by
 * service/tests and lets the onboarding adapter exercise a real boundary,
 * without committing to a database client until BLOCKER_REQUIRES_PERSISTENCE_
 * ADAPTER is resolved (see README "Not done yet" and STEP_27 report).
 *
 * SQL schema mirrors live in `supabase/migrations/0001_identity_private_
 * profiles.sql` (base) and `supabase/migrations/0003_identity_personal_
 * profile_fields.sql` (forward-additive: location/profile_slug/status/civil/
 * social columns). Neither is applied automatically. No live db push.
 */
import type {
  CivilStatus,
  PersonalStatusVisibility,
  ProfileVisibility,
  SocialLinks,
} from "./dto";
import type { PrivateProfileRecord } from "./internal/record";

export type CreateProfileRecordInput = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  avatarAssetId: string | null;
  bannerAssetId: string | null;
  bio: string | null;
  location: string | null;
  profileSlug: string | null;
  statusText: string | null;
  statusEmoji: string | null;
  statusDescription: string | null;
  statusVisibility: PersonalStatusVisibility | null;
  statusPhotoAssetId: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
};

export type UpdateProfileRecordPatch = {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  avatarAssetId?: string | null;
  bannerAssetId?: string | null;
  bio?: string | null;
  location?: string | null;
  profileSlug?: string | null;
  statusText?: string | null;
  statusEmoji?: string | null;
  statusDescription?: string | null;
  statusVisibility?: PersonalStatusVisibility | null;
  statusPhotoAssetId?: string | null;
  civilStatus?: CivilStatus | null;
  socialLinks?: SocialLinks | null;
  visibility?: ProfileVisibility;
  onboardingCompleted?: boolean;
};

export interface IdentityProfileRepository {
  findByUserId(userId: string): Promise<PrivateProfileRecord | null>;
  findBySlug(slug: string): Promise<PrivateProfileRecord | null>;
  create(
    input: CreateProfileRecordInput,
    now: string,
  ): Promise<PrivateProfileRecord>;
  update(
    userId: string,
    patch: UpdateProfileRecordPatch,
    now: string,
  ): Promise<PrivateProfileRecord | null>;
}

/**
 * Deterministic in-memory adapter. Safe for unit tests and for the current
 * onboarding boundary while no DB client is wired. Not suitable for prod.
 */
export function createInMemoryIdentityProfileRepository(
  seed: ReadonlyArray<PrivateProfileRecord> = [],
): IdentityProfileRepository {
  const byUserId = new Map<string, PrivateProfileRecord>();
  for (const r of seed) byUserId.set(r.userId, { ...r });

  function findBySlugSync(slug: string): PrivateProfileRecord | null {
    for (const r of byUserId.values()) {
      if (r.profileSlug === slug) return { ...r };
    }
    return null;
  }

  return {
    async findByUserId(userId) {
      const record = byUserId.get(userId);
      return record ? { ...record } : null;
    },

    async findBySlug(slug) {
      if (!slug) return null;
      return findBySlugSync(slug);
    },

    async create(input, now) {
      const record: PrivateProfileRecord = {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        phone: input.phone,
        avatarAssetId: input.avatarAssetId,
        bannerAssetId: input.bannerAssetId,
        bio: input.bio,
        location: input.location,
        profileSlug: input.profileSlug,
        statusText: input.statusText,
        statusEmoji: input.statusEmoji,
        statusDescription: input.statusDescription,
        statusVisibility: input.statusVisibility,
        statusPhotoAssetId: input.statusPhotoAssetId,
        civilStatus: input.civilStatus,
        socialLinks: input.socialLinks,
        visibility: input.visibility,
        onboardingCompleted: input.onboardingCompleted,
        createdAt: now,
        updatedAt: now,
      };
      byUserId.set(record.userId, record);
      return { ...record };
    },

    async update(userId, patch, now) {
      const existing = byUserId.get(userId);
      if (!existing) return null;
      // Only assign keys that are explicitly present in the patch, so omitted
      // fields keep their prior value (vs. being silently nulled).
      const next: PrivateProfileRecord = { ...existing, updatedAt: now };
      for (const key of Object.keys(patch) as Array<keyof UpdateProfileRecordPatch>) {
        if (patch[key] !== undefined) {
          (next as unknown as Record<string, unknown>)[key] = patch[key];
        }
      }
      byUserId.set(userId, next);
      return { ...next };
    },
  };
}
