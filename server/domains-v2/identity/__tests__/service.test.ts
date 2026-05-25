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
