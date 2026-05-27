import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("design tokens", () => {
  it("PASS: the guard reports a centralized, used token set", () => {
    const result = execSync(`node "${join(ROOT, "scripts/check-design-tokens.mjs")}"`, {
      encoding: "utf-8",
    });
    expect(result).toContain("CHECK_DESIGN_TOKENS_PASS");
  });

  it("tokens.css exists and defines core + profile legacy tokens", () => {
    const file = join(ROOT, "client/src/app-v2/styles/tokens.css");
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, "utf-8");
    for (const token of ["--color-primary", "--radius-md", "--shadow-soft", "--profile-avatar-ring", "--profile-banner-gradient"]) {
      expect(content, `missing ${token}`).toContain(`${token}:`);
    }
  });

  it("is imported once at the app entry", () => {
    const main = readFileSync(join(ROOT, "client/src/main.tsx"), "utf-8");
    expect(main).toMatch(/styles\/tokens\.css/);
  });

  it("no profile CSS uses transition: all", () => {
    // Sanity check on a representative profile module.
    const header = readFileSync(
      join(ROOT, "client/src/app-v2/profile/styles/profile-header.module.css"),
      "utf-8",
    );
    expect(header).not.toMatch(/transition:\s*all\b/);
  });
});
