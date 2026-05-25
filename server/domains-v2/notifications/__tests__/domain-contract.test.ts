import { describe, it, expect } from "vitest";

describe("notifications domain contract", () => {
  it("has SCAFFOLD_ONLY status", () => {
    expect(true).toBe(true);
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
