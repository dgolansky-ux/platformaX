import { describe, it, expect } from "vitest";

describe("public-hub domain contract", () => {
  it("public-api exposes no runtime surface yet (SCAFFOLD_ONLY)", async () => {
    const mod = await import("../public-api");
    expect(Object.keys(mod)).toHaveLength(0);
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
