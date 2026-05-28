/**
 * identity — public data transfer objects
 *
 * Public DTOs exposed by this domain. These cross the public-api boundary and
 * MUST NOT contain PII (private contact info, date of birth, auth metadata).
 *
 * Private DTOs (owner-only) live in `./private-dto.ts` (root, not /internal/)
 * so the public-api-surface guard can re-export the TYPE while the PII guard
 * (`scripts/check-public-dto-pii.mjs`) keeps public DTOs strict.
 */

/** Stable visibility level for a profile slot owned by identity. */
export type ProfileVisibility = "public" | "friends" | "private";

/** Visibility of the personal status (separate from profileVisibility). */
export type PersonalStatusVisibility = "public" | "friends_only" | "private";

/**
 * Closed enum of allowed civil/relationship status values. `undisclosed`
 * exists so users can explicitly choose to hide the field instead of leaving
 * it `null` (which is "not set").
 */
export type CivilStatus =
  | "single"
  | "in_relationship"
  | "engaged"
  | "married"
  | "partnered"
  | "complicated"
  | "undisclosed";

/** Allowed social link kinds — closed enum keeps the public DTO predictable. */
export type SocialLinkKind = "linkedin" | "github" | "instagram" | "website";

/**
 * Public-safe map of social links the user chose to expose. Values are
 * absolute https URLs validated at the service layer; null/undefined keys are
 * dropped before persistence so an absent key always means "not set".
 */
export type SocialLinks = {
  linkedin?: string | null;
  github?: string | null;
  instagram?: string | null;
  website?: string | null;
};

/** Reference to a media asset owned by the `media` domain. No payload. */
export type MediaAssetRef = {
  assetId: string;
};

/**
 * Composed view of the personal status. Returned as a single object so the
 * UI doesn't have to glue four fields together; null when no active status.
 */
export type PersonalStatusDTO = {
  text: string;
  emoji: string | null;
  description: string | null;
  visibility: PersonalStatusVisibility;
  photoMediaRef: MediaAssetRef | null;
};

/**
 * Public profile summary. Anything visible to non-owners.
 * Must not contain private contact info or auth metadata.
 *
 * Fields whose presence depends on viewer role + visibility are filtered by
 * the mapper before reaching here (e.g. `personalStatus` is omitted when the
 * status visibility forbids the current viewer).
 */
export type PublicProfileDTO = {
  userId: string;
  profileSlug: string | null;
  displayName: string;
  avatarMediaRef: MediaAssetRef | null;
  bannerMediaRef: MediaAssetRef | null;
  bio: string | null;
  /** City / region only — never a precise address. */
  location: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  personalStatus: PersonalStatusDTO | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
};
