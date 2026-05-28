/**
 * Profile wire contract — value objects, composed view DTOs, request inputs,
 * application error contract and the application port.
 *
 * Rule: PX-APP-001 / split-ready. This is the neutral boundary between the
 * server profile application service and any client/transport. The client
 * imports these types instead of reaching into `@server/*`. The server
 * application layer re-exports the view + error types from here.
 *
 * QUALITY_STRUCTURE_EXCEPTION — see docs/governance/EXCEPTIONS_REGISTER.md (EXC-001).
 * This module is the single canonical wire-contract surface for the profile
 * application boundary. Splitting it would create multiple import paths for what
 * is, per ADR-010, one logical contract, weakening the boundary it defines.
 *
 * Sections below are explicitly classified:
 *  - PUBLIC_SAFE   — `PublicProfileView`, `ProfileMediaRefView`,
 *                    `PersonalStatusView`, `MediaAssetRef`, value-object enums.
 *  - OWNER_ONLY    — `OwnerProfileView` (Private; carries `phone`,
 *                    `dateOfBirth`), `CompleteOnboardingInput`,
 *                    `UpdatePrivateProfileInput`, `UpdatePersonalStatusInput`.
 *  - APP_BOUNDARY  — `ProfileApplicationPort`, application error / result.
 *
 * ALLOW_PRIVATE_DTO_PII — `OwnerProfileView` is the owner-only Private view and
 * intentionally carries `phone` and `dateOfBirth` (mirrors the same Owner-only
 * shape declared in server/domains-v2/identity/dto.ts). `PublicProfileView` is
 * Public and contains none of these — enforced by domain mappers + tests.
 */

// =====================================================================
// PUBLIC_SAFE — value objects (any viewer may see / receive these)
// =====================================================================

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

/** PUBLIC_SAFE — reference to a media asset owned by the media domain. No payload. */
export type MediaAssetRef = {
  assetId: string;
};

// =====================================================================
// PUBLIC_SAFE — composed view value objects
// =====================================================================

/** PUBLIC_SAFE — public-safe media ref view with URL pre-resolved when ready. */
export type ProfileMediaRefView = {
  assetId: string;
  /** Public URL when the asset is ready; null while pending or env-required. */
  url: string | null;
};

/** PUBLIC_SAFE — viewer-resolved personal status; null when cleared/forbidden. */
export type PersonalStatusView = {
  text: string;
  emoji: string | null;
  description: string | null;
  visibility: PersonalStatusVisibility;
  photo: ProfileMediaRefView | null;
};

// =====================================================================
// OWNER_ONLY — Private composed view DTOs
// =====================================================================

/**
 * OWNER_ONLY — Private. Never returned to a non-owner viewer.
 *
 * Carries Private fields (`phone`, `dateOfBirth`) plus the stable profile
 * owner user id (PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET — see
 * `profileUserId`).
 */
export type OwnerProfileView = {
  /**
   * PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET — stable identifier of the
   * profile owner. Not an email / token / provider id. Public callers see
   * the same value on `PublicProfileView`; it's not a secret. The literal
   * field name `profileUserId` (not `userId`) is deliberate: callers must
   * never conflate it with an authenticated session subject.
   */
  profileUserId: string;
  profileSlug: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  /** OWNER_ONLY. ISO YYYY-MM-DD. */
  dateOfBirth: string | null;
  /** OWNER_ONLY. */
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

// =====================================================================
// PUBLIC_SAFE — Public composed view DTO
// =====================================================================

/**
 * PUBLIC_SAFE — any viewer. MUST NOT contain `email`, `phone`, `dateOfBirth`
 * or any auth/session metadata. Enforced by `check-public-dto-pii.mjs` and
 * `check-public-profile-id-exposure.mjs`.
 */
export type PublicProfileView = {
  /**
   * PUBLIC_STABLE_USER_REF_NOT_AUTH_SECRET — stable identifier of the
   * profile owner. Not an email / token / provider id. Renamed from `userId`
   * so callers cannot mistake it for an authenticated session subject. Public
   * URLs / display SHOULD prefer `profileSlug` and use this only when no slug
   * exists.
   */
  profileUserId: string;
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

// =====================================================================
// OWNER_ONLY — request inputs (only owners can send these)
// =====================================================================

export type CompleteOnboardingInput = {
  firstName: string;
  lastName: string;
  /** OWNER_ONLY. ISO date string (YYYY-MM-DD). */
  dateOfBirth: string;
  /** OWNER_ONLY. */
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

// =====================================================================
// APP_BOUNDARY — application error contract
// =====================================================================

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

// =====================================================================
// APP_BOUNDARY — application port (transport-neutral)
// =====================================================================

/**
 * The profile application boundary. The server profile application service
 * implements this shape; a client transport (or a UI-only stub) implements the
 * same shape so the frontend never depends on server runtime.
 *
 * Parameters use the transport-boundary `string` shape (not branded `UserId`)
 * because this contract is shared with the client. The server application
 * service brands them via `asUserId` / `asMediaAssetId` before calling owner-
 * gated domain services.
 */
export interface ProfileApplicationPort {
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
