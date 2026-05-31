import { describe, expect, it } from "vitest";
import {
  createInMemoryWorkplaceRepository,
  createNoopWorkplaceEventPublisher,
  createWorkplacesService,
  WORKPLACE_OWNER_ACTIVE_HARD_LIMIT,
  type CreateWorkplaceCommand,
  type WorkplaceContactAccessResolver,
  type WorkplaceContactAccessVerdict,
  type WorkplaceDomainEvent,
  type WorkplaceFriendshipResolver,
  type WorkplacesService,
} from "../public-api";

function makeService(opts?: {
  isFriend?: (viewer: string, owner: string) => boolean;
  verdict?: (viewer: string, owner: string) => WorkplaceContactAccessVerdict;
  capturedEvents?: WorkplaceDomainEvent[];
}): WorkplacesService {
  const friendship: WorkplaceFriendshipResolver = {
    async areFriends(viewerUserId, ownerUserId) {
      return opts?.isFriend?.(viewerUserId, ownerUserId) ?? false;
    },
  };
  const contactAccess: WorkplaceContactAccessResolver = {
    async resolveVerdict(viewerUserId, ownerUserId) {
      return opts?.verdict?.(viewerUserId, ownerUserId) ?? "stranger";
    },
  };
  const events = opts?.capturedEvents
    ? { publish: (e: WorkplaceDomainEvent) => { opts.capturedEvents!.push(e); } }
    : createNoopWorkplaceEventPublisher();
  let seq = 0;
  return createWorkplacesService({
    repo: createInMemoryWorkplaceRepository(),
    friendship,
    contactAccess,
    events,
    clock: { now: () => new Date(`2026-05-30T00:0${(seq % 10).toString()}:00Z`) },
    ids: { next: () => `wp-${++seq}` },
  });
}

function baseCommand(overrides: Partial<CreateWorkplaceCommand> = {}): CreateWorkplaceCommand {
  return {
    actorUserId: "u-owner",
    ownerProfileId: "u-owner",
    name: "Coach Dawid",
    slug: "coach-dawid",
    headline: "Coaching kariery",
    description: "Pomagam ludziom rosnąć w karierze.",
    contactEmail: "owner@example.com",
    contactPhone: "+48 600 000 000",
    websiteUrl: "https://example.com",
    contactVisibility: "friends",
    visibility: "public",
    ...overrides,
  };
}

