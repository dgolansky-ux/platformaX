/**
 * identity — input validation (internal)
 *
 * Mirrors the V2 onboarding shell validation so service-level use-cases reject
 * the same bad inputs that the UI already blocks, plus a few server-side
 * normalisations the UI cannot enforce.
 */
import type {
  CivilStatus,
  PersonalStatusVisibility,
  SocialLinks,
} from "../dto";
import {
  ALLOWED_CIVIL_STATUSES,
  ALLOWED_SOCIAL_LINK_KINDS,
  IDENTITY_VALIDATION_LIMITS as LIMITS,
} from "../validation-limits";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_DIGITS = /^\+?\d{9,15}$/;
const BIO_MAX = LIMITS.bioMax;
const LOCATION_MAX = LIMITS.locationMax;
const STATUS_TEXT_MIN = LIMITS.statusTextMin;
const STATUS_TEXT_MAX = LIMITS.statusTextMax;
const STATUS_DESCRIPTION_MAX = LIMITS.statusDescriptionMax;
const STATUS_EMOJI_MAX = LIMITS.statusEmojiMax;
const SOCIAL_URL_MAX = LIMITS.socialUrlMax;
const SLUG_MIN = LIMITS.profileSlugMin;
const SLUG_MAX = LIMITS.profileSlugMax;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;
const HTTPS_URL = /^https?:\/\/[^\s]+$/i;

const ALLOWED_PERSONAL_STATUS_VISIBILITY: readonly PersonalStatusVisibility[] = [
  "public",
  "friends_only",
  "private",
];

export type FieldErrors = Record<string, string>;

/** Normalise a phone string: strip spaces and dashes. Empty -> null. */
export function normalisePhone(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.replace(/[\s-]/g, "");
  return trimmed.length === 0 ? null : trimmed;
}

