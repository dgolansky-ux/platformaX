import { describe, it, expect } from "vitest";
// @ts-expect-error mjs export
import { scanInterfaceBlock } from "../check-service-boundary-branded-ids.mjs";
// @ts-expect-error mjs export
import { evaluateBlock as evaluateAuthorityBlock } from "../check-owner-viewer-authority-boundary.mjs";
// @ts-expect-error mjs export
import { evaluate as evaluateAppServiceSize, APPLICATION_SERVICE_LINE_CAP } from "../check-application-service-size.mjs";

type BrandedViolation = { name: string; type: string; expected: string };

describe("check-service-boundary-branded-ids :: scanInterfaceBlock", () => {
  it("FAIL: currentUserId: string is not branded", () => {
    const v: BrandedViolation[] = scanInterfaceBlock(
      `getMyProfile(currentUserId: string): Promise<X>;`,
    );
    expect(v.length).toBe(1);
    expect(v[0].name).toBe("currentUserId");
    expect(v[0].expected).toBe("UserId");
  });

  it("FAIL: viewerUserId: string | null is not branded", () => {
    const v: BrandedViolation[] = scanInterfaceBlock(
      `getPublicProfile(viewerUserId: string | null, profileUserId: string): Promise<X>;`,
    );
    const names = v.map((x) => x.name);
    expect(names).toContain("viewerUserId");
    expect(names).toContain("profileUserId");
  });

  it("FAIL: assetId: string requires MediaAssetId", () => {
    const v: BrandedViolation[] = scanInterfaceBlock(
      `attachAvatarMediaRef(currentUserId: string, assetId: string): Promise<X>;`,
    );
    const expectations = v.map((x) => x.expected);
    expect(expectations).toContain("UserId");
    expect(expectations).toContain("MediaAssetId");
  });

  it("PASS: branded UserId / MediaAssetId types", () => {
    const v: BrandedViolation[] = scanInterfaceBlock(
      `attachAvatarMediaRef(currentUserId: UserId, assetId: MediaAssetId): Promise<X>;`,
    );
    expect(v).toEqual([]);
  });
});

describe("check-owner-viewer-authority-boundary :: evaluateBlock", () => {
  it("FAIL: anonymous `userId: string` lacks an authority name", () => {
    const v: string[] = evaluateAuthorityBlock(
      `doSomething(userId: string): Promise<X>;`,
    );
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]).toMatch(/anonymous parameter "userId/);
  });

  it("FAIL: viewerUserId without `| null` union", () => {
    const v: string[] = evaluateAuthorityBlock(
      `getPublicProfile(viewerUserId: string, profileUserId: UserId): Promise<X>;`,
    );
    expect(v.some((m) => /viewerUserId/.test(m))).toBe(true);
  });

  it("PASS: currentUserId/profileUserId/viewerUserId|null naming convention", () => {
    const v: string[] = evaluateAuthorityBlock(
      `getMyProfile(currentUserId: UserId): Promise<X>;\n` +
        `getPublicProfile(viewerUserId: UserId | null, profileUserId: UserId): Promise<X>;`,
    );
    expect(v).toEqual([]);
  });
});

describe("check-application-service-size :: evaluate", () => {
  it("PASS under the cap", () => {
    const src = "x\n".repeat(100);
    expect(evaluateAppServiceSize("svc.ts", src)).toBeNull();
  });

  it("FAIL over the cap without exception", () => {
    const src = "x\n".repeat(APPLICATION_SERVICE_LINE_CAP + 20);
    expect(evaluateAppServiceSize("svc.ts", src)).not.toBeNull();
  });

  it("PASS over the cap with PLATFORMAX_EXCEPTION block", () => {
    const src = "// PLATFORMAX_EXCEPTION\n" + "x\n".repeat(APPLICATION_SERVICE_LINE_CAP + 20);
    expect(evaluateAppServiceSize("svc.ts", src)).toBeNull();
  });
});
