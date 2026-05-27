import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
  type IdentityEvent,
  type IdentityService,
} from "../public-api";

const OWNER = "user-1";
const STRANGER = "user-2";
const NOW = "2026-05-25T12:00:00.000Z";

function buildService(events: IdentityEvent[] = []) {
  const repository = createInMemoryIdentityProfileRepository();
  const service: IdentityService = createIdentityService({
    repository,
    clock: () => NOW,
    publish: (event) => events.push(event),
  });
  return { service, repository, events };
}

describe("identity service — completeOnboarding", () => {
  let captured: IdentityEvent[];
  let service: IdentityService;

  beforeEach(() => {
    captured = [];
    service = buildService(captured).service;
  });

  it("persists the onboarding payload and flips onboardingCompleted", async () => {
    const result = await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48 600 999 111",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.firstName).toBe("Anna");
    expect(result.value.lastName).toBe("Kowalska");
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.dateOfBirth).toBe("1990-03-15");
    expect(result.value.onboardingCompleted).toBe(true);
    expect(result.value.visibility).toBe("public");
  });

  it("emits onboarding + public-summary events on completion", async () => {
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const types = captured.map((e) => e.type);
    expect(types).toContain("identity.onboarding.completed");
    expect(types).toContain("identity.profile.public_summary_changed");
    for (const event of captured) {
      const json = JSON.stringify(event);
      expect(json).not.toContain("Anna");
      expect(json).not.toContain("Kowalska");
      expect(json).not.toContain("1990-03-15");
      expect(json).not.toContain("+48600999111");
    }
  });

  it("rejects invalid input with field-level errors", async () => {
    const result = await service.completeOnboarding(OWNER, {
      firstName: "A",
      lastName: "",
      dateOfBirth: "not-a-date",
      phone: "abc",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.firstName).toBeTruthy();
    expect(result.error.fields?.lastName).toBeTruthy();
    expect(result.error.fields?.dateOfBirth).toBeTruthy();
    expect(result.error.fields?.phone).toBeTruthy();
  });

  it("rejects a second completion as ALREADY_COMPLETED", async () => {
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const second = await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("ALREADY_COMPLETED");
  });
});

