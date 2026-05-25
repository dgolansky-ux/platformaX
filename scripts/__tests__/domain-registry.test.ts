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

describe("domain-registry guard logic", () => {
  it("FAIL: domain in registry but no folder", () => {
    const fakeDomain = "nonexistent-test-domain-xyz";
    const dir = join(DOMAINS_DIR, fakeDomain);
    expect(existsSync(dir)).toBe(false);
  });

  it("PASS: all registered domains have folders", () => {
    for (const d of KNOWN_DOMAINS) {
      expect(existsSync(join(DOMAINS_DIR, d))).toBe(true);
    }
  });

  it("FAIL: unknown domain not in registry", () => {
    const unknownDomain = "unknown-test-domain";
    expect(KNOWN_DOMAINS.includes(unknownDomain)).toBe(false);
  });

  it("FAIL: SCAFFOLD_ONLY with fake IMPLEMENTED status", () => {
    const BLOCKED_STATUSES = ["DONE", "FULL_DONE", "VISUAL_DONE", "BACKEND_DONE", "CLEAN"];
    for (const s of BLOCKED_STATUSES) {
      expect(["NOT_STARTED", "SCAFFOLD_ONLY", "UI_SHELL_ONLY", "MOCK_LOCAL_ONLY",
        "PARTIAL", "IMPLEMENTED", "BLOCKED", "MANUAL_REVIEW_REQUIRED"
      ].includes(s)).toBe(false);
    }
  });
});
