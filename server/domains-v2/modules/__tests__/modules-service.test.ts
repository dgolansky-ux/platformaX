import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryModuleEnablementStore,
  createModulesService,
  type ModulesService,
} from "../public-api";

function makeService(): ModulesService {
  return createModulesService({
    store: createInMemoryModuleEnablementStore(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
  });
}

describe("modules service", () => {
  let svc: ModulesService;
  beforeEach(() => {
    svc = makeService();
  });

  it("lists definitions sorted by order, only whitelisted keys", () => {
    const defs = svc.listDefinitions();
    expect(defs.map((d) => d.key)).toEqual([
      "topics",
      "events",
      "integrations",
      "newsletter_chat",
      "channel_entry",
    ]);
  });

  it("rejects an unknown module key", async () => {
    const res = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "casino" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNKNOWN_MODULE");
  });

  it("enforces owner-type: events is community-only", async () => {
    const bad = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "events" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe("OWNER_TYPE_NOT_ALLOWED");
    const ok = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "events" });
    expect(ok.ok).toBe(true);
  });

  it("enable/disable lifecycle, single row per owner+module", async () => {
    await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    let enabled = await svc.listEnabledForOwner("community", "c1");
    expect(enabled).toHaveLength(1);
    await svc.disableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    enabled = await svc.listEnabledForOwner("community", "c1");
    expect(enabled).toHaveLength(0);
  });

  it("enablement DTO carries no business data / PII", async () => {
    const res = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    if (!res.ok) throw new Error("setup");
    expect(Object.keys(res.value).sort()).toEqual(
      ["enabled", "moduleKey", "ownerId", "ownerType", "updatedAt"].sort(),
    );
  });
});
