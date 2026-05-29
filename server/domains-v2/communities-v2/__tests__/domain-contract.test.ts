import { describe, it, expect } from "vitest";

describe("communities-v2 domain contract", () => {
  it("public-api exposes the communities service factory (BACKEND_PARTIAL)", async () => {
    // Graduated from SCAFFOLD_ONLY to BACKEND_PARTIAL by the product-backend
    // foundations slice. public-api now exports the service factory + in-memory
    // repositories; see public-api.ts and docs/review/product-backend-foundations.
    const mod = await import("../public-api");
    expect("createCommunitiesService" in mod).toBe(true);
    expect("createInMemoryCommunityRepository" in mod).toBe(true);
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
