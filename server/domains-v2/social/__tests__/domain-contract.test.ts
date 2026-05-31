import { describe, it, expect } from "vitest";

describe("social domain contract", () => {
  it("public-api exposes the social-contacts factory (BACKEND_PARTIAL)", async () => {
    // The Kontakty slice (feat/contacts-v2-clean-room-slice) graduated this
    // domain from SCAFFOLD_ONLY to BACKEND_PARTIAL. The public-api surface
    // now exports `createSocialContactsService` and the in-memory factories;
    // see server/domains-v2/social/public-api.ts and
    // docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md.
    const mod = await import("../public-api");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
    expect("createSocialContactsService" in mod).toBe(true);
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
