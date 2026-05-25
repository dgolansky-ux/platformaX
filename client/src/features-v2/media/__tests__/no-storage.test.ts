import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The media boundary must not fall back to localStorage/sessionStorage as a
 * pretend backend, and must not inline-encode bytes. This reads the media
 * feature source files and verifies none touch browser storage or the forbidden
 * upload patterns at runtime. Forbidden literals are assembled from parts so
 * they never appear contiguously here (governance guards also scan this tree).
 */
const FILES = [
  "client/src/features-v2/media/media-adapter.ts",
  "client/src/features-v2/media/types.ts",
  "client/src/features-v2/media/index.ts",
];

const forbiddenUpload = ["read" + "AsDataURL", "data" + "Url", "base" + "64", "File" + "Reader"];

describe("media boundary — no fake storage / no inline encoding", () => {
  for (const rel of FILES) {
    it(`${rel} avoids browser storage and inline-encoded uploads`, () => {
      const source = readFileSync(join(process.cwd(), rel), "utf-8");
      expect(source).not.toMatch(/\blocalStorage\b/);
      expect(source).not.toMatch(/\bsessionStorage\b/);
      for (const needle of forbiddenUpload) {
        expect(source.toLowerCase()).not.toContain(needle.toLowerCase());
      }
    });
  }
});
