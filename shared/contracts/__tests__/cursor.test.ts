import { describe, it, expect } from "vitest";
import {
  encodeOpaqueCursor,
  decodeOpaqueCursor,
} from "@shared/contracts/cursor";

describe("opaque cursor", () => {
  it("round-trips a string rank", () => {
    const encoded = encodeOpaqueCursor({ lastId: "id_9", lastRank: "2026-05-27" });
    const decoded = decodeOpaqueCursor(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.lastId).toBe("id_9");
      expect(decoded.value.lastRank).toBe("2026-05-27");
    }
  });

  it("round-trips a numeric rank", () => {
    const encoded = encodeOpaqueCursor({ lastId: "id_1", lastRank: 1234 });
    const decoded = decodeOpaqueCursor(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value.lastRank).toBe(1234);
  });

  it("produces base64url output (no +, /, or = padding)", () => {
    const encoded = encodeOpaqueCursor({ lastId: "id_1", lastRank: "rank" });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns INVALID_CURSOR for non-decodable input", () => {
    const decoded = decodeOpaqueCursor("!!!malformed-cursor-input!!!");
    expect(decoded.ok).toBe(false);
    if (!decoded.ok) expect(decoded.error.code).toBe("INVALID_CURSOR");
  });

  it("returns INVALID_CURSOR for malformed payload", () => {
    // Truncated encoded payload — opaque encoding intentionally not described inline.
    const bad = encodeOpaqueCursor({ lastId: "x", lastRank: 1 }).slice(0, 4);
    const decoded = decodeOpaqueCursor(bad);
    expect(decoded.ok).toBe(false);
  });
});
