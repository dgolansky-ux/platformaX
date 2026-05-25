export type FieldValidation = { valid: true } | { valid: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): FieldValidation {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, message: "Podaj adres e-mail" };
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { valid: false, message: "Niepoprawny format adresu e-mail" };
  }
  return { valid: true };
}

export function validatePassword(value: string): FieldValidation {
  if (!value) return { valid: false, message: "Podaj hasło" };
  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków`,
    };
  }
  return { valid: true };
}

export function validatePasswordMatch(
  password: string,
  confirmation: string,
): FieldValidation {
  if (!confirmation) {
    return { valid: false, message: "Powtórz hasło, aby je potwierdzić" };
  }
  if (password !== confirmation) {
    return { valid: false, message: "Hasła nie są identyczne" };
  }
  return { valid: true };
}

export function validateNonEmpty(value: string, label: string): FieldValidation {
  if (!value.trim()) return { valid: false, message: `Podaj ${label}` };
  return { valid: true };
}

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function validateBirthDate(value: string): FieldValidation {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return { valid: false, message: "Format: dzień/miesiąc/rok, np. 15/03/1990" };
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const currentYear = new Date().getUTCFullYear();
  if (year < 1900 || year > currentYear) {
    return { valid: false, message: "Niepoprawny rok urodzenia" };
  }
  if (month < 1 || month > 12) {
    return { valid: false, message: "Niepoprawny miesiąc" };
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, message: "Niepoprawny dzień" };
  }
  return { valid: true };
}

const PHONE_DIGITS = /^\+?\d{9,15}$/;

export function validatePhone(value: string): FieldValidation {
  const normalized = value.replace(/[\s-]/g, "");
  if (!normalized) return { valid: false, message: "Podaj numer telefonu" };
  if (!PHONE_DIGITS.test(normalized)) {
    return {
      valid: false,
      message: "Numer musi mieć 9–15 cyfr (opcjonalnie z prefiksem +)",
    };
  }
  return { valid: true };
}

export const MIN_PASSWORD_LENGTH_HINT = MIN_PASSWORD_LENGTH;
