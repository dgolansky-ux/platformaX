/**
 * identity — cross-domain contracts
 *
 * Stable contract types shared with other domains (social, content-v2, etc.).
 * Anything referenced here must be a type or a constant — not runtime
 * implementation. Implementation lives behind `public-api.ts`.
 */

/** Stable identifier for an authenticated subject owned by identity. */
export type UserId = string;

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
  visibility?: "public" | "friends" | "private";
};

/** Discriminated result type for owner-gated identity use-cases. */
export type IdentityResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: IdentityError };

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
