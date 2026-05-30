import { describe, expect, it } from "vitest";
import {
  createInMemoryIntegrationRepository,
  createIntegrationsService,
  type IntegrationModuleEnablementResolver,
  type IntegrationOwnershipResolver,
  type IntegrationsService,
} from "../public-api";

function makeService(opts?: {
  canManage?: boolean;
  enabled?: boolean;
}): IntegrationsService {
  const ownership: IntegrationOwnershipResolver = {
    async canManageIntegrationsForOwner() {
      return opts?.canManage ?? true;
    },
  };
  const moduleEnablement: IntegrationModuleEnablementResolver = {
    async isIntegrationsEnabled() {
      return opts?.enabled ?? true;
    },
  };
  let seq = 0;
  return createIntegrationsService({
    integrations: createInMemoryIntegrationRepository(),
    ownership,
    moduleEnablement,
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `integration-${++seq}` },
  });
}

describe("integrations-v2 service", () => {
  it("creates a safe https integration for profile", async () => {
    const svc = makeService();
    const res = await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "website",
      name: "Personal site",
      url: "https://example.com",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(true);
  });

  it("rejects javascript: URL", async () => {
    const svc = makeService();
    const res = await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "external_link",
      name: "Bad",
      url: "javascript:alert(1)",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("URL_UNSAFE_SCHEME");
  });

  it("rejects data: URL", async () => {
    const svc = makeService();
    const res = await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "external_link",
      name: "Bad",
      url: "data:text/html,<script>alert(1)</script>",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("URL_UNSAFE_SCHEME");
  });

  it("rejects malformed URL", async () => {
    const svc = makeService();
    const res = await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "external_link",
      name: "Bad",
      url: "not a url",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("URL_INVALID");
  });

  it("accepts mailto: URL", async () => {
    const svc = makeService();
    const res = await svc.createIntegration({
      ownerType: "community",
      ownerId: "c1",
      kind: "external_link",
      name: "Contact",
      url: "mailto:hello@example.com",
      visibility: "public",
      createdByUserId: "u-admin",
    });
    expect(res.ok).toBe(true);
  });

  it("unauthorized actor is forbidden", async () => {
    const svc = makeService({ canManage: false });
    const res = await svc.createIntegration({
      ownerType: "community",
      ownerId: "c1",
      kind: "website",
      name: "Pwned",
      url: "https://evil.example",
      visibility: "public",
      createdByUserId: "u-evil",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("listIntegrationsForOwner returns empty when module disabled", async () => {
    const svc = makeService({ enabled: false });
    await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "website",
      name: "Site",
      url: "https://example.com",
      visibility: "public",
      createdByUserId: "u1",
    });
    const list = await svc.listIntegrationsForOwner("profile", "u1");
    expect(list).toEqual([]);
  });

  it("public DTO carries no createdByUserId and no secrets", async () => {
    const svc = makeService();
    const created = await svc.createIntegration({
      ownerType: "profile",
      ownerId: "u1",
      kind: "website",
      name: "Site",
      url: "https://example.com",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const view = await svc.getIntegrationPublicView(created.value.id);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(Object.keys(view.value)).not.toContain("createdByUserId");
    expect(JSON.stringify(view.value)).not.toMatch(/token|secret|api[_-]?key/i);
  });
});
