import { describe, it, expect } from "vitest";

describe("media domain contract", () => {
  it("public-api exposes the service factory", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.createMediaService).toBe("function");
  });

  it("does NOT expose in-memory repository / env-required storage factories", async () => {
    // These are implementation details. Composition imports them from
    // ./repository directly, never through the public API.
    const mod: Record<string, unknown> = await import("../public-api");
    expect(mod.createInMemoryMediaRepository).toBeUndefined();
    expect(mod.createEnvRequiredStoragePort).toBeUndefined();
  });

  it("public-api exposes policy helpers and validation limits", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.canCreateUploadIntent).toBe("function");
    expect(mod.MEDIA_VALIDATION_LIMITS.allowedMimeTypes.length).toBeGreaterThan(0);
  });

  it("exports cross-domain contracts and events modules", async () => {
    expect(await import("../contracts")).toBeDefined();
    expect(await import("../events")).toBeDefined();
  });
});
