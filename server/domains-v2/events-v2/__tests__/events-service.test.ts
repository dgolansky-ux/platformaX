import { describe, expect, it } from "vitest";
import {
  createEventsService,
  createInMemoryEventRepository,
  type EventModuleEnablementResolver,
  type EventOwnershipResolver,
  type EventsService,
} from "../public-api";

function makeService(opts?: {
  canManage?: boolean;
  eventsEnabled?: boolean;
}): EventsService {
  const ownership: EventOwnershipResolver = {
    async canManageEventsForOwner() {
      return opts?.canManage ?? true;
    },
  };
  const moduleEnablement: EventModuleEnablementResolver = {
    async isEventsEnabled() {
      return opts?.eventsEnabled ?? true;
    },
  };
  let seq = 0;
  return createEventsService({
    events: createInMemoryEventRepository(),
    ownership,
    moduleEnablement,
    clock: { now: () => new Date("2026-05-30T00:00:00Z") },
    ids: { next: () => `event-${++seq}` },
  });
}

describe("events-v2 service", () => {
  it("profile owner can create an online event", async () => {
    const svc = makeService();
    const res = await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "Stream Q&A",
      description: "Open Q&A.",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(true);
  });

  it("community admin can create an offline event with location", async () => {
    const svc = makeService();
    const res = await svc.createEvent({
      ownerType: "community",
      ownerId: "c1",
      title: "Meetup",
      description: "",
      startAt: "2026-06-12T19:00:00Z",
      endAt: "2026-06-12T22:00:00Z",
      locationType: "offline",
      locationText: "Warszawa, Centrum",
      visibility: "public",
      createdByUserId: "u-admin",
    });
    expect(res.ok).toBe(true);
  });

  it("offline event without location text is rejected", async () => {
    const svc = makeService();
    const res = await svc.createEvent({
      ownerType: "community",
      ownerId: "c1",
      title: "Meetup",
      description: "",
      startAt: "2026-06-12T19:00:00Z",
      locationType: "offline",
      visibility: "public",
      createdByUserId: "u-admin",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("LOCATION_INVALID");
  });

  it("end before start is rejected", async () => {
    const svc = makeService();
    const res = await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "Bad",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      endAt: "2026-06-10T17:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("END_BEFORE_START");
  });

  it("invalid startAt is rejected", async () => {
    const svc = makeService();
    const res = await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "Bad",
      description: "",
      startAt: "not-a-date",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.message).toBe("START_AT_INVALID");
  });

  it("unauthorized actor is forbidden", async () => {
    const svc = makeService({ canManage: false });
    const res = await svc.createEvent({
      ownerType: "community",
      ownerId: "c1",
      title: "Hijack",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u-evil",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("FORBIDDEN");
  });

  it("cancelled event status flips", async () => {
    const svc = makeService();
    const created = await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "E",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const res = await svc.cancelEvent({ eventId: created.value.id, actorUserId: "u1" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.status).toBe("cancelled");
  });

  it("listEventsForOwner returns empty when module disabled", async () => {
    const svc = makeService({ eventsEnabled: false });
    await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "E",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    const list = await svc.listEventsForOwner("profile", "u1");
    expect(list).toEqual([]);
  });

  it("public DTO carries no createdByUserId", async () => {
    const svc = makeService();
    const created = await svc.createEvent({
      ownerType: "profile",
      ownerId: "u1",
      title: "E",
      description: "",
      startAt: "2026-06-10T18:00:00Z",
      locationType: "online",
      visibility: "public",
      createdByUserId: "u1",
    });
    if (!created.ok) throw new Error("setup");
    const view = await svc.getEventPublicView(created.value.id);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(Object.keys(view.value)).not.toContain("createdByUserId");
  });
});
