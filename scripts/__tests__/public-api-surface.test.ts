import { describe, it, expect } from "vitest";
// @ts-expect-error mjs export
import { scanSourceForViolations } from "../check-public-api-surface.mjs";

type Finding = { source: string; reason: string };

function scan(src: string): Finding[] {
  return (scanSourceForViolations as (s: string) => Finding[])(src);
}

describe("check-public-api-surface", () => {
  it("FAIL: multiline export from ./internal/validation", () => {
    const src = `
      export {
        MEDIA_VALIDATION_LIMITS,
        ALLOWED_MIME_TYPES,
        maxBytesFor,
      } from "./internal/validation";
    `;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].source).toBe("./internal/validation");
  });

  it("FAIL: export type from ./internal/private-profile-dto", () => {
    const src = `export type { PrivateProfileDTO } from "./internal/private-profile-dto";`;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].source).toBe("./internal/private-profile-dto");
  });

  it("FAIL: export from ./mapper", () => {
    const src = `export { mapProfileRecord } from "./mapper";`;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: export from ./router", () => {
    const src = `export { router } from "./router";`;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
  });

  it("FAIL: export type from ../internal/some-record", () => {
    const src = `export type { Rec } from "../internal/record";`;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
  });

  it("PASS: service factory", () => {
    const src = `export { createIdentityService } from "./service";`;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: DTO type re-export (multi-line)", () => {
    const src = `
      export type {
        PublicProfileDTO,
        ProfileVisibility,
      } from "./dto";
    `;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: contracts + events", () => {
    const src = `
      export type { UserId } from "./contracts";
      export type { IdentityEvent } from "./events";
    `;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: validation-limits (stable file)", () => {
    const src = `export { IDENTITY_VALIDATION_LIMITS } from "./validation-limits";`;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: stable private-dto (not /internal/)", () => {
    const src = `export type { PrivateProfileDTO } from "./private-dto";`;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: repository interface + factory (allowlisted)", () => {
    const src = `
      export {
        createInMemoryMediaRepository,
        createEnvRequiredStoragePort,
      } from "./repository";
      export type { MediaRepository } from "./repository";
    `;
    expect(scan(src)).toEqual([]);
  });

  it("PASS: shared/contracts pass-through (non-relative)", () => {
    const src = `export type { UserId } from "@shared/contracts/ids";`;
    expect(scan(src)).toEqual([]);
  });

  it("FAIL: non-allowlisted relative source", () => {
    const src = `export { something } from "./hidden-thing";`;
    const v = scan(src);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].reason).toBe("not-allowlisted");
  });

  it("PASS: empty scaffold (export {})", () => {
    const src = `export {};`;
    expect(scan(src)).toEqual([]);
  });
});
