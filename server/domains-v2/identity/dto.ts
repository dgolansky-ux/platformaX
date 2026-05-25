/**
 * identity — public data transfer objects
 *
 * Public DTOs exposed by this domain. These cross the public-api boundary and
 * MUST NOT contain PII (private contact info, date of birth, auth metadata).
 *
 * Private DTOs (owner-only) live in `./internal/private-profile-dto.ts` so the
 * PII guard (`scripts/check-public-dto-pii.mjs`) can keep public DTOs strict.
 */

/** Stable visibility level for a profile slot owned by identity. */
export type ProfileVisibility = "public" | "friends" | "private";

/** Reference to a media asset owned by the `media` domain. No payload. */
export type MediaAssetRef = {
  assetId: string;
};

/**
 * Public profile summary. Anything visible to non-owners.
 * Must not contain private contact info or auth metadata.
 */
export type PublicProfileDTO = {
  userId: string;
  displayName: string;
  avatarMediaRef: MediaAssetRef | null;
  bannerMediaRef: MediaAssetRef | null;
  bio: string | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
};
