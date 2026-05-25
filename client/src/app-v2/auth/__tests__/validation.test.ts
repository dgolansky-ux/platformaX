import { describe, expect, test } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateBirthDate,
  validatePhone,
  validateNonEmpty,
} from "../forms/validation";

describe("validateEmail", () => {
  test("rejects empty", () => {
    const r = validateEmail("");
    expect(r.valid).toBe(false);
  });
  test("rejects malformed", () => {
    expect(validateEmail("foo").valid).toBe(false);
    expect(validateEmail("foo@").valid).toBe(false);
    expect(validateEmail("@bar.pl").valid).toBe(false);
  });
  test("accepts well-formed", () => {
    expect(validateEmail("anna@example.org").valid).toBe(true);
    expect(validateEmail("  anna@example.org  ").valid).toBe(true);
  });
});

describe("validatePassword", () => {
  test("rejects empty", () => {
    expect(validatePassword("").valid).toBe(false);
  });
  test("rejects shorter than 8", () => {
    expect(validatePassword("abc").valid).toBe(false);
  });
  test("accepts >= 8 chars", () => {
    expect(validatePassword("abcdefgh").valid).toBe(true);
  });
});

describe("validatePasswordMatch", () => {
  test("rejects empty confirmation", () => {
    expect(validatePasswordMatch("abcdefgh", "").valid).toBe(false);
  });
  test("rejects mismatch", () => {
    expect(validatePasswordMatch("abcdefgh", "abcdefg!").valid).toBe(false);
  });
  test("accepts match", () => {
    expect(validatePasswordMatch("abcdefgh", "abcdefgh").valid).toBe(true);
  });
});

describe("validateBirthDate", () => {
  test("rejects wrong format", () => {
    expect(validateBirthDate("1990-03-15").valid).toBe(false);
    expect(validateBirthDate("15-03-1990").valid).toBe(false);
    expect(validateBirthDate("15/3/1990").valid).toBe(false);
  });
  test("rejects invalid month/day", () => {
    expect(validateBirthDate("32/01/1990").valid).toBe(false);
    expect(validateBirthDate("15/13/1990").valid).toBe(false);
    expect(validateBirthDate("31/02/1990").valid).toBe(false);
  });
  test("rejects year out of range", () => {
    expect(validateBirthDate("15/03/1800").valid).toBe(false);
    expect(validateBirthDate("15/03/3000").valid).toBe(false);
  });
  test("accepts valid date", () => {
    expect(validateBirthDate("15/03/1990").valid).toBe(true);
    expect(validateBirthDate("29/02/2000").valid).toBe(true);
  });
});

describe("validatePhone", () => {
  test("rejects empty", () => {
    expect(validatePhone("").valid).toBe(false);
  });
  test("rejects letters", () => {
    expect(validatePhone("600abc456").valid).toBe(false);
  });
  test("rejects too short / too long", () => {
    expect(validatePhone("12345").valid).toBe(false);
    expect(validatePhone("1234567890123456").valid).toBe(false);
  });
  test("accepts national and international formats", () => {
    expect(validatePhone("600 123 456").valid).toBe(true);
    expect(validatePhone("+48 600 123 456").valid).toBe(true);
    expect(validatePhone("600-123-456").valid).toBe(true);
  });
});

describe("validateNonEmpty", () => {
  test("rejects whitespace-only", () => {
    expect(validateNonEmpty("   ", "imię").valid).toBe(false);
  });
  test("accepts value with content", () => {
    expect(validateNonEmpty("Anna", "imię").valid).toBe(true);
  });
});
