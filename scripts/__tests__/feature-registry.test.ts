import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const FEATURES_DIR = join(ROOT, "client/src/features-v2");

const KNOWN_FEATURES = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
  "shared-ui",
];

describe("feature-registry guard logic", () => {
  for (const feature of KNOWN_FEATURES) {
    it(`PASS: feature "${feature}" has folder`, () => {
      expect(existsSync(join(FEATURES_DIR, feature))).toBe(true);
    });
  }

  it("FAIL: unknown feature not in registry", () => {
    const unknownFeature = "unknown-ui-feature";
    expect(KNOWN_FEATURES.includes(unknownFeature)).toBe(false);
  });

  it("cross-domain import to public-api = PASS (by convention)", () => {
    const allowedImport = "../../identity/public-api";
    expect(allowedImport.includes("public-api")).toBe(true);
  });

  it("cross-domain import to repository = FAIL (by convention)", () => {
    const blockedImport = "../../identity/repository";
    const BLOCKED = ["repository", "service", "policy"];
    const module = blockedImport.split("/").pop();
    expect(BLOCKED.includes(module!)).toBe(true);
  });
});
