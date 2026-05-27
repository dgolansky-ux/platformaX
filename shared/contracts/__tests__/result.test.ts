import { describe, it, expect } from "vitest";
import { ok, err, isOk, type Result, type DomainError } from "@shared/contracts/result";

describe("Result / DomainError contract", () => {
  it("ok() wraps a value", () => {
    const r: Result<number, DomainError> = ok(42);
    expect(r.ok).toBe(true);
    expect(isOk(r)).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("err() wraps a typed domain error", () => {
    const error: DomainError<"NOPE"> = { code: "NOPE", message: "no" };
    const r: Result<number, DomainError<"NOPE">> = err(error);
    expect(r.ok).toBe(false);
    expect(isOk(r)).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("NOPE");
      expect(r.error.message).toBe("no");
    }
  });

  it("DomainError supports an optional field map", () => {
    const error: DomainError = {
      code: "INVALID_INPUT",
      message: "bad",
      fields: { name: "required" },
    };
    expect(error.fields?.name).toBe("required");
  });
});