describe("identity/workplaces service", () => {
  it("creates an active workplace by the profile owner", async () => {
    const svc = makeService();
    const res = await svc.createWorkplace(baseCommand());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("active");
    expect(res.value.visibility).toBe("public");
    expect(res.value.slug).toBe("coach-dawid");
    // public DTO never carries contact email/phone
    expect(res.value).not.toHaveProperty("contactEmail");
    expect(res.value).not.toHaveProperty("contactPhone");
  });

  it("forbids creating a workplace on another user's profile", async () => {
    const svc = makeService();
    const res = await svc.createWorkplace(baseCommand({ actorUserId: "u-other" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("rejects duplicate slug per owner", async () => {
    const svc = makeService();
    const first = await svc.createWorkplace(baseCommand());
    expect(first.ok).toBe(true);
    const dup = await svc.createWorkplace(baseCommand({ slug: "coach-dawid" }));
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.code).toBe("CONFLICT");
  });

  it("rejects an unsafe javascript: website url", async () => {
    const svc = makeService();
    const res = await svc.createWorkplace(baseCommand({ websiteUrl: "javascript:alert(1)" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("WEBSITE_URL_UNSAFE");
  });

  it("rejects a malformed website url", async () => {
    const svc = makeService();
    const res = await svc.createWorkplace(baseCommand({ websiteUrl: "not a url" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("WEBSITE_URL_INVALID");
  });

  it("rejects an invalid slug", async () => {
    const svc = makeService();
    const res = await svc.createWorkplace(baseCommand({ slug: "Bad Slug!" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("SLUG_INVALID");
  });

  it("enforces the active workplaces hard limit per owner", async () => {
    const svc = makeService();
    for (let i = 0; i < WORKPLACE_OWNER_ACTIVE_HARD_LIMIT; i += 1) {
      const created = await svc.createWorkplace(baseCommand({ slug: `wp-${i}` }));
      expect(created.ok).toBe(true);
    }
    const overflow = await svc.createWorkplace(baseCommand({ slug: "wp-overflow" }));
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.error.code).toBe("LIMIT_REACHED");
  });

  it("emits WorkplaceCreated on create", async () => {
    const captured: WorkplaceDomainEvent[] = [];
    const svc = makeService({ capturedEvents: captured });
    await svc.createWorkplace(baseCommand());
    const created = captured.find((e) => e.type === "WorkplaceCreated");
    expect(created).toBeDefined();
  });

  it("allows the owner to update headline + description", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand());
    if (!created.ok) throw new Error("setup");
    const updated = await svc.updateWorkplace({
      actorUserId: "u-owner",
      workplaceId: created.value.id,
      headline: "Nowy headline",
      description: "Nowy opis.",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.headline).toBe("Nowy headline");
    expect(updated.value.description).toBe("Nowy opis.");
  });

  it("forbids non-owner updates", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand());
    if (!created.ok) throw new Error("setup");
    const res = await svc.updateWorkplace({
      actorUserId: "u-attacker",
      workplaceId: created.value.id,
      headline: "Hacked",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("archives a workplace and hides it from non-owner list", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand());
    if (!created.ok) throw new Error("setup");
    const archived = await svc.archiveWorkplace({
      actorUserId: "u-owner",
      workplaceId: created.value.id,
    });
    expect(archived.ok).toBe(true);
    if (!archived.ok) return;
    expect(archived.value.status).toBe("archived");
    const listAsFriend = await svc.listWorkplacesForOwner({
      ownerUserId: "u-owner",
      viewerUserId: "u-friend",
    });
    expect(listAsFriend.ok).toBe(true);
    if (!listAsFriend.ok) return;
    expect(listAsFriend.value).toHaveLength(0);
    const listAsOwner = await svc.listWorkplacesForOwner({
      ownerUserId: "u-owner",
      viewerUserId: "u-owner",
      includeArchived: true,
    });
    expect(listAsOwner.ok).toBe(true);
    if (!listAsOwner.ok) return;
    expect(listAsOwner.value).toHaveLength(1);
  });

  it("hides friends_only workplace from strangers but shows it to friends", async () => {
    const svc = makeService({
      isFriend: (v, o) => v === "u-friend" && o === "u-owner",
    });
    const created = await svc.createWorkplace(baseCommand({ visibility: "friends_only" }));
    if (!created.ok) throw new Error("setup");
    const stranger = await svc.getWorkplaceForViewer(created.value.id, "u-stranger");
    expect(stranger.ok).toBe(false);
    const friend = await svc.getWorkplaceForViewer(created.value.id, "u-friend");
    expect(friend.ok).toBe(true);
  });

  it("never exposes private contact data to a stranger via the contact view", async () => {
    const svc = makeService({
      isFriend: () => false,
      verdict: () => "stranger",
    });
    const created = await svc.createWorkplace(baseCommand({
      visibility: "public",
      contactVisibility: "friends",
    }));
    if (!created.ok) throw new Error("setup");
    const view = await svc.getContactViewForViewer(created.value.id, "u-stranger");
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.contactEmail).toBeNull();
    expect(view.value.contactPhone).toBeNull();
    expect(view.value.viewerCanContact).toBe(false);
    expect(view.value.websiteUrl).toBe("https://example.com");
  });

  it("exposes contact data to a friend when contactVisibility=friends", async () => {
    const svc = makeService({
      isFriend: (v, o) => v === "u-friend" && o === "u-owner",
      verdict: () => "friend",
    });
    const created = await svc.createWorkplace(baseCommand({
      visibility: "public",
      contactVisibility: "friends",
    }));
    if (!created.ok) throw new Error("setup");
    const view = await svc.getContactViewForViewer(created.value.id, "u-friend");
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.contactEmail).toBe("owner@example.com");
    expect(view.value.contactPhone).toBe("+48 600 000 000");
    expect(view.value.viewerCanContact).toBe(true);
  });

  it("owner always sees own contact data", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand({ contactVisibility: "owner_only" }));
    if (!created.ok) throw new Error("setup");
    const view = await svc.getContactViewForViewer(created.value.id, "u-owner");
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.contactEmail).toBe("owner@example.com");
  });

  it("getViewerState reports correct flags for owner vs stranger", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand());
    if (!created.ok) throw new Error("setup");
    const ownerState = await svc.getViewerState(created.value.id, "u-owner");
    expect(ownerState.ok).toBe(true);
    if (!ownerState.ok) return;
    expect(ownerState.value.isOwner).toBe(true);
    expect(ownerState.value.viewerCanEdit).toBe(true);
    expect(ownerState.value.viewerCanPostInMicroFeed).toBe(true);

    const strangerState = await svc.getViewerState(created.value.id, "u-stranger");
    expect(strangerState.ok).toBe(true);
    if (!strangerState.ok) return;
    expect(strangerState.value.isOwner).toBe(false);
    expect(strangerState.value.viewerCanEdit).toBe(false);
    expect(strangerState.value.viewerCanPostInMicroFeed).toBe(false);
  });

  it("getWorkplaceBySlugForViewer resolves a public workplace by slug", async () => {
    const svc = makeService();
    const created = await svc.createWorkplace(baseCommand({ slug: "by-slug" }));
    if (!created.ok) throw new Error("setup");
    const res = await svc.getWorkplaceBySlugForViewer("u-owner", "by-slug", "u-stranger");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.id).toBe(created.value.id);
  });
});
