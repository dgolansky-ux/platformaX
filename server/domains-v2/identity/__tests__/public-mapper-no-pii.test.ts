import { describe, expect, it } from "vitest";
import { toPublicProfileDTO, toPrivateProfileDTO } from "../mapper";
import type { PrivateProfileRecord } from "../internal/record";

const FULL_RECORD: PrivateProfileRecord = {
  userId: "u-1",
  firstName: "Anna",
  lastName: "Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
  avatarAssetId: "asset-avatar",
  bannerAssetId: "asset-banner",
  bio: "Bio liner",
  visibility: "public",
  onboardingCompleted: true,
  createdAt: "2026-05-25T10:00:00.000Z",
  updatedAt: "2026-05-25T10:00:00.000Z",
};

describe("identity public mapper — PII safety", () => {
  it("public DTO drops every PII field", () => {
    const dto = toPublicProfileDTO(FULL_RECORD);
    const json = JSON.stringify(dto);
    expect(json).not.toContain("1990-03-15");
    expect(json).not.toContain("+48600999111");
    expect(json).not.toMatch(/phone/i);
    const keys = Object.keys(dto);
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("dateOfBirth");
    expect(keys).not.toContain("email");
  });

  it("public DTO composes displayName from first + last name", () => {
    expect(toPublicProfileDTO(FULL_RECORD).displayName).toBe("Anna Kowalska");
  });

  it("public DTO falls back to a safe placeholder when names are missing", () => {
    const recordWithoutNames: PrivateProfileRecord = {
      ...FULL_RECORD,
      firstName: null,
      lastName: null,
    };
    expect(toPublicProfileDTO(recordWithoutNames).displayName).toBe(
      "Użytkownik",
    );
  });

  it("public DTO exposes media references but never raw URLs", () => {
    const dto = toPublicProfileDTO(FULL_RECORD);
    expect(dto.avatarMediaRef).toEqual({ assetId: "asset-avatar" });
    expect(dto.bannerMediaRef).toEqual({ assetId: "asset-banner" });
  });

  it("private DTO retains owner-only fields", () => {
    const dto = toPrivateProfileDTO(FULL_RECORD);
    expect(dto.phone).toBe("+48600999111");
    expect(dto.dateOfBirth).toBe("1990-03-15");
    expect(dto.onboardingCompleted).toBe(true);
  });
});
