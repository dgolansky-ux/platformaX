// ALLOW_PRIVATE_DTO_PII — this test defensively enforces that the deterministic
// seed contains no PII keys/values; it mentions "phone"/"dateOfBirth"/"email" by
// name only to assert their ABSENCE, not their presence.
import { describe, it, expect } from "vitest";
import {
  SEED_OWNER_USER_ID,
  SEED_COMMUNITY_ID,
  seedPublicProfile,
  seedContacts,
  seedCommunity,
} from "@shared/test-seeds/profile-seed";

describe("deterministic profile seed", () => {
  it("uses fixed, stable IDs", () => {
    expect(SEED_OWNER_USER_ID).toBe("seed-user-0001");
    expect(SEED_COMMUNITY_ID).toBe("seed-community-0001");
    expect(seedCommunity.id).toBe("seed-community-0001");
    expect(seedContacts.map((c) => c.id)).toEqual([
      "seed-contact-0001",
      "seed-contact-0002",
    ]);
  });

  it("public profile fixture carries no PII keys", () => {
    const keys = Object.keys(seedPublicProfile);
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("dateOfBirth");
    expect(keys).not.toContain("email");
  });

  it("fixture content contains no email or phone literals", () => {
    const json = JSON.stringify({ seedPublicProfile, seedContacts, seedCommunity });
    expect(json).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(json).not.toMatch(/\+\d[\d\s-]{6,}\d/);
  });
});
