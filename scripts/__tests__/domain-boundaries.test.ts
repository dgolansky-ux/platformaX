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

// Mirrors checkPublicApiExportsInternals in scripts/audit-domain-boundaries.mjs.
function publicApiLeaksInternal(content: string): boolean {
  const blockedExports = [
    "repository",
    "router",
    "mapper",
    "cache-keys",
    "cacheKeys",
    "schema",
    "internal",
  ];
  const normalized = content.replace(/\}\s*\n\s*from\s+/g, "} from ");
  return blockedExports.some((blocked) =>
    new RegExp(`export[^;]*from\\s+["'][^"']*${blocked}`, "im").test(normalized),
  );
}

describe("public-api.ts internal/repository export guard", () => {
  it("catches a single-line export from ./repository", () => {
    const content = `export { createInMemoryRepo } from "./repository";`;
    expect(publicApiLeaksInternal(content)).toBe(true);
  });

  it("catches a multiline export from ./internal/validation", () => {
    const content = `export {\n  LIMITS,\n  helper,\n} from "./internal/validation";`;
    expect(publicApiLeaksInternal(content)).toBe(true);
  });

  it("catches a multiline export type from ./repository", () => {
    const content = `export type {\n  Repo,\n  Input,\n} from "./repository";`;
    expect(publicApiLeaksInternal(content)).toBe(true);
  });

  it("allows exports from domain-root facades (./ports, ./limits, ./private-dto)", () => {
    const content = [
      `export { createService } from "./service";`,
      `export type { Repo } from "./ports";`,
      `export { LIMITS } from "./limits";`,
      `export type { PrivateDTO } from "./private-dto";`,
      `export type { PublicDTO } from "./dto";`,
    ].join("\n");
    expect(publicApiLeaksInternal(content)).toBe(false);
  });
});

// Mirrors checkClientServerBoundary in scripts/audit-domain-boundaries.mjs.
function clientFileImportsServer(rel: string, content: string): boolean {
  if (!rel.startsWith("client/")) return false;
  if (
    rel.includes("__tests__/") ||
    rel.endsWith(".test.ts") ||
    rel.endsWith(".test.tsx")
  ) {
    return false;
  }
  return (
    /from\s+["']@server\//.test(content) ||
    /import\(\s*["']@server\//.test(content)
  );
}

describe("domain-boundaries: client must not import @server/*", () => {
  it("flags a static @server/* import in a non-test client file", () => {
    const rel = "client/src/app-v2/some-component.ts";
    const content = `import { foo } from "@server/domains-v2/identity/service";`;
    expect(clientFileImportsServer(rel, content)).toBe(true);
  });

  it("flags a dynamic @server/* import in a non-test client file", () => {
    const rel = "client/src/features-v2/media/loader.ts";
    const content = `const m = await import("@server/domains-v2/media/repository");`;
    expect(clientFileImportsServer(rel, content)).toBe(true);
  });

  it("allows @server/* import in a client test file", () => {
    const rel = "client/src/features-v2/identity/__tests__/adapter.test.ts";
    const content = `import { x } from "@server/domains-v2/identity/public-api";`;
    expect(clientFileImportsServer(rel, content)).toBe(false);
  });

  it("allows @shared/* imports in client production files", () => {
    const rel = "client/src/features-v2/identity/profile/profile-adapter.ts";
    const content = `export { profileAdapter } from "@shared/wiring/profile-wiring";`;
    expect(clientFileImportsServer(rel, content)).toBe(false);
  });

  it("does not flag @server/* mentioned only in a comment", () => {
    const rel = "client/src/features-v2/media/index.ts";
    const content = `/* no @server/* imports exist anywhere in client */\nexport {} from "./types";`;
    expect(clientFileImportsServer(rel, content)).toBe(false);
  });
});
