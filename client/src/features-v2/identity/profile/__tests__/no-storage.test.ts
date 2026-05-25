import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The profile boundary must not fall back to localStorage/sessionStorage as a
 * pretend backend (legacy `px_profile_mode` anti-pattern). This guard reads
 * the source files of the profile feature and the onboarding flow and verifies
 * none of them touch browser storage APIs at runtime.
 */
const FILES = [
  "client/src/features-v2/identity/profile/profile-adapter.ts",
  "client/src/features-v2/identity/profile/types.ts",
  "client/src/features-v2/identity/profile/index.ts",
  "client/src/app-v2/onboarding/OnboardingFlow.tsx",
];

describe("profile boundary — no fake storage persistence", () => {
  for (const rel of FILES) {
    it(`${rel} does not use localStorage/sessionStorage`, () => {
      const source = readFileSync(join(process.cwd(), rel), "utf-8");
      expect(source).not.toMatch(/\blocalStorage\b/);
      expect(source).not.toMatch(/\bsessionStorage\b/);
    });
  }
});
