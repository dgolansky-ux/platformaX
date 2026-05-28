/**
 * identity — validation limits (public, stable contract)
 *
 * Exposed by `public-api.ts` as a stable, owner-reviewable contract for clients
 * (forms, adapters, tests) that need to mirror server-side limits.
 *
 * Private impl details (regex patterns, normalisers, validate* functions) stay
 * in `internal/validation.ts` and are not part of the public surface.
 */
import type { CivilStatus, SocialLinkKind } from "./dto";

const BIO_MAX = 175;
const LOCATION_MAX = 80;
const STATUS_TEXT_MIN = 1;
const STATUS_TEXT_MAX = 40;
const STATUS_DESCRIPTION_MAX = 100;
const STATUS_EMOJI_MAX = 8;
const SOCIAL_URL_MAX = 200;
const SLUG_MIN = 3;
const SLUG_MAX = 32;

export const ALLOWED_CIVIL_STATUSES: readonly CivilStatus[] = [
  "single",
  "in_relationship",
  "engaged",
  "married",
  "partnered",
  "complicated",
  "undisclosed",
];

export const ALLOWED_SOCIAL_LINK_KINDS: readonly SocialLinkKind[] = [
  "linkedin",
  "github",
  "instagram",
  "website",
];

export const IDENTITY_VALIDATION_LIMITS = {
  firstNameMin: 2,
  firstNameMax: 80,
  lastNameMin: 2,
  lastNameMax: 120,
  phoneMin: 9,
  phoneMax: 15,
  bioMax: BIO_MAX,
  locationMax: LOCATION_MAX,
  statusTextMin: STATUS_TEXT_MIN,
  statusTextMax: STATUS_TEXT_MAX,
  statusDescriptionMax: STATUS_DESCRIPTION_MAX,
  statusEmojiMax: STATUS_EMOJI_MAX,
  socialUrlMax: SOCIAL_URL_MAX,
  profileSlugMin: SLUG_MIN,
  profileSlugMax: SLUG_MAX,
  allowedCivilStatuses: ALLOWED_CIVIL_STATUSES,
  allowedSocialLinkKinds: ALLOWED_SOCIAL_LINK_KINDS,
} as const;
