import { describe, it, expect } from "vitest";
import { posix } from "path";

const BLOCKED_IMPORTS = [
  "client/src/features/",
  "client/src/pages/",
  "client/src/components/",
  "server/domains/",
  "legacy/",
  "legacy-source/",
  "old-code/",
  "Starykod/",
];

const BLOCKED_RELATIVE_KEYWORDS = [
  "/features/",
  "/pages/",
  "/components/",
  "/domains/",
  "/legacy/",
  "/legacy-source/",
  "/old-code/",
  "/Starykod/",
];

function detectLegacyImport(line: string): string | null {
  for (const blocked of BLOCKED_IMPORTS) {
    const patterns = [
      `from "${blocked}`,
      `from '${blocked}`,
      `import("${blocked}`,
      `require("${blocked}`,
    ];
    for (const pat of patterns) {
      if (line.includes(pat)) return blocked;
    }
  }
  return null;
}

function resolveRelativeImport(
  fileRelPath: string,
  importPath: string,
): string | null {
  if (!importPath.startsWith(".")) return null;
  const fileDir = posix.dirname(fileRelPath);
  return posix.normalize(posix.join(fileDir, importPath));
}

function detectRelativeLegacy(
  fileRelPath: string,
  importPath: string,
): string | null {
  if (!importPath.startsWith(".")) return null;
  const resolved = resolveRelativeImport(fileRelPath, importPath);
  if (!resolved) return null;
  for (const keyword of BLOCKED_RELATIVE_KEYWORDS) {
    if (("/" + resolved).includes(keyword)) return keyword;
  }
  return null;
}

describe("legacy-imports: absolute path detection", () => {
  it("detects legacy feature imports", () => {
    expect(
      detectLegacyImport('import { X } from "client/src/features/old"'),
    ).toBe("client/src/features/");
  });

  it("detects legacy page imports", () => {
    expect(
      detectLegacyImport('import Y from "client/src/pages/Home"'),
    ).toBe("client/src/pages/");
  });

  it("detects old-code imports", () => {
    expect(detectLegacyImport('import { Z } from "old-code/utils"')).toBe(
      "old-code/",
    );
  });

  it("passes clean imports", () => {
    expect(detectLegacyImport('import { App } from "./App"')).toBeNull();
    expect(detectLegacyImport('import React from "react"')).toBeNull();
  });

  it("detects Starykod imports", () => {
    expect(
      detectLegacyImport('import { X } from "Starykod/module"'),
    ).toBe("Starykod/");
  });
});

describe("legacy-imports: relative path detection", () => {
  it("detects relative import to features/", () => {
    const result = detectRelativeLegacy(
      "client/src/app-v2/__redteam__/LegacyImportRedTeam.ts",
      "../../../features/legacy-example",
    );
    expect(result).toBe("/features/");
  });

  it("detects relative import to pages/", () => {
    const result = detectRelativeLegacy(
      "client/src/app-v2/shell/nav.ts",
      "../../pages/Home",
    );
    expect(result).toBe("/pages/");
  });

  it("passes allowed relative import", () => {
    const result = detectRelativeLegacy(
      "client/src/app-v2/shell/nav.ts",
      "../components-v2/Button",
    );
    expect(result).toBeNull();
  });

  it("passes non-relative import", () => {
    const result = detectRelativeLegacy(
      "client/src/app-v2/shell/nav.ts",
      "react",
    );
    expect(result).toBeNull();
  });
});
