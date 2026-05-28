import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMAIN_REGISTRY } from "../../domain-registry";

const ROOT = process.cwd();
const DOMAIN = "chat";
const DOMAIN_DIR = join(ROOT, "server/domains-v2", DOMAIN);

function expectStatusScaffoldOnlyInDomainStatusRegistry() {
  const yml = readFileSync(
    join(ROOT, "docs/governance/DOMAIN_STATUS_REGISTRY.yml"),
    "utf-8",
  );
  const blockStart = yml.indexOf(`- name: ${DOMAIN}`);
  expect(blockStart).toBeGreaterThanOrEqual(0);

  const block = yml.slice(blockStart, blockStart + 400);
  expect(block).toContain("status: SCAFFOLD_ONLY");
}

describe("chat domain contract", () => {
  it("has SCAFFOLD_ONLY status", () => {
    const entry = DOMAIN_REGISTRY.find((d) => d.name === DOMAIN);
    expect(entry).toBeDefined();
    expect(entry?.status).toBe("SCAFFOLD_ONLY");
    expectStatusScaffoldOnlyInDomainStatusRegistry();
  });

  it("has required scaffold files", () => {
    const required = [
      "README.md",
      "public-api.ts",
      "contracts.ts",
      "dto.ts",
      "policy.ts",
      "events.ts",
      "index.ts",
    ];

    for (const file of required) {
      expect(existsSync(join(DOMAIN_DIR, file)), `${DOMAIN}/${file} missing`).toBe(
        true,
      );
    }
  });

  it("exports from public-api", async () => {
    const mod = await import("../public-api");
    expect(Object.keys(mod)).toEqual([]);
  });

  it("exports from contracts", async () => {
    const mod = await import("../contracts");
    expect(Object.keys(mod)).toEqual([]);
  });

  it("exports from events", async () => {
    const mod = await import("../events");
    expect(Object.keys(mod)).toEqual([]);
  });
});
