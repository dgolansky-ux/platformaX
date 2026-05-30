import { describe, expect, it } from "vitest";
import { createPublicHubUseCase } from "../public-api";
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import {
  createCommunitiesService,
  createInMemoryCommunityRepository,
  createInMemoryJoinRequestRepository,
  createInMemoryMembershipRepository,
} from "@server/domains-v2/communities-v2/public-api";
import {
  createInMemoryModuleEnablementStore,
  createModulesService,
} from "@server/domains-v2/modules/public-api";
import {
  createInMemoryTopicRepository,
  createTopicsService,
} from "@server/domains-v2/topics-v2/public-api";
import {
  createEventsService,
  createInMemoryEventRepository,
} from "@server/domains-v2/events-v2/public-api";
import {
  createInMemoryIntegrationRepository,
  createIntegrationsService,
} from "@server/domains-v2/integrations-v2/public-api";
import {
  createInMemoryNewsletterChatRepository,
  createInMemoryNewsletterMessageRepository,
  createInMemoryNewsletterSubscriberRepository,
  createNewsletterChatService,
} from "@server/domains-v2/newsletter-chat-v2/public-api";

const CLOCK = { now: () => new Date("2026-05-30T00:00:00Z") };

function identityStub(profile: { userId: string; visibility: "public" } | null): IdentityService {
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
    clock: CLOCK,
    ids: { next: () => `c-${++seq}` },
  });
  const modules = createModulesService({
    store: createInMemoryModuleEnablementStore(),
    clock: CLOCK,
  });
  const topics = createTopicsService({
    topics: createInMemoryTopicRepository(),
    ownership: { async canManageTopicsForOwner() { return true; } },
    moduleEnablement: {
      async isTopicsEnabled(ownerType, ownerId) {
        const list = await modules.listEnabledForOwner(ownerType, ownerId);
        return list.some((e) => e.moduleKey === "topics");
      },
    },
    clock: CLOCK,
    ids: { next: () => `topic-${++seq}` },
  });
  const events = createEventsService({
    events: createInMemoryEventRepository(),
    ownership: { async canManageEventsForOwner() { return true; } },
    moduleEnablement: {
      async isEventsEnabled(ownerType, ownerId) {
        const list = await modules.listEnabledForOwner(ownerType, ownerId);
        return list.some((e) => e.moduleKey === "events");
      },
    },
    clock: CLOCK,
    ids: { next: () => `event-${++seq}` },
  });
  const integrations = createIntegrationsService({
    integrations: createInMemoryIntegrationRepository(),
    ownership: { async canManageIntegrationsForOwner() { return true; } },
    moduleEnablement: {
      async isIntegrationsEnabled(ownerType, ownerId) {
        const list = await modules.listEnabledForOwner(ownerType, ownerId);
        return list.some((e) => e.moduleKey === "integrations");
      },
    },
    clock: CLOCK,
    ids: { next: () => `integration-${++seq}` },
  });
  const newsletterChat = createNewsletterChatService({
    chats: createInMemoryNewsletterChatRepository(),
    messages: createInMemoryNewsletterMessageRepository(),
    subscribers: createInMemoryNewsletterSubscriberRepository(),
    authority: { async canPublishForOwner() { return true; } },
    moduleEnablement: {
      async isNewsletterChatEnabled(ownerType, ownerId) {
        const list = await modules.listEnabledForOwner(ownerType, ownerId);
        return list.some((e) => e.moduleKey === "newsletter_chat");
      },
    },
    clock: CLOCK,
    ids: { next: () => `nc-${++seq}` },
  });
  return { communities, modules, topics, events, integrations, newsletterChat };
}

