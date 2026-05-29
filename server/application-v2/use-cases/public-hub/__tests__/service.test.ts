import { describe, expect, it } from "vitest";
import { createPublicHubUseCase } from "../public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";
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

// Minimal identity stub: the use-case only calls getPublicProfile.
function identityStub(profile: { userId: string; visibility: "public" | "friends" | "private" } | null): IdentityService {
  return {
    async getPublicProfile(_viewerId: string | null, profileUserId: string) {
      if (!profile || profile.userId !== profileUserId) {
        return { ok: false as const, error: { code: "NOT_FOUND", message: "x" } } as never;
      }
      return {
        ok: true as const,
        value: {
          userId: profile.userId,
          profileSlug: "ada",
          displayName: "Ada",
          avatarMediaRef: null,
          bannerMediaRef: null,
          bio: null,
          location: null,
          civilStatus: null,
          socialLinks: null,
          personalStatus: null,
          visibility: profile.visibility,
          onboardingCompleted: true,
        },
      } as never;
    },
  } as unknown as IdentityService;
}

function makeBackends() {
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
  return { communities, modules };
}

describe("public-hub use-case", () => {
  it("composes a community hub view with enabled module keys", async () => {
    const { communities, modules } = makeBackends();
    const created = await communities.createCommunity({ founderUserId: FOUNDER, name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    await modules.enableForOwner({ ownerType: "community", ownerId: created.value.id, moduleKey: "channel_entry" });

    const usecase = createPublicHubUseCase({ identity: identityStub(null), communities, modules });
    const res = await usecase.getCommunityHubView(created.value.id);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.owner.displayName).toBe("Devs");
    expect(res.value.modules.map((m) => m.key)).toContain("channel_entry");
    expect(res.value.sections).toContain("channels");
  });

  it("returns NOT_FOUND for an unknown community", async () => {
    const { communities, modules } = makeBackends();
    const usecase = createPublicHubUseCase({ identity: identityStub(null), communities, modules });
    const res = await usecase.getCommunityHubView("missing");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("composes a profile hub view from identity", async () => {
    const { communities, modules } = makeBackends();
    const usecase = createPublicHubUseCase({
      identity: identityStub({ userId: "u1", visibility: "public" }),
      communities,
      modules,
    });
    const res = await usecase.getProfileHubView("u1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.ownerType).toBe("profile");
    expect(res.value.owner.displayName).toBe("Ada");
  });
});
