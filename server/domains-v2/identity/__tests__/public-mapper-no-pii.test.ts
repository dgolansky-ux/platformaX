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
  location: "Kraków",
  profileSlug: "anna-k",
  statusText: "produktywny",
  statusEmoji: "🚀",
  statusDescription: "skupiona na release",
  statusVisibility: "public",
  statusPhotoAssetId: "asset-status",
  civilStatus: "partnered",
  socialLinks: { linkedin: "https://linkedin.com/in/anna" },
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

  it("public DTO falls back to a safe displayName when names are missing", () => {
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

  it("public DTO carries the public personal-status to a stranger when visibility is public", () => {
    const dto = toPublicProfileDTO(FULL_RECORD, "stranger");
    expect(dto.personalStatus).toEqual({
      text: "produktywny",
      emoji: "🚀",
      description: "skupiona na release",
      visibility: "public",
      photoMediaRef: { assetId: "asset-status" },
    });
  });

  it("public DTO drops a friends_only personal-status for a stranger", () => {
    const dto = toPublicProfileDTO(
      { ...FULL_RECORD, statusVisibility: "friends_only" },
      "stranger",
    );
    expect(dto.personalStatus).toBeNull();
  });

  it("public DTO drops a private personal-status even for a friend", () => {
    const dto = toPublicProfileDTO(
      { ...FULL_RECORD, statusVisibility: "private" },
      "friend",
    );
    expect(dto.personalStatus).toBeNull();
  });

  it("public DTO returns a friends_only personal-status to a resolved friend", () => {
    const dto = toPublicProfileDTO(
      { ...FULL_RECORD, statusVisibility: "friends_only" },
      "friend",
    );
    expect(dto.personalStatus?.visibility).toBe("friends_only");
  });

  it("public DTO carries non-PII personal-profile fields (location, slug, civilStatus, socialLinks)", () => {
    const dto = toPublicProfileDTO(FULL_RECORD);
    expect(dto.location).toBe("Kraków");
    expect(dto.profileSlug).toBe("anna-k");
    expect(dto.civilStatus).toBe("partnered");
    expect(dto.socialLinks).toEqual({ linkedin: "https://linkedin.com/in/anna" });
  });

  it("private DTO retains owner-only fields and exposes the composed personal status", () => {
    const dto = toPrivateProfileDTO(FULL_RECORD);
    expect(dto.phone).toBe("+48600999111");
    expect(dto.dateOfBirth).toBe("1990-03-15");
    expect(dto.onboardingCompleted).toBe(true);
    expect(dto.personalStatus?.text).toBe("produktywny");
  });
});
