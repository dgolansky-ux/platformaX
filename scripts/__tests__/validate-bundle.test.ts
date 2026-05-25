import { describe, it, expect } from "vitest";

function validateEntryPath(entryName: string) {
  if (typeof entryName !== "string")
    return { valid: false, reason: "not a string" };
  if (entryName.includes("\\"))
    return { valid: false, reason: "backslash in path" };
  return { valid: true, reason: "ok" };
}

function classifyEntry(entryName: string) {
  const issues: string[] = [];
  if (entryName.includes("\\")) issues.push("backslash_path");

  const lower = entryName.toLowerCase();
  const parts = lower.split("/");

  if (parts.includes("node_modules")) issues.push("node_modules");
  if (parts[0] === "dist" || parts.includes("dist")) issues.push("dist");
  if (parts[0] === "build" || parts.includes("build")) issues.push("build");
  if (parts.includes("coverage")) issues.push("coverage");
  if (parts[0] === ".git" || parts.includes(".git")) issues.push("dot_git");

  const fname = parts[parts.length - 1];
  if (fname === ".env" || fname === ".env.local" || fname === ".env.production")
    issues.push("env_file");

  if (lower.endsWith(".zip")) issues.push("nested_zip");

  return { entryName, issues };
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

describe("validate-bundle: classifyEntry", () => {
  it("detects backslash paths", () => {
    const r = classifyEntry("a\\b.txt");
    expect(r.issues).toContain("backslash_path");
  });

  it("detects nested zip", () => {
    const r = classifyEntry("nested/archive.zip");
    expect(r.issues).toContain("nested_zip");
  });

  it("detects .env files", () => {
    expect(classifyEntry(".env").issues).toContain("env_file");
    expect(classifyEntry(".env.local").issues).toContain("env_file");
    expect(classifyEntry(".env.production").issues).toContain("env_file");
  });

  it("detects node_modules", () => {
    const r = classifyEntry("node_modules/foo/bar.js");
    expect(r.issues).toContain("node_modules");
  });

  it("detects dist", () => {
    const r = classifyEntry("dist/index.js");
    expect(r.issues).toContain("dist");
  });

  it("detects build", () => {
    const r = classifyEntry("build/output.js");
    expect(r.issues).toContain("build");
  });

  it("detects coverage", () => {
    const r = classifyEntry("coverage/lcov.info");
    expect(r.issues).toContain("coverage");
  });

  it("detects .git", () => {
    const r = classifyEntry(".git/HEAD");
    expect(r.issues).toContain("dot_git");
  });

  it("passes clean paths", () => {
    expect(classifyEntry("client/src/App.tsx").issues).toEqual([]);
    expect(classifyEntry("README.md").issues).toEqual([]);
    expect(classifyEntry("docs/review/report.md").issues).toEqual([]);
  });
});
