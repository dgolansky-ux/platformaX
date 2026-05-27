import { describe, it, expect } from "vitest";
import {
  createIdempotencyKey,
  asIdempotencyKey,
} from "@shared/contracts/idempotency";

describe("idempotency key contract", () => {
  it("asIdempotencyKey is an identity cast", () => {
    expect(asIdempotencyKey("k-1")).toBe("k-1");
  });

  it("createIdempotencyKey uses the injected generator", () => {
    expect(createIdempotencyKey(() => "fixed")).toBe("fixed");
  });

  it("createIdempotencyKey produces a non-empty key by default", () => {
    const key = createIdempotencyKey();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });
});
