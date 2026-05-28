import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error mjs export
import { listSourceFiles, __test__ } from "../lib/list-source-files.mjs";

type Helper = {
  isRealEnvFile: (n: string) => boolean;
  shouldExcludeByPath: (p: string) => boolean;
  matchesExtension: (file: string, exts: string[]) => boolean;
  normalizePath: (p: string) => string;
};
const H = __test__ as Helper;

function makeTree(root: string, entries: Record<string, string>) {
  for (const [rel, content] of Object.entries(entries)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, content, "utf-8");
  }
}

describe("scripts/lib/list-source-files", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "pxv2-lsf-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("fs walk works without .git (returns project files)", () => {
    makeTree(tmp, {
      "server/domains-v2/identity/public-api.ts": "export {};\n",
      "server/domains-v2/media/dto.ts": "export {};\n",
      "shared/contracts/ids.ts": "export type X = string;\n",
    });
    const files = listSourceFiles({
      cwd: tmp,
      roots: ["server/domains-v2", "shared"],
      extensions: [".ts"],
    });
    expect(files).toContain("server/domains-v2/identity/public-api.ts");
    expect(files).toContain("server/domains-v2/media/dto.ts");
    expect(files).toContain("shared/contracts/ids.ts");
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(H.normalizePath("server\\domains-v2\\identity\\public-api.ts")).toBe(
      "server/domains-v2/identity/public-api.ts",
    );
  });

  it("excludes node_modules / dist / build / coverage / .git", () => {
    makeTree(tmp, {
      "node_modules/x/index.ts": "x",
      "dist/bundle.js": "x",
      "build/output.ts": "x",
      "coverage/report.ts": "x",
      ".git/HEAD": "ref: refs/heads/main",
      "src/keep.ts": "keep",
    });
    const files = listSourceFiles({
      cwd: tmp,
      roots: ["."],
      extensions: [".ts", ".js"],
    });
    expect(files).toContain("src/keep.ts");
    for (const f of files) {
      expect(f).not.toMatch(/^node_modules\//);
      expect(f).not.toMatch(/^dist\//);
      expect(f).not.toMatch(/^build\//);
      expect(f).not.toMatch(/^coverage\//);
      expect(f).not.toMatch(/^\.git\//);
    }
  });

  it("does not return real .env files", () => {
    makeTree(tmp, {
      ".env": "DATABASE_URL=postgres://nope",
      ".env.local": "SECRET=x",
      ".env.production": "SECRET=x",
      ".env.test.example": "DATABASE_URL=postgres://example",
      "src/keep.ts": "keep",
    });
    const files = listSourceFiles({
      cwd: tmp,
      roots: ["."],
      extensions: [".ts", ""],
    });
    expect(files).not.toContain(".env");
    expect(files).not.toContain(".env.local");
    expect(files).not.toContain(".env.production");
  });

  it("does return .env*.example files", () => {
    makeTree(tmp, {
      ".env.test.example": "DATABASE_URL=postgres://example",
      ".env.example": "DATABASE_URL=postgres://example",
      "src/keep.ts": "keep",
    });
    const files = listSourceFiles({
      cwd: tmp,
      roots: ["."],
      extensions: [".example"],
    });
    expect(files).toContain(".env.test.example");
    expect(files).toContain(".env.example");
  });

  it("isRealEnvFile helper", () => {
    expect(H.isRealEnvFile(".env")).toBe(true);
    expect(H.isRealEnvFile(".env.local")).toBe(true);
    expect(H.isRealEnvFile(".env.production")).toBe(true);
    expect(H.isRealEnvFile(".env.test.example")).toBe(false);
    expect(H.isRealEnvFile(".env.example")).toBe(false);
    expect(H.isRealEnvFile("envoy.ts")).toBe(false);
  });

  it("shouldExcludeByPath catches nested vendored dirs", () => {
    expect(H.shouldExcludeByPath("server/x/node_modules/y/index.ts")).toBe(true);
    expect(H.shouldExcludeByPath("dist/server/index.js")).toBe(true);
    expect(H.shouldExcludeByPath("server/x/keep.ts")).toBe(false);
  });

  it("matchesExtension is case-insensitive", () => {
    expect(H.matchesExtension("foo.TS", [".ts"])).toBe(true);
    expect(H.matchesExtension("foo.tsx", [".ts"])).toBe(false);
    expect(H.matchesExtension("foo.tsx", [".ts", ".tsx"])).toBe(true);
  });
});
