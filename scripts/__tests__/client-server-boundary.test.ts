import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = process.cwd();

function isServerImport(spec: string): boolean {
  if (spec === "@server" || spec.startsWith("@server/")) return true;
  if (spec === "server" || spec.startsWith("server/")) return true;
  if (spec.startsWith(".") && /(^|\/)server\//.test(spec)) return true;
  if (/(^|\/)\.\.\/server(\/|$)/.test(spec)) return true;
  return false;
}

describe("client/server boundary detection", () => {
  it("flags server runtime specifiers", () => {
    expect(isServerImport("@server/domains-v2/media/public-api")).toBe(true);
    expect(isServerImport("@server")).toBe(true);
    expect(isServerImport("server/application-v2/profile/public-api")).toBe(true);
    expect(isServerImport("../../../server/domains-v2/identity/public-api")).toBe(true);
  });

  it("allows shared and third-party specifiers", () => {
    expect(isServerImport("@shared/contracts/profile-view")).toBe(false);
    expect(isServerImport("react")).toBe(false);
    expect(isServerImport("./types")).toBe(false);
    expect(isServerImport("../../../features-v2/identity")).toBe(false);
    // a "server" substring inside another word must not match
    expect(isServerImport("@client/observer/widget")).toBe(false);
  });

  it("PASS: client/src currently imports zero server runtime", () => {
    const result = execSync(`node "${join(ROOT, "scripts/check-client-server-boundary.mjs")}"`, {
      encoding: "utf-8",
    });
    expect(result).toContain("CHECK_CLIENT_SERVER_BOUNDARY_PASS");
  });
});
