import { describe, it, expect } from "vitest";

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

describe("legacy-imports: detection", () => {
  it("detects legacy feature imports", () => {
    expect(detectLegacyImport('import { X } from "client/src/features/old"')).toBe(
      "client/src/features/",
    );
  });

  it("detects legacy page imports", () => {
    expect(detectLegacyImport('import Y from "client/src/pages/Home"')).toBe(
      "client/src/pages/",
    );
  });

  it("detects old-code imports", () => {
    expect(detectLegacyImport('import { Z } from "old-code/utils"')).toBe("old-code/");
  });

  it("passes clean imports", () => {
    expect(detectLegacyImport('import { App } from "./App"')).toBeNull();
    expect(detectLegacyImport('import React from "react"')).toBeNull();
  });

  it("detects Starykod imports", () => {
    expect(detectLegacyImport('import { X } from "Starykod/module"')).toBe("Starykod/");
  });
});
