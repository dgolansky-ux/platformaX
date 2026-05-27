/**
 * Profile wire contract — value objects, composed view DTOs, request inputs,
 * application error contract and the application port.
 *
 * Rule: PX-APP-001 / split-ready. This is the neutral boundary between the
 * server profile application service and any client/transport. The client
 * imports these types instead of reaching into `@server/*`. The server
 * application layer re-exports the view + error types from here.
 *
 * Privacy:
 *  - OwnerProfileView  — Private (owner-only): MAY include dateOfBirth, phone.
 *  - PublicProfileView — Public (any viewer): MUST NOT include PII.
 *
 * QUALITY_STRUCTURE_EXCEPTION — see docs/governance/EXCEPTIONS_REGISTER.md (EXC-001).
 * This module is the single canonical wire-contract surface for the profile
 * application boundary. Splitting it would create multiple import paths for what
 * is, per ADR-010, one logical contract, weakening the boundary it defines.
 *
 * ALLOW_PRIVATE_DTO_PII — `OwnerProfileView` is the owner-only Private view and
 * intentionally carries `phone` and `dateOfBirth` (mirrors the same Owner-only
 * shape declared in server/domains-v2/identity/dto.ts). `PublicProfileView` is
 * Public and contains none of these — enforced by domain mappers + tests.
 */

// --- Value objects ---------------------------------------------------------

export type ProfileVisibility = "public" | "friends" | "private";

export type PersonalStatusVisibility = "public" | "friends_only" | "private";

export type CivilStatus =
  | "single"
  | "in_relationship"
  | "engaged"
  | "married"
  | "partnered"
  | "complicated"
  | "undisclosed";

export type SocialLinkKind = "linkedin" | "github" | "instagram" | "website";

export type SocialLinks = {
  linkedin?: string | null;
  github?: string | null;
  instagram?: string | null;
  website?: string | null;
};

/** Reference to a media asset owned by the media domain. No payload. */
export type MediaAssetRef = {
  assetId: string;
};

// --- Composed view DTOs ----------------------------------------------------

/** Public-safe media ref view with URL pre-resolved when ready. */
export type ProfileMediaRefView = {
  assetId: string;
  /** Public URL when the asset is ready; null while pending or env-required. */
  url: string | null;
};

export type PersonalStatusView = {
  text: string;
  emoji: string | null;
  description: string | null;
  visibility: PersonalStatusVisibility;
  photo: ProfileMediaRefView | null;
};

/** Owner-only view (Private). Never used for non-owner viewers. */
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

/** Public view (any viewer). MUST NOT contain email/phone/dateOfBirth. */
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

// --- Request inputs --------------------------------------------------------

export type CompleteOnboardingInput = {
  firstName: string;
  lastName: string;
  /** ISO date string (YYYY-MM-DD). Private. */
  dateOfBirth: string;
  /** Owner-only contact field. Private. */
  phone: string;
  avatarMediaRef?: MediaAssetRef | null;
  bio?: string | null;
};

export type UpdatePrivateProfileInput = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  avatarMediaRef?: MediaAssetRef | null;
  bannerMediaRef?: MediaAssetRef | null;
  bio?: string | null;
  location?: string | null;
  profileSlug?: string | null;
  civilStatus?: CivilStatus | null;
  socialLinks?: SocialLinks | null;
  visibility?: ProfileVisibility;
};

export type UpdatePersonalStatusInput = {
  text: string;
  emoji?: string | null;
  description?: string | null;
  visibility: PersonalStatusVisibility;
  photoMediaRef?: MediaAssetRef | null;
};

// --- Application error contract --------------------------------------------

export type ProfileApplicationErrorCode =
  | "PROFILE_NOT_FOUND"
  | "PROFILE_FORBIDDEN"
  | "PROFILE_VALIDATION_FAILED"
  | "ONBOARDING_ALREADY_COMPLETED"
  | "MEDIA_ASSET_NOT_FOUND"
  | "MEDIA_ASSET_FORBIDDEN"
  | "MEDIA_ASSET_TYPE_MISMATCH"
  | "MEDIA_ASSET_NOT_READY"
  | "UNAUTHENTICATED"
  | "PROFILE_TRANSPORT_NOT_CONNECTED";

export type ProfileApplicationError = {
  code: ProfileApplicationErrorCode;
  /** Safe, user-facing message. Never includes raw domain detail. */
  message: string;
  fields?: Record<string, string>;
};

export type ProfileApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProfileApplicationError };

// --- Application port (transport-neutral) ----------------------------------

/**
 * The profile application boundary. The server profile application service
 * implements this shape; a client transport (or a UI-only stub) implements the
 * same shape so the frontend never depends on server runtime.
 */
export interface ProfileApplicationPort {
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