describe("public-hub use-case — rich profile hub composition", () => {
  it("composes a profile hub with topics + events slots when modules are enabled", async () => {
    const { communities, modules, topics, events, integrations, newsletterChat } = makeBackends();
    await modules.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "topics" });
    await modules.enableForOwner({ ownerType: "profile", ownerId: "u1", moduleKey: "events" });

    await topics.createTopic({
      ownerType: "profile",
      ownerId: "u1",
      title: "Wellness",
      description: "",
      slug: "wellness",
      visibility: "public",
      createdByUserId: "u1",
    });
    await events.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "Live Q&A",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });

    const uc = createPublicHubUseCase({
      identity: identityStub({ userId: "u1", visibility: "public" }),
      communities,
      modules,
      topics,
      events,
      integrations,
      newsletterChat,
    });
    const res = await uc.getPersonalProfileHubView("u1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.ownerType).toBe("profile");
    expect(res.value.slots.map((s) => s.key)).toEqual(["topics", "events"]);
    const topicsSlot = res.value.slots.find((s) => s.key === "topics");
    if (topicsSlot && topicsSlot.data.kind === "topics") {
      expect(topicsSlot.data.topics).toHaveLength(1);
      expect(topicsSlot.data.topics[0].slug).toBe("wellness");
    } else {
      throw new Error("topics slot missing");
    }
    const eventsSlot = res.value.slots.find((s) => s.key === "events");
    if (eventsSlot && eventsSlot.data.kind === "events") {
      expect(eventsSlot.data.events).toHaveLength(1);
      expect(eventsSlot.data.events[0].title).toBe("Live Q&A");
    } else {
      throw new Error("events slot missing");
    }
  });

  it("returns NOT_FOUND for an unknown profile", async () => {
    const { communities, modules } = makeBackends();
    const uc = createPublicHubUseCase({
      identity: identityStub(null),
      communities,
      modules,
    });
    const res = await uc.getPersonalProfileHubView("ghost");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("NOT_FOUND");
  });

  it("does not include slots for disabled modules", async () => {
    const { communities, modules, topics, events, integrations, newsletterChat } = makeBackends();
    const uc = createPublicHubUseCase({
      identity: identityStub({ userId: "u1", visibility: "public" }),
      communities,
      modules,
      topics,
      events,
      integrations,
      newsletterChat,
    });
    const res = await uc.getPersonalProfileHubView("u1");
    if (!res.ok) throw new Error("setup");
    expect(res.value.slots).toEqual([]);
  });

  it("profile slots never include channel_entry (community-only)", async () => {
    const { communities, modules, topics, events, integrations, newsletterChat } = makeBackends();
    // Attempt to enable channel_entry for profile should fail — but if some legacy row
    // existed it should still be filtered by allowedOwnerTypes in slot composition.
    const bad = await modules.enableForOwner({
      ownerType: "profile",
      ownerId: "u1",
      moduleKey: "channel_entry",
    });
    expect(bad.ok).toBe(false);
    const uc = createPublicHubUseCase({
      identity: identityStub({ userId: "u1", visibility: "public" }),
      communities,
      modules,
      topics,
      events,
      integrations,
      newsletterChat,
    });
    const res = await uc.getPersonalProfileHubView("u1");
    if (!res.ok) throw new Error("setup");
    expect(res.value.slots.find((s) => s.key === "channel_entry")).toBeUndefined();
  });

  it("composes a community hub with integrations + newsletter_chat slots", async () => {
    const { communities, modules, topics, events, integrations, newsletterChat } = makeBackends();
    const created = await communities.createCommunity({ founderUserId: "u-f", name: "Devs", slug: "devs" });
    if (!created.ok) throw new Error("setup");
    await modules.enableForOwner({ ownerType: "community", ownerId: created.value.id, moduleKey: "integrations" });
    await modules.enableForOwner({ ownerType: "community", ownerId: created.value.id, moduleKey: "newsletter_chat" });

    await integrations.createIntegration({
      ownerType: "community",
      ownerId: created.value.id,
      kind: "website",
      name: "Devs site",
      url: "https://devs.example",
      visibility: "public",
      createdByUserId: "u-f",
    });
    await newsletterChat.createNewsletterChatForOwner({
      ownerType: "community",
      ownerId: created.value.id,
      title: "Devs Broadcast",
      description: "Tygodniowe streszczenie.",
      visibility: "public_preview",
      createdByUserId: "u-f",
    });

    const uc = createPublicHubUseCase({
      identity: identityStub(null),
      communities,
      modules,
      topics,
      events,
      integrations,
      newsletterChat,
    });
    const res = await uc.getCommunityHubViewWithSlots(created.value.id);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.slots.map((s) => s.key)).toEqual(["integrations", "newsletter_chat"]);
    const intSlot = res.value.slots.find((s) => s.key === "integrations");
    if (intSlot && intSlot.data.kind === "integrations") {
      expect(intSlot.data.integrations).toHaveLength(1);
    } else throw new Error("integrations slot missing");
    const ncSlot = res.value.slots.find((s) => s.key === "newsletter_chat");
    if (ncSlot && ncSlot.data.kind === "newsletter_chat") {
      expect(ncSlot.data.newsletterChats).toHaveLength(1);
    } else throw new Error("newsletter_chat slot missing");
  });

  it("rich profile hub owner summary carries no PII", async () => {
    const { communities, modules, topics, events, integrations, newsletterChat } = makeBackends();
    const uc = createPublicHubUseCase({
      identity: identityStub({ userId: "u1", visibility: "public" }),
      communities,
      modules,
      topics,
      events,
      integrations,
      newsletterChat,
    });
    const res = await uc.getPersonalProfileHubView("u1");
    if (!res.ok) throw new Error("setup");
    const ownerKeys = Object.keys(res.value.owner);
    expect(ownerKeys).not.toContain("email");
    expect(ownerKeys).not.toContain("phone");
  });
});
