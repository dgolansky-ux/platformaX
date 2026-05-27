import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

const BACKEND_INVARIANT_RULE_IDS = [
  "PX-OWN-001",
  "PX-OWN-002",
  "PX-VIS-001",
  "PX-DTO-002",
  "PX-CTX-001",
  "PX-MEDIA-004",
  "PX-LIST-004",
  "PX-DB-004",
  "PX-EVENT-001",
  "PX-LC-001",
  "PX-IDEMP-001",
  "PX-AIS-002",
];

const RUNTIME_INVARIANT_RULE_IDS = [
  "PX-APP-001",
  "PX-EVENT-002",
  "PX-READMODEL-001",
  "PX-CONTRACT-001",
  "PX-ID-001",
  "PX-ERROR-001",
  "PX-CURSOR-001",
  "PX-LIFECYCLE-001",
  "PX-IDEMPOTENCY-001",
  "PX-POLICY-001",
  "PX-UI-001",
  "PX-UI-002",
  "PX-OBS-003",
  "PX-SEED-001",
];

function rulesRegistryContent() {
  return readFileSync(join(ROOT, "docs/governance/RULES_REGISTRY.yml"), "utf-8");
}

describe("governance backend and runtime invariants docs", () => {
  it("PASS: BACKEND_ARCHITECTURE_INVARIANTS.md exists", () => {
    const path = join(ROOT, "docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    expect(content).toContain("viewerContext");
    expect(content).toContain("Architecture Impact Statement");
  });

  it("PASS: backend invariant rule IDs exist in RULES_REGISTRY", () => {
    const content = rulesRegistryContent();
    for (const id of BACKEND_INVARIANT_RULE_IDS) {
      expect(content, `missing rule ${id}`).toContain(`id: ${id}`);
    }
  });

  it("PASS: runtime invariant rule IDs exist in RULES_REGISTRY", () => {
    const content = rulesRegistryContent();
    for (const id of RUNTIME_INVARIANT_RULE_IDS) {
      expect(content, `missing rule ${id}`).toContain(`id: ${id}`);
    }
  });

  it("PASS: AGENT_COMMAND_STANDARD contains Mandatory backend architecture invariants", () => {
    const content = readFileSync(
      join(ROOT, "docs/governance/AGENT_COMMAND_STANDARD.md"),
      "utf-8",
    );
    expect(content).toContain("MANDATORY BACKEND ARCHITECTURE INVARIANTS");
    expect(content).toContain("MANDATORY ARCHITECTURE INVARIANTS");
    expect(content).toContain("viewerContext");
  });

  it("PASS: PlatformaX-V2-active-rules has Runtime governance invariants section", () => {
    const content = readFileSync(
      join(ROOT, "docs/architecture/PlatformaX-V2-active-rules.md"),
      "utf-8",
    );
    expect(content).toContain("## 10. Runtime governance invariants");
    expect(content).toContain("EventEnvelope");
  });

  it("FAIL: detecting missing rule ID pattern", () => {
    const fake = "id: PX-NOT-REAL-999";
    expect(rulesRegistryContent().includes(fake)).toBe(false);
  });
});
