import { describe, expect, it } from "vitest";
import {
  createPublicHubService,
  visibleSections,
  type HubOwnerSummary,
} from "../public-api";
import type { HubModulesResolver, HubOwnerResolver } from "../contracts";

const profileSummary: HubOwnerSummary = {
  ownerType: "profile",
  ownerId: "u1",
  displayName: "Ada",
  handle: "ada",
  avatarRef: null,
  visibility: "public",
};

const communitySummary: HubOwnerSummary = {
  ownerType: "community",
  ownerId: "c1",
  displayName: "Devs",
  handle: "devs",
  avatarRef: null,
  visibility: "public",
};

function makeService(opts: {
  profile?: HubOwnerSummary | null;
  community?: HubOwnerSummary | null;
  keys?: string[];
}) {
  const owner: HubOwnerResolver = {
    getProfileSummary: async () => opts.profile ?? null,
    getCommunitySummary: async () => opts.community ?? null,
  };
  const modules: HubModulesResolver = {
    listEnabledModuleKeys: async () => opts.keys ?? [],
  };
  return createPublicHubService({ owner, modules });
}

describe("public-hub composition service", () => {
  it("composes a profile hub view with no PII", async () => {
    const svc = makeService({ profile: profileSummary, keys: ["topics"] });
    const res = await svc.getProfileHubView("u1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.ownerType).toBe("profile");
    expect(res.value.modules).toEqual([{ key: "topics", enabled: true }]);
    expect(Object.keys(res.value.owner)).not.toContain("email");
    expect(Object.keys(res.value.owner)).not.toContain("phone");
  });

  it("returns NOT_FOUND when the owner summary is absent", async () => {
    const svc = makeService({ profile: null });
    const res = await svc.getProfileHubView("ghost");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("community hub with channel_entry exposes the channels section", async () => {
    const svc = makeService({ community: communitySummary, keys: ["channel_entry"] });
    const res = await svc.getCommunityHubView("c1");
    if (!res.ok) throw new Error("setup");
    expect(res.value.sections).toContain("channels");
  });

  it("visibleSections: about always; modules only when enabled; channels community-only", () => {
    expect(visibleSections("profile", [])).toEqual(["about", "feed_preview"]);
    expect(visibleSections("community", [])).toEqual(["about"]);
    expect(visibleSections("community", ["topics"])).toEqual(["about", "modules"]);
    expect(visibleSections("profile", ["channel_entry"])).not.toContain("channels");
  });
});
