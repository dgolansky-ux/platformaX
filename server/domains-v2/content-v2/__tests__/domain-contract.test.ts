import { describe, it, expect } from "vitest";

describe("content-v2 domain contract", () => {
  it("public-api exposes the content service factory (BACKEND_PARTIAL)", async () => {
    const mod = await import("../public-api");
    expect("createContentService" in mod).toBe(true);
    expect("createInMemoryPostRepository" in mod).toBe(true);
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
