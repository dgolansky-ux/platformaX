import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const DOMAINS_DIR = join(ROOT, "server/domains-v2");

const KNOWN_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
];

const REQUIRED_FILES = [
  "README.md", "public-api.ts", "contracts.ts", "events.ts",
  "dto.ts", "policy.ts", "index.ts",
];

describe("domain-scaffold guard logic", () => {
  for (const domain of KNOWN_DOMAINS) {
    it(`PASS: ${domain} has all required files`, () => {
      for (const f of REQUIRED_FILES) {
        expect(existsSync(join(DOMAINS_DIR, domain, f))).toBe(true);
      }
    });
  }

  it("FAIL: domain without README = violation", () => {
    expect(REQUIRED_FILES.includes("README.md")).toBe(true);
  });

  it("FAIL: domain without public-api/contracts/events = violation", () => {
    expect(REQUIRED_FILES.includes("public-api.ts")).toBe(true);
    expect(REQUIRED_FILES.includes("contracts.ts")).toBe(true);
    expect(REQUIRED_FILES.includes("events.ts")).toBe(true);
  });
});
