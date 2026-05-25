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
    await adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
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
    await adapter.completeOnboarding("u-1", {
      firstName: "Anna",
      lastName: "Kowalska",
      dateOfBirth: "1990-03-15",
      phone: "+48600999111",
    });
    const result = await adapter.getMyProfile("u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phone).toBe("+48600999111");
    expect(result.value.dateOfBirth).toBe("1990-03-15");
  });
});
