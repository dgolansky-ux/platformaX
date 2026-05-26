import { describe, expect, it } from "vitest";
import { createProfileAdapter } from "../profile-adapter";
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
} from "@server/domains-v2/identity/public-api";

describe("profileAdapter (frontend boundary)", () => {
  function buildAdapter() {
    const repository = createInMemoryIdentityProfileRepository();
    const service = createIdentityService({
      repository,
      clock: () => "2026-05-25T12:00:00.000Z",
    });
    return createProfileAdapter({ service, isPersistent: false });
  }

  async function seedOnboarded(adapter: ReturnType<typeof buildAdapter>) {
    return adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
  }

  it("reports isPersistent honestly while running in-memory", () => {
    const adapter = buildAdapter();
    expect(adapter.isPersistent()).toBe(false);
  });

  it("completeOnboarding writes through the service and returns a private DTO", async () => {
    const adapter = buildAdapter();
    const result = await adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.onboardingCompleted).toBe(true);
    expect(result.value.userId).toBe("u-1");
  });

  it("getPublicProfile after onboarding never returns PII", async () => {
    const adapter = buildAdapter();
    await seedOnboarded(adapter);
    const result = await adapter.getPublicProfile("viewer-2", "u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const json = JSON.stringify(result.value);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
    expect(Object.keys(result.value)).not.toContain("phone");
    expect(Object.keys(result.value)).not.toContain("dateOfBirth");
  });

  it("getMyProfile returns the owner-only DTO", async () => {
    const adapter = buildAdapter();
    await seedOnboarded(adapter);
    const result = await adapter.getMyProfile("u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.dateOfBirth).toBe("1990-03-15");
  });

  it("updateMyProfile patches bio through the identity boundary", async () => {
    const adapter = buildAdapter();
    await seedOnboarded(adapter);
    const updated = await adapter.updateMyProfile("u-1", { bio: "Hello world" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.bio).toBe("Hello world");

    const fetched = await adapter.getMyProfile("u-1");
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) return;
    expect(fetched.value.bio).toBe("Hello world");
  });

  it("updateMyProfile patches avatar/banner media refs only (no payload)", async () => {
    const adapter = buildAdapter();
    await seedOnboarded(adapter);
    const updated = await adapter.updateMyProfile("u-1", {
      avatarMediaRef: { assetId: "asset-a" },
      bannerMediaRef: { assetId: "asset-b" },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.avatarMediaRef).toEqual({ assetId: "asset-a" });
    expect(updated.value.bannerMediaRef).toEqual({ assetId: "asset-b" });
  });

  it("updateMyProfile surfaces validation errors as a typed failure", async () => {
    const adapter = buildAdapter();
    await seedOnboarded(adapter);
    const longBio = "x".repeat(200);
    const result = await adapter.updateMyProfile("u-1", { bio: longBio });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_INPUT");
    expect(result.error.fields?.bio).toContain("175");
  });

  it("updateMyProfile NOT_FOUND when there is no profile", async () => {
    const adapter = buildAdapter();
    const result = await adapter.updateMyProfile("nobody", { bio: "x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
