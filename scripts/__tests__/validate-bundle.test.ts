import { describe, it, expect } from "vitest";

function validateEntryPath(entryName: string) {
  if (typeof entryName !== "string") return { valid: false, reason: "not a string" };
  if (entryName.includes("\\")) return { valid: false, reason: "backslash in path" };
  return { valid: true, reason: "ok" };
}

describe("validate-bundle: entry path validation", () => {
  it("rejects backslash paths", () => {
    expect(validateEntryPath("a\\b.txt").valid).toBe(false);
    expect(validateEntryPath("client\\src\\App.tsx").valid).toBe(false);
  });

  it("accepts forward-slash paths", () => {
    expect(validateEntryPath("a/b.txt").valid).toBe(true);
    expect(validateEntryPath("client/src/App.tsx").valid).toBe(true);
  });

  it("accepts root-level files", () => {
    expect(validateEntryPath("README.md").valid).toBe(true);
    expect(validateEntryPath("package.json").valid).toBe(true);
  });
});
