import { describe, it, expect } from "vitest";

describe("channels domain contract", () => {
  it("public-api exposes the channels service factory (BACKEND_PARTIAL)", async () => {
    const mod = await import("../public-api");
    expect("createChannelsService" in mod).toBe(true);
    expect("createInMemoryChannelRepository" in mod).toBe(true);
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