export function normaliseText(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Drop null/undefined entries, trim values, returning a sparse object. */
export function normaliseSocialLinks(
  input: SocialLinks | null | undefined,
): SocialLinks | null {
  if (!input) return null;
  const out: SocialLinks = {};
  for (const kind of ALLOWED_SOCIAL_LINK_KINDS) {
    const raw = input[kind];
    if (raw === undefined) continue;
    if (raw === null) {
      out[kind] = null;
      continue;
    }
    const trimmed = raw.trim();
    out[kind] = trimmed.length === 0 ? null : trimmed;
  }
  return Object.keys(out).length === 0 ? null : out;
}

export function validateOnboardingInput(input: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  bio?: string | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.firstName || input.firstName.trim().length < 2) {
    errors.firstName = "Imię musi mieć co najmniej 2 znaki";
  } else if (input.firstName.trim().length > 80) {
    errors.firstName = "Imię może mieć maksymalnie 80 znaków";
  }
  if (!input.lastName || input.lastName.trim().length < 2) {
    errors.lastName = "Nazwisko musi mieć co najmniej 2 znaki";
  } else if (input.lastName.trim().length > 120) {
    errors.lastName = "Nazwisko może mieć maksymalnie 120 znaków";
  }

  if (!input.dateOfBirth || !DATE_PATTERN.test(input.dateOfBirth)) {
    errors.dateOfBirth = "Wymagana data w formacie YYYY-MM-DD";
  } else {
    const parsed = new Date(`${input.dateOfBirth}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      errors.dateOfBirth = "Niepoprawna data";
    }
  }

  const normalisedPhone = normalisePhone(input.phone);
  if (!normalisedPhone || !PHONE_DIGITS.test(normalisedPhone)) {
    errors.phone = "Numer musi mieć 9–15 cyfr (opcjonalnie z prefiksem +)";
  }

  if (input.bio !== undefined && input.bio !== null) {
    if (input.bio.length > BIO_MAX) {
      errors.bio = `Bio może mieć maksymalnie ${BIO_MAX} znaków`;
    }
  }
  return errors;
}

function validateLocation(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > LOCATION_MAX)
    return `Lokalizacja może mieć maksymalnie ${LOCATION_MAX} znaków`;
  return null;
}

function validateSlug(input: string): string | null {
  if (input.length < SLUG_MIN)
    return `Slug musi mieć co najmniej ${SLUG_MIN} znaki`;
  if (input.length > SLUG_MAX)
    return `Slug może mieć maksymalnie ${SLUG_MAX} znaków`;
  if (!SLUG_PATTERN.test(input))
    return "Slug może zawierać tylko małe litery, cyfry, '-' i '_'";
  return null;
}

function validateSocialLinks(links: SocialLinks): FieldErrors {
  const errors: FieldErrors = {};
  for (const kind of ALLOWED_SOCIAL_LINK_KINDS) {
    const v = links[kind];
    if (v === undefined || v === null) continue;
    if (v.length > SOCIAL_URL_MAX) {
      errors[`socialLinks.${kind}`] = `Link może mieć maksymalnie ${SOCIAL_URL_MAX} znaków`;
      continue;
    }
    if (!HTTPS_URL.test(v)) {
      errors[`socialLinks.${kind}`] = "Wymagany pełny adres https://…";
    }
  }
  return errors;
}

export function validateUpdateInput(input: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  profileSlug?: string | null;
  civilStatus?: CivilStatus | null;
  socialLinks?: SocialLinks | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.firstName !== undefined) {
    const v = input.firstName.trim();
    if (v.length < 2) errors.firstName = "Imię musi mieć co najmniej 2 znaki";
    else if (v.length > 80) errors.firstName = "Imię może mieć maksymalnie 80 znaków";
  }
  if (input.lastName !== undefined) {
    const v = input.lastName.trim();
    if (v.length < 2) errors.lastName = "Nazwisko musi mieć co najmniej 2 znaki";
    else if (v.length > 120) errors.lastName = "Nazwisko może mieć maksymalnie 120 znaków";
  }
  if (input.dateOfBirth !== undefined && input.dateOfBirth !== null) {
    if (!DATE_PATTERN.test(input.dateOfBirth)) {
      errors.dateOfBirth = "Wymagana data w formacie YYYY-MM-DD";
    }
  }
  if (input.phone !== undefined && input.phone !== null) {
    const normalised = normalisePhone(input.phone);
    if (normalised !== null && !PHONE_DIGITS.test(normalised)) {
      errors.phone = "Numer musi mieć 9–15 cyfr (opcjonalnie z prefiksem +)";
    }
  }
  if (input.bio !== undefined && input.bio !== null) {
    if (input.bio.length > BIO_MAX) {
      errors.bio = `Bio może mieć maksymalnie ${BIO_MAX} znaków`;
    }
  }
  if (input.location !== undefined && input.location !== null) {
    const err = validateLocation(input.location);
    if (err) errors.location = err;
  }
  if (input.profileSlug !== undefined && input.profileSlug !== null) {
    const err = validateSlug(input.profileSlug);
    if (err) errors.profileSlug = err;
  }
  if (input.civilStatus !== undefined && input.civilStatus !== null) {
    if (!ALLOWED_CIVIL_STATUSES.includes(input.civilStatus)) {
      errors.civilStatus = "Nieobsługiwana wartość statusu cywilnego";
    }
  }
  if (input.socialLinks !== undefined && input.socialLinks !== null) {
    Object.assign(errors, validateSocialLinks(input.socialLinks));
  }
  return errors;
}

export function validatePersonalStatusInput(input: {
  text: string;
  emoji?: string | null;
  description?: string | null;
  visibility: PersonalStatusVisibility;
}): FieldErrors {
  const errors: FieldErrors = {};
  const text = input.text?.trim() ?? "";
  if (text.length < STATUS_TEXT_MIN) {
    errors.text = "Status nie może być pusty";
  } else if (text.length > STATUS_TEXT_MAX) {
    errors.text = `Status może mieć maksymalnie ${STATUS_TEXT_MAX} znaków`;
  }
  if (input.emoji !== undefined && input.emoji !== null) {
    if (input.emoji.length > STATUS_EMOJI_MAX) {
      errors.emoji = `Emoji może mieć maksymalnie ${STATUS_EMOJI_MAX} znaków`;
    }
  }
  if (input.description !== undefined && input.description !== null) {
    if (input.description.length > STATUS_DESCRIPTION_MAX) {
      errors.description = `Opis może mieć maksymalnie ${STATUS_DESCRIPTION_MAX} znaków`;
    }
  }
  if (!ALLOWED_PERSONAL_STATUS_VISIBILITY.includes(input.visibility)) {
    errors.visibility = "Nieobsługiwana widoczność statusu";
  }
  return errors;
}

// Re-export the stable contract so existing internal consumers keep their imports.
export { IDENTITY_VALIDATION_LIMITS } from "../validation-limits";
