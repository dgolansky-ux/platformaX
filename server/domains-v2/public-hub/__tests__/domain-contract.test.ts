import { describe, it, expect } from "vitest";

describe("public-hub domain contract", () => {
  it("public-api exposes the composition factory", async () => {
    const mod = await import("../public-api");
    expect("createPublicHubService" in mod).toBe(true);
    expect("visibleSections" in mod).toBe(true);
  });

  it("exports from public-api", async () => {
    const mod = await import("../public-api");
    expect(mod).toBeDefined();
  });

  it("exports from contracts", async () => {
    const mod = await import("../contracts");
    expect(mod).toBeDefined();
  });

  it("exports from events", async () => {
    const mod = await import("../events");
    expect(mod).toBeDefined();
  });
});
