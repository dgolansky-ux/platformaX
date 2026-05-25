/**
 * identity — input validation (internal)
 *
 * Mirrors the V2 onboarding shell validation so service-level use-cases reject
 * the same bad inputs that the UI already blocks, plus a few server-side
 * normalisations the UI cannot enforce.
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_DIGITS = /^\+?\d{9,15}$/;
const BIO_MAX = 175;

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

export function validateUpdateInput(input: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  bio?: string | null;
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
  return errors;
}

export const IDENTITY_VALIDATION_LIMITS = {
  firstNameMin: 2,
  firstNameMax: 80,
  lastNameMin: 2,
  lastNameMax: 120,
  phoneMin: 9,
  phoneMax: 15,
  bioMax: BIO_MAX,
};
