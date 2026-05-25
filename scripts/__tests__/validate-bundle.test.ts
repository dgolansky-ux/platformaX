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

function checkRequiredReports(entries: string[]) {
  return {
    hasReviewDocs: entries.some((e) => e.includes("docs/review/")),
    hasStep11Report: entries.some((e) => e.endsWith("STEP_11_REPORT.md")),
    hasZipManifest: entries.some((e) => e.endsWith("ZIP_MANIFEST.md")),
    hasFileManifest: entries.some((e) => e.endsWith("FILE_MANIFEST.md")),
  };
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
    expect(classifyEntry("a\\b.txt").issues).toContain("backslash_path");
  });

  it("detects nested zip", () => {
    expect(classifyEntry("nested/archive.zip").issues).toContain("nested_zip");
  });

  it("detects .env files", () => {
    expect(classifyEntry(".env").issues).toContain("env_file");
    expect(classifyEntry(".env.local").issues).toContain("env_file");
    expect(classifyEntry(".env.production").issues).toContain("env_file");
  });

  it("detects node_modules", () => {
    expect(classifyEntry("node_modules/foo.js").issues).toContain(
      "node_modules"
    );
  });

  it("detects dist", () => {
    expect(classifyEntry("dist/app.js").issues).toContain("dist");
  });

  it("detects build", () => {
    expect(classifyEntry("build/output.js").issues).toContain("build");
  });

  it("detects coverage", () => {
    expect(classifyEntry("coverage/lcov.info").issues).toContain("coverage");
  });

  it("detects .git", () => {
    expect(classifyEntry(".git/config").issues).toContain("dot_git");
  });

  it("passes clean paths", () => {
    expect(classifyEntry("client/src/App.tsx").issues).toEqual([]);
    expect(classifyEntry("README.md").issues).toEqual([]);
    expect(classifyEntry("docs/review/report.md").issues).toEqual([]);
  });
});

describe("validate-bundle: required reports check", () => {
  it("FAILS when Step 11 reports are missing", () => {
    const r = checkRequiredReports(["README.md", "package.json"]);
    expect(r.hasStep11Report).toBe(false);
    expect(r.hasZipManifest).toBe(false);
    expect(r.hasFileManifest).toBe(false);
  });

  it("PASSES when all required reports are present", () => {
    const r = checkRequiredReports([
      "docs/review/step-11-final-local-bramka-audit/STEP_11_REPORT.md",
      "docs/review/step-11-final-local-bramka-audit/ZIP_MANIFEST.md",
      "docs/review/step-11-final-local-bramka-audit/FILE_MANIFEST.md",
      "README.md",
    ]);
    expect(r.hasReviewDocs).toBe(true);
    expect(r.hasStep11Report).toBe(true);
    expect(r.hasZipManifest).toBe(true);
    expect(r.hasFileManifest).toBe(true);
  });
});