describe("identity service — getMyProfile / updatePrivateProfile", () => {
  it("getMyProfile returns the persisted private DTO for the owner", async () => {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const result = await service.getMyProfile(OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.userId).toBe(OWNER);
    expect(result.value.phone).toBe("+48600999111");
  });

  it("getMyProfile returns NOT_FOUND for a user without a profile", async () => {
    const { service } = buildService();
    const result = await service.getMyProfile("ghost");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("updatePrivateProfile patches owner fields and emits a public-summary event", async () => {
    const events: IdentityEvent[] = [];
    const { service } = buildService(events);
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    events.length = 0;
    const result = await service.updatePrivateProfile(OWNER, {
      bio: "Nowe bio",
      visibility: "friends",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bio).toBe("Nowe bio");
    expect(result.value.visibility).toBe("friends");
    expect(events.some((e) => e.type === "identity.profile.public_summary_changed")).toBe(true);
  });

  it("updatePrivateProfile rejects oversized bio with field-level error", async () => {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const result = await service.updatePrivateProfile(OWNER, {
      bio: "x".repeat(200),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.bio).toBeTruthy();
  });
});

describe("identity service — getPublicProfile", () => {
  it("strangers get the PII-free public DTO when visibility is public", async () => {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const result = await service.getPublicProfile(STRANGER, OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const dto = result.value;
    expect(dto.displayName).toBe("Anna Kowalska");
    const json = JSON.stringify(dto);
    expect(json).not.toContain("1990-03-15");
    expect(json).not.toContain("+48600999111");
    expect(Object.keys(dto)).not.toContain("phone");
    expect(Object.keys(dto)).not.toContain("dateOfBirth");
  });

  it("strangers cannot see a profile with friends-only visibility", async () => {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    await service.updatePrivateProfile(OWNER, { visibility: "friends" });
    const result = await service.getPublicProfile(STRANGER, OWNER);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("FORBIDDEN");
  });

  it("friends-only visibility is visible to a resolved friend viewer", async () => {
    const repository = createInMemoryIdentityProfileRepository();
    const resolveViewerRole = vi.fn(async () => "friend" as const);
    const service = createIdentityService({
      repository,
      clock: () => NOW,
      resolveViewerRole,
    });
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    await service.updatePrivateProfile(OWNER, { visibility: "friends" });
    const result = await service.getPublicProfile(STRANGER, OWNER);
    expect(result.ok).toBe(true);
    expect(resolveViewerRole).toHaveBeenCalledWith(STRANGER, OWNER);
  });

  it("returns NOT_FOUND when the profile does not exist", async () => {
    const { service } = buildService();
    const result = await service.getPublicProfile(STRANGER, "ghost");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});

describe("identity service — personal status", () => {
  async function seed() {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    return service;
  }

  it("updatePersonalStatus persists text/emoji/visibility and surfaces it via getMyProfile", async () => {
    const service = await seed();
    const updated = await service.updatePersonalStatus(OWNER, {
      text: "produktywny",
      emoji: "🚀",
      description: "skupiona na release",
      visibility: "public",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.personalStatus?.text).toBe("produktywny");
    expect(updated.value.personalStatus?.visibility).toBe("public");
  });

  it("clearPersonalStatus removes the status entirely", async () => {
    const service = await seed();
    await service.updatePersonalStatus(OWNER, { text: "tymczasowy", visibility: "public" });
    const cleared = await service.clearPersonalStatus(OWNER);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.personalStatus).toBeNull();
  });

  it("updatePersonalStatus rejects empty text with INVALID_INPUT", async () => {
    const service = await seed();
    const result = await service.updatePersonalStatus(OWNER, {
      text: "   ",
      visibility: "public",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.text).toBeTruthy();
  });

  it("attachStatusPhotoMediaRef requires an active status (INVALID_INPUT otherwise)", async () => {
    const service = await seed();
    const result = await service.attachStatusPhotoMediaRef(OWNER, "asset-x");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
  });

  it("attachStatusPhotoMediaRef stores the ref once status exists", async () => {
    const service = await seed();
    await service.updatePersonalStatus(OWNER, { text: "skupiona", visibility: "public" });
    const result = await service.attachStatusPhotoMediaRef(OWNER, "asset-x");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.personalStatus?.photoMediaRef).toEqual({ assetId: "asset-x" });
  });

  it("getPublicProfile hides a friends_only personal status from strangers", async () => {
    const service = await seed();
    await service.updatePersonalStatus(OWNER, {
      text: "tylko znajomi",
      visibility: "friends_only",
    });
    const result = await service.getPublicProfile(STRANGER, OWNER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.personalStatus).toBeNull();
  });
});

describe("identity service — personal profile fields", () => {
  async function seed() {
    const { service } = buildService();
    await service.completeOnboarding(OWNER, {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    return service;
  }

  it("updatePrivateProfile accepts location, profileSlug, civilStatus and socialLinks", async () => {
    const service = await seed();
    const result = await service.updatePrivateProfile(OWNER, {
      location: "Kraków",
      profileSlug: "anna-k",
      civilStatus: "partnered",
      socialLinks: { linkedin: "https://linkedin.com/in/anna" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.location).toBe("Kraków");
    expect(result.value.profileSlug).toBe("anna-k");
    expect(result.value.civilStatus).toBe("partnered");
    expect(result.value.socialLinks?.linkedin).toBe("https://linkedin.com/in/anna");
  });

  it("updatePrivateProfile rejects invalid slug with field-level error", async () => {
    const service = await seed();
    const result = await service.updatePrivateProfile(OWNER, { profileSlug: "AB" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.profileSlug).toBeTruthy();
  });

  it("updatePrivateProfile rejects a non-https social link", async () => {
    const service = await seed();
    const result = await service.updatePrivateProfile(OWNER, {
      socialLinks: { github: "ftp://github.com/anna" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.["socialLinks.github"]).toBeTruthy();
  });

  it("updatePrivateProfile rejects an unknown civilStatus value", async () => {
    const service = await seed();
    const result = await service.updatePrivateProfile(OWNER, {
      civilStatus: "married_with_kids" as never,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.civilStatus).toBeTruthy();
  });

  it("attachAvatarMediaRef and attachBannerMediaRef thinly set the refs", async () => {
    const service = await seed();
    const a = await service.attachAvatarMediaRef(OWNER, "asset-a");
    const b = await service.attachBannerMediaRef(OWNER, "asset-b");
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(b.value.avatarMediaRef).toEqual({ assetId: "asset-a" });
    expect(b.value.bannerMediaRef).toEqual({ assetId: "asset-b" });
  });
});
