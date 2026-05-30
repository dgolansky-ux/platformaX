// FIXED_CAP: tests against the modules service whose per-owner rows are
// bounded by MODULE_DEFINITIONS — listAllForOwner is intentionally unbounded.
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryModuleEnablementStore,
  createModulesService,
  type ModulesService,
} from "../public-api";

function makeService(): ModulesService {
  return createModulesService({
    store: createInMemoryModuleEnablementStore(),
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
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

  it("definitions carry allowedOwnerTypes and visibilitySupport", () => {
    const defs = svc.listDefinitions();
    const topics = defs.find((d) => d.key === "topics");
    expect(topics?.allowedOwnerTypes).toEqual(["profile", "community"]);
    expect(topics?.visibilitySupport).toContain("public");
    const channelEntry = defs.find((d) => d.key === "channel_entry");
    expect(channelEntry?.allowedOwnerTypes).toEqual(["community"]);
  });

  it("rejects an unknown module key", async () => {
    const res = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "casino" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNKNOWN_MODULE");
  });

  it("allows topics for both profile and community", async () => {
    const a = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "topics" });
    expect(a.ok).toBe(true);
    const b = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    expect(b.ok).toBe(true);
  });

  it("allows events for both profile and community", async () => {
    const a = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "events" });
    expect(a.ok).toBe(true);
    const b = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "events" });
    expect(b.ok).toBe(true);
  });

  it("allows integrations + newsletter_chat for profile", async () => {
    const a = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "integrations" });
    expect(a.ok).toBe(true);
    const b = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "newsletter_chat" });
    expect(b.ok).toBe(true);
  });

  it("blocks channel_entry on profile (community-only)", async () => {
    const bad = await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "channel_entry" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe("OWNER_TYPE_NOT_ALLOWED");
  });

  it("rejects invalid visibility", async () => {
    const bad = await svc.enableForOwner({
      ownerType: "profile",
      ownerId: "u1",
      moduleKey: "topics",
      visibility: "owner_only",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe("INVALID_VISIBILITY");
  });

  it("setVisibility updates only the visibility (no enable side-effect)", async () => {
    await svc.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "topics" });
    const res = await svc.setVisibility({
      ownerType: "profile",
      ownerId: "u1",
      moduleKey: "topics",
      visibility: "members_only",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.visibility).toBe("members_only");
    expect(res.value.enabled).toBe(true);
  });

  it("enable/disable lifecycle, single row per owner+module", async () => {
    await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    let enabled = await svc.listEnabledForOwner("community", "c1");
    expect(enabled).toHaveLength(1);
    await svc.disableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    enabled = await svc.listEnabledForOwner("community", "c1");
    expect(enabled).toHaveLength(0);
    const all = await svc.listAllForOwner("community", "c1");
    expect(all).toHaveLength(1);
    expect(all[0].enabled).toBe(false);
  });

  it("enablement DTO carries no business data / PII", async () => {
    const res = await svc.enableForOwner({ ownerType: "community", ownerId: "c1", moduleKey: "topics" });
    if (!res.ok) throw new Error("setup");
    expect(Object.keys(res.value).sort()).toEqual(
      ["createdAt", "enabled", "moduleKey", "order", "ownerId", "ownerType", "updatedAt", "visibility"].sort(),
    );
  });
});
