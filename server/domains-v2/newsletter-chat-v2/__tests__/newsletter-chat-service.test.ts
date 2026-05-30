import { describe, expect, it } from "vitest";
import {
  createInMemoryNewsletterChatRepository,
  createInMemoryNewsletterMessageRepository,
  createInMemoryNewsletterSubscriberRepository,
  createNewsletterChatService,
  type NewsletterAuthorityResolver,
  type NewsletterChatService,
  type NewsletterModuleEnablementResolver,
} from "../public-api";

function makeService(opts?: {
  authority?: (actor: string, ownerType: string, ownerId: string) => boolean;
  enabled?: boolean;
}): NewsletterChatService {
  const authority: NewsletterAuthorityResolver = {
    async canPublishForOwner(actorUserId, ownerType, ownerId) {
      return opts?.authority?.(actorUserId, ownerType, ownerId) ?? true;
    },
  };
  const moduleEnablement: NewsletterModuleEnablementResolver = {
    async isNewsletterChatEnabled() {
      return opts?.enabled ?? true;
    },
  };
  let seq = 0;
  return createNewsletterChatService({
    chats: createInMemoryNewsletterChatRepository(),
    messages: createInMemoryNewsletterMessageRepository(),
    subscribers: createInMemoryNewsletterSubscriberRepository(),
    authority,
    moduleEnablement,
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `n-${++seq}` },
  });
}

describe("newsletter-chat-v2 service", () => {
  it("owner creates a newsletter chat for profile", async () => {
    const svc = makeService();
    const res = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "Tygodniówka",
      description: "Co tydzień nowy materiał.",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(true);
  });

  it("community admin creates a newsletter chat for community", async () => {
    const svc = makeService();
    const res = await svc.createNewsletterChatForOwner({
      ownerType: "community",
      ownerId: "c1",
      title: "Broadcast",
      description: "",
      visibility: "members_only",
      createdByUserId: "u-admin",
    });
    expect(res.ok).toBe(true);
  });

  it("unauthorized actor cannot publish a message", async () => {
    let authorityOwner = true;
    const svc = makeService({
      authority: (actor) => {
        if (actor === "u-owner") return true;
        if (actor === "u-stranger") return false;
        return authorityOwner;
      },
    });
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u-owner",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u-owner",
    });
    if (!created.ok) throw new Error("setup");
    authorityOwner = false;
    const pub = await svc.publishNewsletterMessage({
      newsletterChatId: created.value.id,
      authorUserId: "u-stranger",
      body: "Spam from a subscriber.",
    });
    expect(pub.ok).toBe(false);
    if (!pub.ok) expect(pub.error.code).toBe("FORBIDDEN");
  });

  it("owner publishes a message and listNewsletterMessages returns it without author id", async () => {
    const svc = makeService();
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const pub = await svc.publishNewsletterMessage({
      newsletterChatId: created.value.id,
      authorUserId: "u1",
      body: "Hello subscribers!",
    });
    expect(pub.ok).toBe(true);
    const list = await svc.listNewsletterMessages(created.value.id);
    expect(list).toHaveLength(1);
    expect(list[0].body).toBe("Hello subscribers!");
    expect(Object.keys(list[0])).not.toContain("authorUserId");
  });

  it("empty body is rejected", async () => {
    const svc = makeService();
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const pub = await svc.publishNewsletterMessage({
      newsletterChatId: created.value.id,
      authorUserId: "u1",
      body: "   ",
    });
    expect(pub.ok).toBe(false);
    if (!pub.ok) expect(pub.error.message).toBe("BODY_REQUIRED");
  });

  it("subscribe + count + unsubscribe lifecycle", async () => {
    const svc = makeService();
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    await svc.subscribeToNewsletterChat({
      newsletterChatId: created.value.id,
      subscriberUserId: "u-sub-1",
    });
    await svc.subscribeToNewsletterChat({
      newsletterChatId: created.value.id,
      subscriberUserId: "u-sub-2",
    });
    let view = await svc.getNewsletterChatPublicView(created.value.id);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.subscriberCount).toBe(2);
    await svc.unsubscribeFromNewsletterChat({
      newsletterChatId: created.value.id,
      subscriberUserId: "u-sub-1",
    });
    view = await svc.getNewsletterChatPublicView(created.value.id);
    if (!view.ok) throw new Error("setup");
    expect(view.value.subscriberCount).toBe(1);
  });

  it("module disabled hides listNewsletterMessages", async () => {
    const svc = makeService({ enabled: false });
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    await svc.publishNewsletterMessage({
      newsletterChatId: created.value.id,
      authorUserId: "u1",
      body: "ping",
    });
    const list = await svc.listNewsletterMessages(created.value.id);
    expect(list).toEqual([]);
  });

  it("public chat DTO does not leak createdByUserId", async () => {
    const svc = makeService();
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const view = await svc.getNewsletterChatPublicView(created.value.id);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(Object.keys(view.value)).not.toContain("createdByUserId");
  });

  it("paused chat blocks new publications", async () => {
    const svc = makeService();
    const created = await svc.createNewsletterChatForOwner({
      ownerType: "profile",
      ownerId: "u1",
      title: "N",
      description: "",
      visibility: "public_preview",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    await svc.updateNewsletterChat({
      newsletterChatId: created.value.id,
      actorUserId: "u1",
      status: "paused",
    });
    const pub = await svc.publishNewsletterMessage({
      newsletterChatId: created.value.id,
      authorUserId: "u1",
      body: "ping",
    });
    expect(pub.ok).toBe(false);
    if (!pub.ok) expect(pub.error.code).toBe("INACTIVE");
  });
});
