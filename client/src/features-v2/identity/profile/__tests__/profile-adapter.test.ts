/**
 * profileAdapter — local mock contract tests.
 *
 * The frontend adapter is intentionally a MOCK_LOCAL_ONLY in-memory
 * implementation (no `@server/*` runtime, no localStorage/sessionStorage). End-
 * to-end composition behavior (visibility filtering, owner attach semantics,
 * field validation) lives under `server/application-v2/profile/__tests__` —
 * which is the canonical owner of the real composition. Here we only verify
 * the mock contract: `isPersistent` is honest, completed onboarding round-trips
 * into `getMyProfileView`, and the public view never leaks owner-only fields.
 */
import { describe, expect, it } from "vitest";
import { createMockProfileAdapter } from "../profile-adapter";

const ONBOARDING_INPUT = {
  firstName: "Anna",
  lastName: "Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
} as const;

describe("profileAdapter (frontend mock boundary)", () => {
  it("reports isPersistent honestly as false (MOCK_LOCAL_ONLY)", () => {
    const adapter = createMockProfileAdapter();
    expect(adapter.isPersistent()).toBe(false);
  });

  it("completeOnboarding round-trips into getMyProfileView with owner fields", async () => {
    const adapter = createMockProfileAdapter();
    const onboarded = await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    expect(onboarded.ok).toBe(true);
    if (!onboarded.ok) return;
    expect(onboarded.value.onboardingCompleted).toBe(true);
    expect(onboarded.value.isOwner).toBe(true);

    const fetched = await adapter.getMyProfileView("u-1");
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) return;
    expect(fetched.value.phone).toBe("+48600999111");
    expect(fetched.value.dateOfBirth).toBe("1990-03-15");
    expect(fetched.value.displayName).toBe("Anna Kowalska");
  });

  it("getPublicProfileView never returns owner-only fields", async () => {
    const adapter = createMockProfileAdapter();
    await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    const result = await adapter.getPublicProfileView("viewer-2", "u-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const keys = Object.keys(result.value);
    expect(keys).not.toContain("phone");
    expect(keys).not.toContain("dateOfBirth");
    const json = JSON.stringify(result.value);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
    expect(result.value.isOwner).toBe(false);
  });

  it("updateMyProfile patches bio and the patch is visible in getMyProfileView", async () => {
    const adapter = createMockProfileAdapter();
    await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    const updated = await adapter.updateMyProfile("u-1", { bio: "Hello world" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.bio).toBe("Hello world");
    const fetched = await adapter.getMyProfileView("u-1");
    if (!fetched.ok) return;
    expect(fetched.value.bio).toBe("Hello world");
  });

  it("attachProfileAvatarRef stores the assetId on the owner view", async () => {
    const adapter = createMockProfileAdapter();
    await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    const attached = await adapter.attachProfileAvatarRef("u-1", "asset-123");
    expect(attached.ok).toBe(true);
    if (!attached.ok) return;
    expect(attached.value.avatar?.assetId).toBe("asset-123");
    expect(attached.value.avatar?.url).toBeNull();
  });

  it("getMyProfileView returns PROFILE_NOT_FOUND before onboarding", async () => {
    const adapter = createMockProfileAdapter();
    const result = await adapter.getMyProfileView("nobody");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_NOT_FOUND");
  });

  it("updateMyProfile returns PROFILE_NOT_FOUND when there is no profile", async () => {
    const adapter = createMockProfileAdapter();
    const result = await adapter.updateMyProfile("nobody", { bio: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PROFILE_NOT_FOUND");
  });

  it("completeOnboarding twice maps to ONBOARDING_ALREADY_COMPLETED", async () => {
    const adapter = createMockProfileAdapter();
    await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    const second = await adapter.completeOnboarding("u-1", ONBOARDING_INPUT);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("ONBOARDING_ALREADY_COMPLETED");
  });
});
