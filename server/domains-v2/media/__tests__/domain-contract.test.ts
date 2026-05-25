import { describe, it, expect } from "vitest";

describe("media domain contract", () => {
  it("public-api exposes the service + composition factories", async () => {
    const mod = await import("../public-api");
    expect(typeof mod.createMediaService).toBe("function");
    expect(typeof mod.createInMemoryMediaRepository).toBe("function");
    expect(typeof mod.createEnvRequiredStoragePort).toBe("function");
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
