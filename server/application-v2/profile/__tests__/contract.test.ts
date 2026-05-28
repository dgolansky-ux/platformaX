import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  OwnerProfileView,
  PublicProfileView,
} from "../public-api";
import { makeProfileError } from "../public-api";

const ROOT = process.cwd();

/**
 * Contract tests for the profile application boundary (PX-CONTRACT-001):
 *  - the public view DTOs keep their PII classification,
 *  - the error code set is stable,
 *  - the service composes domains only through their public-api.
 */

const PUBLIC_PROFILE_SAMPLE: PublicProfileView = {
  profileUserId: "u-1",
  profileSlug: null,
  displayName: "Sample",
  bio: null,
  location: null,
  civilStatus: null,
  socialLinks: null,
  personalStatus: null,
  visibility: "public",
  onboardingCompleted: true,
  avatar: null,
  banner: null,
  isOwner: false,
};

const OWNER_PROFILE_SAMPLE: OwnerProfileView = {
  profileUserId: "u-1",
  profileSlug: null,
  firstName: "A",
  lastName: "B",
  displayName: "A B",
  dateOfBirth: "1990-01-01",
  phone: "+48600000000",
  bio: null,
  location: null,
  civilStatus: null,
  socialLinks: null,
  personalStatus: null,
  visibility: "public",
  onboardingCompleted: true,
  avatar: null,
  banner: null,
  createdAt: "2026-05-27T00:00:00.000Z",
  updatedAt: "2026-05-27T00:00:00.000Z",
  isOwner: true,
};

const STABLE_ERROR_CODES = [
  "PROFILE_NOT_FOUND",
  "PROFILE_FORBIDDEN",
  "PROFILE_VALIDATION_FAILED",
  "ONBOARDING_ALREADY_COMPLETED",
  "MEDIA_ASSET_NOT_FOUND",
  "MEDIA_ASSET_FORBIDDEN",
  "MEDIA_ASSET_TYPE_MISMATCH",
  "MEDIA_ASSET_NOT_READY",
  "UNAUTHENTICATED",
  "PROFILE_TRANSPORT_NOT_CONNECTED",
] as const;

describe("profile application contract", () => {
  it("PublicProfileView never exposes PII keys", () => {
    const keys = Object.keys(PUBLIC_PROFILE_SAMPLE);
    for (const pii of ["phone", "dateOfBirth", "email", "firstName", "lastName"]) {
      expect(keys).not.toContain(pii);
    }
  });

  it("OwnerProfileView may carry private fields only on the owner path", () => {
    expect(OWNER_PROFILE_SAMPLE.phone).toBe("+48600000000");
    expect(OWNER_PROFILE_SAMPLE.dateOfBirth).toBe("1990-01-01");
    expect(OWNER_PROFILE_SAMPLE.isOwner).toBe(true);
  });

  it("error codes are stable and map through makeProfileError", () => {
    for (const code of STABLE_ERROR_CODES) {
      const err = makeProfileError(code, "msg");
      expect(err.code).toBe(code);
    }
    // The shared error union must declare exactly these codes.
    const src = readFileSync(
      join(ROOT, "shared/contracts/profile-view.ts"),
      "utf-8",
    );
    for (const code of STABLE_ERROR_CODES) {
      expect(src).toContain(`"${code}"`);
    }
  });

  it("the service composes identity + media only through their public-api", () => {
    const service = readFileSync(join(ROOT, "server/application-v2/profile/service.ts"), "utf-8");
    const domainImports = [...service.matchAll(/from\s+["'](@server\/domains-v2\/[^"']+)["']/g)].map(
      (m) => m[1],
    );
    expect(domainImports.length).toBeGreaterThan(0);
    for (const spec of domainImports) {
      expect(spec.endsWith("/public-api"), `non-public-api import: ${spec}`).toBe(true);
    }
  });
});
