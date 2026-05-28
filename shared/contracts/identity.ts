/**
 * shared/contracts/identity — canonical identity contract types.
 *
 * Single source of truth for cross-boundary identity types. Both `client/**`
 * and `server/**` import from here; the server-side identity domain re-exports
 * the same names so its own modules and external callers see one shape.
 *
 * `shared/contracts/*` MUST NOT import from `@server/*` — these types are
 * independent definitions, not a mirror that pulls server runtime paths into
 * the client bundle graph.
 *
 * ALLOW_PRIVATE_DTO_PII — this file declares owner-only Input shapes that
 * intentionally carry `phone` and `dateOfBirth` (write paths into the private
 * profile). These fields are SAFE here because they are never part of a Public
 * DTO — `PublicProfileDTO` lives in the identity server domain and is filtered
 * by the mapper. The PII guard (`scripts/check-public-dto-pii.mjs`) flags any
 * occurrence of PII tokens in `shared/**` regardless of the surrounding type;
 * this file is registered under `EXC-003` in EXCEPTIONS_REGISTER.md with
 * justification, owner, expiry and risk.
 */
export type { UserId } from "./branded-ids";

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
export type IdentityMediaAssetRef = {
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
  photoMediaRef: IdentityMediaAssetRef | null;
};

/** Input accepted by the onboarding use-case. Mirrors the V2 onboarding shell. */
export type CompleteOnboardingInput = {
  firstName: string;
  lastName: string;
  /** ISO date string (YYYY-MM-DD). Private. */
  dateOfBirth: string;
  /** Owner-only contact field. Private. */
  phone: string;
  /** Optional avatar asset ref produced by the media domain. */
  avatarMediaRef?: { assetId: string } | null;
  /** Optional initial bio. */
  bio?: string | null;
};

/** Input accepted by the private profile update use-case. */
export type UpdatePrivateProfileInput = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  avatarMediaRef?: { assetId: string } | null;
  bannerMediaRef?: { assetId: string } | null;
  bio?: string | null;
  location?: string | null;
  profileSlug?: string | null;
  civilStatus?: CivilStatus | null;
  socialLinks?: SocialLinks | null;
  visibility?: ProfileVisibility;
};

/** Input accepted by `updatePersonalStatus`. `text` is required (a status exists or is cleared). */
export type UpdatePersonalStatusInput = {
  text: string;
  emoji?: string | null;
  description?: string | null;
  visibility: PersonalStatusVisibility;
  /** Optional status photo asset ref produced by the media domain. */
  photoMediaRef?: { assetId: string } | null;
};

export type IdentityErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "ALREADY_COMPLETED";

export type IdentityError = {
  code: IdentityErrorCode;
  message: string;
  /** Optional field-level validation map. Safe for UI display. */
  fields?: Record<string, string>;
};

/** Discriminated result type for owner-gated identity use-cases. */
export type IdentityResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: IdentityError };
