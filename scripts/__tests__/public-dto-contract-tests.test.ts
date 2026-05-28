import { describe, it, expect } from "vitest";
// @ts-expect-error mjs export
import { parseRegistry, evaluate } from "../check-public-dto-contract-tests.mjs";

type Registry = Record<string, string | null>;

const registryWithName = `
domains:

  - name: identity
    type: OWNER_DOMAIN
    status: PARTIAL
    conflict: false

  - name: media
    type: OWNER_DOMAIN
    status: PARTIAL

  - name: social
    type: OWNER_DOMAIN
    status: SCAFFOLD_ONLY
`;

const registryWithDomain = `
domains:

  - domain: identity
    type: OWNER_DOMAIN
    status: PARTIAL

  - domain: media
    type: OWNER_DOMAIN
    status: SCAFFOLD_ONLY
`;

describe("check-public-dto-contract-tests", () => {
  it("PASS parser: shape `- name: identity`", () => {
    const r = parseRegistry(registryWithName) as Registry;
    expect(r.identity).toBe("PARTIAL");
    expect(r.media).toBe("PARTIAL");
    expect(r.social).toBe("SCAFFOLD_ONLY");
  });

  it("PASS parser: shape `- domain: identity`", () => {
    const r = parseRegistry(registryWithDomain) as Registry;
    expect(r.identity).toBe("PARTIAL");
    expect(r.media).toBe("SCAFFOLD_ONLY");
  });

  it("FAIL evaluator: registry exists but parsed 0 domains", () => {
    const v = evaluate({
      registry: {},
      hasTestFile: () => true,
    });
    expect(v.length).toBe(1);
    expect(v[0]).toMatch(/parser found 0 domains/);
  });

  it("FAIL evaluator: PARTIAL domain without contract test", () => {
    const v = evaluate({
      registry: { identity: "PARTIAL" },
      hasTestFile: () => false,
    });
    expect(v.length).toBe(1);
    expect(v[0]).toMatch(/identity \(PARTIAL\): missing public DTO contract test/);
  });

  it("FAIL evaluator: PARTIAL domain with missing __tests__ dir", () => {
    const v = evaluate({
      registry: { identity: "PARTIAL" },
      hasTestFile: () => "no-dir",
    });
    expect(v.length).toBe(1);
    expect(v[0]).toMatch(/missing __tests__ directory/);
  });

  it("PASS evaluator: SCAFFOLD_ONLY does not require runtime test", () => {
    const v = evaluate({
      registry: { social: "SCAFFOLD_ONLY" },
      hasTestFile: () => false,
    });
    expect(v).toEqual([]);
  });

  it("PASS evaluator: PARTIAL with at least one acceptable test file", () => {
    const v = evaluate({
      registry: { identity: "PARTIAL" },
      hasTestFile: () => true,
    });
    expect(v).toEqual([]);
  });
});
