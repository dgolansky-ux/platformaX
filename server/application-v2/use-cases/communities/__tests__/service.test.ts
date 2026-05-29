import { describe, expect, it } from "vitest";
import { createCommunitiesUseCase } from "../public-api";
import {
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryMembershipRepository,
  createInMemoryJoinRequestRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createInMemoryModuleEnablementStore,
  createModulesService,
} from "@server/domains-v2/modules/public-api";

const FOUNDER = "u-founder";

function makeDeps(defaultModuleKeys?: string[]) {
  let seq = 0;
  const communities = createCommunitiesService({
    communities: createInMemoryCommunityRepository(),
    members: createInMemoryMembershipRepository(),
    joinRequests: createInMemoryJoinRequestRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `c-${++seq}` },
  });
  const modules = createModulesService({
    store: createInMemoryModuleEnablementStore(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
  });
  return { communities, modules, defaultModuleKeys };
}

describe("communities use-case — createCommunityWithDefaults", () => {
  it("creates the community and enables the default modules", async () => {
    const usecase = createCommunitiesUseCase(makeDeps(["topics", "events"]));
    const res = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.community.memberCount).toBe(1);
    expect(res.value.enabledModules.map((m) => m.moduleKey).sort()).toEqual(["events", "topics"]);
  });

  it("propagates the community error and enables nothing on an invalid slug", async () => {
    const usecase = createCommunitiesUseCase(makeDeps(["topics"]));
    const res = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "X", slug: "Bad Slug!" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("INVALID_SLUG");
  });

  it("skips unknown default module keys but still creates the community", async () => {
    const usecase = createCommunitiesUseCase(makeDeps(["topics", "casino"]));
    const res = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!res.ok) throw new Error("setup");
    expect(res.value.enabledModules.map((m) => m.moduleKey)).toEqual(["topics"]);
  });
});

describe("communities use-case — enableCommunityModule", () => {
  it("allows founder to enable a whitelisted module", async () => {
    const deps = makeDeps();
    const usecase = createCommunitiesUseCase(deps);
    const created = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    const enabled = await usecase.enableCommunityModule({
      actorUserId: FOUNDER,
      communityId: created.value.community.id,
      moduleKey: "events",
      enabled: true,
    });
    expect(enabled.ok).toBe(true);
  });

  it("rejects a stranger trying to enable a module", async () => {
    const deps = makeDeps();
    const usecase = createCommunitiesUseCase(deps);
    const created = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    const denied = await usecase.enableCommunityModule({
      actorUserId: "u-stranger",
      communityId: created.value.community.id,
      moduleKey: "events",
      enabled: true,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("FORBIDDEN");
  });

  it("rejects unknown module keys", async () => {
    const deps = makeDeps();
    const usecase = createCommunitiesUseCase(deps);
    const created = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    const denied = await usecase.enableCommunityModule({
      actorUserId: FOUNDER,
      communityId: created.value.community.id,
      moduleKey: "casino",
      enabled: true,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("UNKNOWN_MODULE");
  });
});
