import { describe, expect, it } from "vitest";

/**
 * Cross-domain contract test. Verifies the public surface this domain promises
 * to other domains: factories, types, predicates and event contracts.
 * Internal modules must NOT be reachable from this test.
 */
describe("identity domain contract", () => {
  it("exposes the service factory from public-api", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.createIdentityService).toBe("function");
  });

  it("does NOT expose the in-memory repository implementation factory", async () => {
    // The in-memory repository is an implementation detail. Composition must
    // import it from ./repository directly, never through the public API.
    const mod: Record<string, unknown> = await import("../public-api");
    expect(mod.createInMemoryIdentityProfileRepository).toBeUndefined();
  });

  it("exposes policy predicates from public-api", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.canReadPrivateProfile).toBe("function");
    expect(typeof mod.canReadPublicProfile).toBe("function");
    expect(typeof mod.canUpdatePrivateProfile).toBe("function");
    expect(typeof mod.canCompleteOnboarding).toBe("function");
  });

  it("exposes validation limits from public-api", async () => {
    const mod = await import("../public-api");
    expect(mod.IDENTITY_VALIDATION_LIMITS.firstNameMin).toBe(2);
    expect(mod.IDENTITY_VALIDATION_LIMITS.bioMax).toBe(175);
  });

  it("barrel re-exports the public-api surface", async () => {
    const barrel = await import("../index");
    expect(typeof barrel.createIdentityService).toBe("function");
  });
});
