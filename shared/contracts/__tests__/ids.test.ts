import { describe, it, expect } from "vitest";
import {
  asUserId,
  asMediaAssetId,
  asIdempotencyKey,
  type UserId,
  type MediaAssetId,
} from "@shared/contracts/ids";

// Compile-level smoke: a function that only accepts a branded UserId must not
// accept a MediaAssetId or a raw string without the constructor.
function takesUserId(id: UserId): string {
  return id;
}

function takesMediaAssetId(id: MediaAssetId): string {
  return id;
}

describe("branded IDs", () => {
  it("constructors are identity casts at runtime", () => {
    expect(asUserId("u_1")).toBe("u_1");
    expect(asMediaAssetId("m_1")).toBe("m_1");
    expect(asIdempotencyKey("k_1")).toBe("k_1");
  });

  it("branded values flow into functions expecting their brand", () => {
    expect(takesUserId(asUserId("u_2"))).toBe("u_2");
    expect(takesMediaAssetId(asMediaAssetId("m_2"))).toBe("m_2");
  });
});
