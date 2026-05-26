import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const GUARDS_PATH = join(ROOT, "docs/governance/GUARDS_REGISTRY.yml");

const REQUIRED_FIELDS = ["id", "command", "file", "rules_enforced", "runs_in", "status"];

function parseGuardsYml(content: string) {
  const guards: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      if (current) guards.push(current);
      current = { id: trimmed.replace("- id:", "").trim() };
    } else if (current && /^\w[\w_]*:/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      current[key] = val;
    }
  }
  if (current) guards.push(current);
  return guards;
}

describe("guards-registry guard logic", () => {
  it("PASS: GUARDS_REGISTRY.yml exists and is readable", () => {
    expect(existsSync(GUARDS_PATH)).toBe(true);
    const content = readFileSync(GUARDS_PATH, "utf-8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("guards:");
  });

  it("PASS: every guard has required fields (id, command, file, rules_enforced, runs_in, status)", () => {
    const content = readFileSync(GUARDS_PATH, "utf-8");
    const guards = parseGuardsYml(content);
    expect(guards.length).toBeGreaterThan(0);

    for (const guard of guards) {
      for (const field of REQUIRED_FIELDS) {
        expect(guard[field], `Guard ${guard.id ?? "UNKNOWN"} missing field: ${field}`).toBeDefined();
      }
    }
  });

  it("FAIL: detects missing guard file reference", () => {
    const fakeGuard = {
      id: "GUARD-999",
      file: "scripts/nonexistent-guard-xyz.mjs",
    };
    expect(existsSync(join(ROOT, fakeGuard.file))).toBe(false);
  });

  it("PASS: all guard file references exist on disk", () => {
    const content = readFileSync(GUARDS_PATH, "utf-8");
    const guards = parseGuardsYml(content);

    for (const guard of guards) {
      const filePath = join(ROOT, guard.file);
      expect(existsSync(filePath), `Guard ${guard.id} references missing file: ${guard.file}`).toBe(true);
    }
  });
});
