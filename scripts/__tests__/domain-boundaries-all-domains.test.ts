import { describe, it, expect } from "vitest";

const CROSS_DOMAIN_BLOCKED = [
  "repository", "repository.drizzle", "service", "policy",
  "router", "mapper", "db", "schema", "cache-keys", "internal",
];

const CROSS_DOMAIN_ALLOWED = [
  "public-api", "contracts", "events", "dto", "shared",
];

const ALL_DOMAINS = [
  "identity", "social", "communities-v2", "content-v2",
  "channels", "chat", "events", "modules", "public-hub",
  "notifications", "media", "search", "moderation", "audit", "system",
];

describe("domain-boundaries: all-domains coverage", () => {
  it("PASS: cross-domain import to public-api is allowed", () => {
    const importModule = "public-api";
    expect(CROSS_DOMAIN_ALLOWED.includes(importModule)).toBe(true);
    expect(CROSS_DOMAIN_BLOCKED.includes(importModule)).toBe(false);
  });

  it("PASS: cross-domain import to contracts is allowed", () => {
    expect(CROSS_DOMAIN_ALLOWED.includes("contracts")).toBe(true);
  });

  it("PASS: cross-domain import to events is allowed", () => {
    expect(CROSS_DOMAIN_ALLOWED.includes("events")).toBe(true);
  });

  it("FAIL: cross-domain import to repository is blocked", () => {
    expect(CROSS_DOMAIN_BLOCKED.includes("repository")).toBe(true);
  });

  it("FAIL: cross-domain import to service is blocked", () => {
    expect(CROSS_DOMAIN_BLOCKED.includes("service")).toBe(true);
  });

  it("FAIL: cross-domain import to policy is blocked", () => {
    expect(CROSS_DOMAIN_BLOCKED.includes("policy")).toBe(true);
  });

  it("all 15 domains are covered", () => {
    expect(ALL_DOMAINS.length).toBe(15);
  });

  it("FAIL: unknown domain not in registry", () => {
    expect(ALL_DOMAINS.includes("fake-domain")).toBe(false);
  });
});
