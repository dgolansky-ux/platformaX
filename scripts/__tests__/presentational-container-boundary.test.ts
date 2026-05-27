import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SECTIONS_DIR = join(ROOT, "client/src/app-v2/profile/sections");

function sectionFiles(): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(SECTIONS_DIR)) {
    const full = join(SECTIONS_DIR, entry);
    if (statSync(full).isFile() && /\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const DATA_HOOK_CALLS = [
  /\buseProfileData\s*\(/,
  /\buseProfileBioEdit\s*\(/,
  /\buseProfileMediaUpload\s*\(/,
];

describe("presentational/container boundary", () => {
  it("PASS: the guard reports a clean sections/ tree", () => {
    const result = execSync(
      `node "${join(ROOT, "scripts/check-presentational-container-boundary.mjs")}"`,
      { encoding: "utf-8" },
    );
    expect(result).toContain("CHECK_PRESENTATIONAL_CONTAINER_BOUNDARY_PASS");
  });

  it("PASS: no profile section imports the data layer or a feature adapter", () => {
    for (const fp of sectionFiles()) {
      const content = readFileSync(fp, "utf-8");
      const importSpecs = [...content.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const spec of importSpecs) {
        expect(spec, `${fp} imports data layer`).not.toMatch(/(^|\/)data(\/|$)/);
        expect(spec, `${fp} imports feature adapter`).not.toMatch(/features-v2/);
      }
      for (const re of DATA_HOOK_CALLS) {
        expect(re.test(content), `${fp} calls a data hook`).toBe(false);
      }
    }
  });
});
