/**
 * shared/contracts/profile — canonical profile application-layer types.
 *
 * Single source of truth for the cross-boundary profile view shape + the safe
 * frontend error contract. The server-side application module
 * (`server/application-v2/use-cases/profile`) re-exports the same names so
 * service implementations and external callers see one definition.
 *
 * `shared/contracts/*` MUST NOT import from `@server/*` — these types are
 * independent definitions, not a mirror that pulls server runtime paths into
 * the client bundle graph. Service interfaces (`ProfileApplicationService`,
 * `ProfileApplicationServiceDeps`) stay server-side; clients depend on
 * `OnboardingProfileAdapter` instead.
 *
 * ALLOW_PRIVATE_DTO_PII — `OwnerProfileView` intentionally carries `phone` and
 * `dateOfBirth` because it is the OWNER-ONLY (Private) read view. The Public
 * counterpart (`PublicProfileView`) is declared in the same file and MUST NOT
 * contain those fields; the PII guard cannot tell the two apart so this file
 * is registered under `EXC-003` in EXCEPTIONS_REGISTER.md.
 */
import type {
  CivilStatus,
  CompleteOnboardingInput,
  PersonalStatusVisibility,
  SocialLinks,
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "./identity";

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

export type ProfileApplicationErrorCode =
  | "PROFILE_NOT_FOUND"
  | "PROFILE_FORBIDDEN"
  | "PROFILE_VALIDATION_FAILED"
  | "ONBOARDING_ALREADY_COMPLETED"
  | "MEDIA_ASSET_NOT_FOUND"
  | "MEDIA_ASSET_FORBIDDEN"
  | "MEDIA_ASSET_TYPE_MISMATCH"
  | "MEDIA_ASSET_NOT_READY"
  | "UNAUTHENTICATED";

export type ProfileApplicationError = {
  code: ProfileApplicationErrorCode;
  /** Safe, user-facing Polish message. Never includes raw domain detail. */
  message: string;
  /** Optional field-level validation map, safe for UI display. */
  fields?: Record<string, string>;
};

export type ProfileApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProfileApplicationError };

export function makeProfileError(
  code: ProfileApplicationErrorCode,
  message: string,
  fields?: Record<string, string>,
): ProfileApplicationError {
  return fields ? { code, message, fields } : { code, message };
}

/* ---------- Adapter contract (client + server agree on this shape) ---------- */

/**
 * Result aliases the adapter exposes. Each operation returns either an
 * `OwnerProfileView` (the owner-only composed view) or a `PublicProfileView`
 * (any-viewer composed view), wrapped in `ProfileApplicationResult`.
 */
export type CompleteOnboardingResult = ProfileApplicationResult<OwnerProfileView>;
export type GetMyProfileViewResult = ProfileApplicationResult<OwnerProfileView>;
export type GetPublicProfileViewResult = ProfileApplicationResult<PublicProfileView>;
export type UpdateMyProfileResult = ProfileApplicationResult<OwnerProfileView>;
export type AttachProfileMediaRefResult = ProfileApplicationResult<OwnerProfileView>;

/**
 * Adapter contract the client UI depends on. Both the client-side mock adapter
 * (MOCK_LOCAL_ONLY, BACKEND_NOT_STARTED) and the future HTTP transport adapter
 * implement this same shape — UI screens never branch on which backend is wired.
 *
 * `isPersistent()` answers honestly whether writes survive a reload. The mock
 * returns `false`; an HTTP/Supabase adapter would return `true`. The UI surfaces
 * that state so users are not misled.
 */
export type OnboardingProfileAdapter = {
  isPersistent(): boolean;
  completeOnboarding(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult>;
  getMyProfileView(userId: string): Promise<GetMyProfileViewResult>;
  getPublicProfileView(
    viewerId: string | null,
    profileUserId: string,
  ): Promise<GetPublicProfileViewResult>;
  updateMyProfile(
    userId: string,
    input: UpdatePrivateProfileInput,
  ): Promise<UpdateMyProfileResult>;
  updatePersonalStatus(
    userId: string,
    input: UpdatePersonalStatusInput,
  ): Promise<UpdateMyProfileResult>;
  clearPersonalStatus(userId: string): Promise<UpdateMyProfileResult>;
  attachProfileAvatarRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
  attachProfileBannerRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
  attachProfileStatusPhotoRef(
    userId: string,
    assetId: string,
  ): Promise<AttachProfileMediaRefResult>;
};
