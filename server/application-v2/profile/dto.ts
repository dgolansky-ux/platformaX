/**
 * application-v2/profile — composed view DTOs
 *
 * These DTOs are what the frontend feature adapter consumes. The application
 * layer composes identity (canonical profile) + media (resolved URL refs) into
 * a single view object — so the frontend never has to glue domains together
 * and never imports either domain's public-api directly.
 *
 * Privacy classification:
 *  - OwnerProfileView   — Private (owner-only): MAY include phone, dateOfBirth.
 *  - PublicProfileView  — Public (any viewer):  MUST NOT include PII.
 *  - ProfileMediaRefView — Public (any viewer): just assetId + optional URL.
 *
 * `url` may be null while the storage backend is env-required — the UI must
 * surface "no image" instead of faking one.
 */
import type {
  CivilStatus,
  PersonalStatusVisibility,
  SocialLinks,
} from "@server/domains-v2/identity/public-api";

export type ProfileVisibility = "public" | "friends" | "private";

/** Public-safe projection of a media ref, with URL pre-resolved when ready. */
export type ProfileMediaRefView = {
  assetId: string;
  /** Public URL when the asset is `ready`; null while pending or env-required. */
  url: string | null;
};

/** Composed view of the personal status. Photo URL is pre-resolved. */
export type PersonalStatusView = {
  text: string;
  emoji: string | null;
  description: string | null;
  visibility: PersonalStatusVisibility;
  photo: ProfileMediaRefView | null;
};

/**
 * Owner-only view (Private). Composed from PrivateProfileDTO + resolved media.
 * Includes private contact fields and date of birth. Never used for non-owner viewers.
 */
export type OwnerProfileView = {
  userId: string;
  profileSlug: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  /** Private. ISO YYYY-MM-DD. Owner-only. */
  dateOfBirth: string | null;
  /** Private. Owner-only. */
  phone: string | null;
  bio: string | null;
  location: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  personalStatus: PersonalStatusView | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  avatar: ProfileMediaRefView | null;
  banner: ProfileMediaRefView | null;
  createdAt: string;
  updatedAt: string;
  isOwner: true;
};

/**
 * Public view (any viewer). Composed from PublicProfileDTO + resolved media.
 * MUST NOT contain email, phone, dateOfBirth or any auth metadata.
 */
export type PublicProfileView = {
  userId: string;
  profileSlug: string | null;
  displayName: string;
  bio: string | null;
  location: string | null;
  civilStatus: CivilStatus | null;
  socialLinks: SocialLinks | null;
  personalStatus: PersonalStatusView | null;
  visibility: ProfileVisibility;
  onboardingCompleted: boolean;
  avatar: ProfileMediaRefView | null;
  banner: ProfileMediaRefView | null;
  isOwner: false;
};
