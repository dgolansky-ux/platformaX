import { describe, it, expect } from "vitest";
import { posix } from "path";

const CROSS_DOMAIN_BLOCKED = [
  "repository",
  "repository.drizzle",
  "service",
  "policy",
  "router",
  "mapper",
  "db",
  "schema",
  "cache-keys",
  "internal",
];

const CROSS_DOMAIN_ALLOWED = [
  "public-api",
  "contracts",
  "events",
  "dto",
  "shared",
];

function resolveRelativeImport(
  fileRelPath: string,
  importPath: string,
): string | null {
  if (!importPath.startsWith(".")) return null;
  const fileDir = posix.dirname(fileRelPath);
  return posix.normalize(posix.join(fileDir, importPath));
}

function getImportedDomainAndModule(resolvedPath: string) {
  const m1 = resolvedPath.match(/^server\/domains-v2\/([^/]+)\/(.+)/);
  if (m1) return { domain: m1[1], module: m1[2].split("/")[0] };
  return null;
}

function checkCrossDomain(
  fileRelPath: string,
  importPath: string,
): { violation: boolean; reason: string } {
  const fileParts = fileRelPath.match(/^server\/domains-v2\/([^/]+)\//);
  if (!fileParts) return { violation: false, reason: "not in domains-v2" };
  const currentDomain = fileParts[1];

  const resolved = resolveRelativeImport(fileRelPath, importPath);
  if (!resolved) return { violation: false, reason: "not relative" };

  const target = getImportedDomainAndModule(resolved);
  if (!target) return { violation: false, reason: "not in domains-v2" };
  if (target.domain === currentDomain)
    return { violation: false, reason: "same domain" };

  const isBlocked = CROSS_DOMAIN_BLOCKED.some(
    (b) => target.module === b || target.module.startsWith(b + "."),
  );
  const isAllowed = CROSS_DOMAIN_ALLOWED.some(
    (a) => target.module === a || target.module.startsWith(a + "."),
  );

  if (isBlocked && !isAllowed)
    return { violation: true, reason: `cross-domain ${target.module}` };
  return { violation: false, reason: "allowed" };
}

describe("domain-boundaries: relative cross-domain detection", () => {
  it("detects relative cross-domain repository import", () => {
    const r = checkCrossDomain(
      "server/domains-v2/identity/users.ts",
      "../social/repository",
    );
    expect(r.violation).toBe(true);
    expect(r.reason).toContain("repository");
  });

  it("detects relative cross-domain service import", () => {
    const r = checkCrossDomain(
      "server/domains-v2/identity/handler.ts",
      "../content/service",
    );
    expect(r.violation).toBe(true);
    expect(r.reason).toContain("service");
  });

  it("allows cross-domain public-api import", () => {
    const r = checkCrossDomain(
      "server/domains-v2/identity/handler.ts",
      "../social/public-api",
    );
    expect(r.violation).toBe(false);
  });

  it("allows same-domain internal import", () => {
    const r = checkCrossDomain(
      "server/domains-v2/identity/handler.ts",
      "./repository",
    );
    expect(r.violation).toBe(false);
    expect(r.reason).toBe("same domain");
  });

  it("allows cross-domain contracts import", () => {
    const r = checkCrossDomain(
      "server/domains-v2/identity/handler.ts",
      "../social/contracts",
    );
    expect(r.violation).toBe(false);
  });
});
