/**
 * identity — repository contract + in-memory adapter
 *
 * Persistence is abstracted behind `IdentityProfileRepository`. The current
 * runtime ships only an in-memory adapter: it satisfies the contract used by
 * service/tests and lets the onboarding adapter exercise a real boundary,
 * without committing to a database client until BLOCKER_REQUIRES_PERSISTENCE_
 * ADAPTER is resolved (see README "Not done yet" and STEP_27 report).
 *
 * A SQL schema mirror is provided in `supabase/migrations/0001_identity_
 * private_profiles.sql` for future Supabase wiring — that migration is NOT
 * applied automatically anywhere. No live db push.
 */
import type { ProfileVisibility } from "./dto";
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
  visibility?: ProfileVisibility;
  onboardingCompleted?: boolean;
};

export interface IdentityProfileRepository {
  findByUserId(userId: string): Promise<PrivateProfileRecord | null>;
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

  return {
    async findByUserId(userId) {
      const record = byUserId.get(userId);
      return record ? { ...record } : null;
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
      const next: PrivateProfileRecord = {
        ...existing,
        ...patch,
        updatedAt: now,
      };
      byUserId.set(userId, next);
      return { ...next };
    },
  };
}
