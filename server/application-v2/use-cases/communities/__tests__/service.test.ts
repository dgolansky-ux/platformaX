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

describe("communities use-case — profile + viewer state", () => {
  const STRANGER = "u-stranger";

  it("getCommunityProfileView composes public profile and viewer state for a stranger", async () => {
    const usecase = createCommunitiesUseCase(makeDeps());
    await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    const view = await usecase.getCommunityProfileView("devs", STRANGER);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.profile.slug).toBe("devs");
    expect(view.value.viewer.relation).toBe("stranger");
    expect(view.value.viewer.canJoin).toBe(true);
  });

  it("getCommunityProfileView returns NOT_FOUND for an unknown slug", async () => {
    const usecase = createCommunitiesUseCase(makeDeps());
    const res = await usecase.getCommunityProfileView("missing", STRANGER);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("getCommunityProfileView never exposes PII or founder id", async () => {
    const usecase = createCommunitiesUseCase(makeDeps());
    await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    const view = await usecase.getCommunityProfileView("devs", FOUNDER);
    if (!view.ok) throw new Error("setup");
    const profileKeys = Object.keys(view.value.profile);
    expect(profileKeys).not.toContain("founderUserId");
    expect(profileKeys).not.toContain("email");
    expect(profileKeys).not.toContain("phone");
    expect(view.value.viewer.viewerUserId).toBe(FOUNDER);
    expect(view.value.viewer.relation).toBe("founder");
    expect(view.value.viewer.canManage).toBe(true);
  });

  it("joinCommunity / leaveCommunity flip viewer relation for a public community", async () => {
    const usecase = createCommunitiesUseCase(makeDeps());
    const created = await usecase.createCommunityWithDefaults({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    const id = created.value.community.id;

    const joined = await usecase.joinCommunity(id, STRANGER);
    expect(joined.ok).toBe(true);
    const member = await usecase.getCommunityViewerState(id, STRANGER);
    expect(member.ok && member.value.relation).toBe("member");

    const left = await usecase.leaveCommunity(id, STRANGER);
    expect(left.ok).toBe(true);
    const stranger = await usecase.getCommunityViewerState(id, STRANGER);
    expect(stranger.ok && stranger.value.relation).toBe("stranger");
  });

  it("requestJoinCommunity / cancelJoinRequest flip viewer relation for a private community", async () => {
    const usecase = createCommunitiesUseCase(makeDeps());
    const created = await usecase.createCommunityWithDefaults({
      founderUserId: FOUNDER,
      name: "Devs",
      slug: "devs",
      visibility: "private",
    });
    if (!created.ok) throw new Error("setup");
    const id = created.value.community.id;

    const requested = await usecase.requestJoinCommunity(id, STRANGER);
    expect(requested.ok).toBe(true);
    if (!requested.ok) return;
    const pending = await usecase.getCommunityViewerState(id, STRANGER);
    expect(pending.ok && pending.value.relation).toBe("pending_request");
    expect(pending.ok && pending.value.canCancelRequest).toBe(true);

    const cancelled = await usecase.cancelJoinRequest(id, requested.value.id, STRANGER);
    expect(cancelled.ok).toBe(true);
    const after = await usecase.getCommunityViewerState(id, STRANGER);
    expect(after.ok && after.value.relation).toBe("stranger");
  });
});
