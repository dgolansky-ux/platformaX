import { describe, it, expect } from "vitest";

describe("modules domain contract", () => {
  it("public-api exposes the modules service factory (BACKEND_PARTIAL)", async () => {
    const mod = await import("../public-api");
    expect("createModulesService" in mod).toBe(true);
    expect("MODULE_DEFINITIONS" in mod).toBe(true);
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
