import { beforeEach, describe, expect, it } from "vitest";
import {
  createSocialContactsService,
  type SocialContactsService,
} from "../social-contacts-service";
import {
  createInMemoryAddressBookRepository,
  createInMemoryContactGroupRepository,
  createInMemoryFriendRequestRepository,
  createInMemoryFriendshipRepository,
  createInMemorySpecialistRepository,
} from "../social-contacts-store";
import { toUserId } from "@shared/contracts/branded-ids";

const ALICE = toUserId("u-alice");
const BOB = toUserId("u-bob");
const CAROL = toUserId("u-carol");

function makeService(): SocialContactsService {
  let seq = 0;
  return createSocialContactsService({
    friends: createInMemoryFriendshipRepository(),
    friendRequests: createInMemoryFriendRequestRepository(),
    addressBook: createInMemoryAddressBookRepository(),
    specialists: createInMemorySpecialistRepository(),
    groups: createInMemoryContactGroupRepository(),
    clock: { now: () => new Date("2026-05-29T01:00:00Z") },
    ids: { next: () => `fr-${++seq}` },
  });
}

describe("social-contacts-service / friendships", () => {
  let svc: SocialContactsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("blocks self friend request", async () => {
    const res = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: ALICE,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("SELF_RELATION_NOT_ALLOWED");
  });

  it("blocks duplicate pending in same direction", async () => {
    await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    const second = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("PENDING_DUPLICATE");
  });

  it("only receiver may respond", async () => {
    const created = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    if (!created.ok) throw new Error("setup failed");
    const wrong = await svc.respondToFriendRequest({
      requestId: created.value.id,
      responderUserId: CAROL,
      action: "accepted",
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error.code).toBe("NOT_RECEIVER");
  });

  it("accepting a request creates the mutual friendship", async () => {
    const created = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    if (!created.ok) throw new Error("setup failed");
    const accepted = await svc.respondToFriendRequest({
      requestId: created.value.id,
      responderUserId: BOB,
      action: "accepted",
    });
    expect(accepted.ok).toBe(true);
    expect(await svc.areFriends(ALICE, BOB)).toBe(true);
    expect(await svc.areFriends(BOB, ALICE)).toBe(true);
  });

  it("rejecting a request does NOT create a friendship", async () => {
    const created = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    if (!created.ok) throw new Error("setup failed");
    await svc.respondToFriendRequest({
      requestId: created.value.id,
      responderUserId: BOB,
      action: "rejected",
    });
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
  });

  it("removeFriend removes the mutual relation", async () => {
    const created = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      receiverUserId: BOB,
    });
    if (!created.ok) throw new Error("setup failed");
    await svc.respondToFriendRequest({
      requestId: created.value.id,
      responderUserId: BOB,
      action: "accepted",
    });
    await svc.removeFriend(ALICE, BOB);
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
  });
});

describe("social-contacts-service / address book + specialists", () => {
  let svc: SocialContactsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("address-book is one-sided and idempotent", async () => {
    const r = await svc.addAddressBookContact({
      ownerId: ALICE,
      contactId: BOB,
    });
    expect(r.ok).toBe(true);
    expect(await svc.isAddressBookContact(ALICE, BOB)).toBe(true);
    // the other side does NOT see ALICE as a contact
    expect(await svc.isAddressBookContact(BOB, ALICE)).toBe(false);
    // adding twice does not duplicate
    await svc.addAddressBookContact({ ownerId: ALICE, contactId: BOB });
    expect((await svc.listAddressBook(ALICE)).length).toBe(1);
  });

  it("blocks self address-book entry", async () => {
    const r = await svc.addAddressBookContact({
      ownerId: ALICE,
      contactId: ALICE,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("SELF_RELATION_NOT_ALLOWED");
  });

  it("address-book add/remove cycle", async () => {
    await svc.addAddressBookContact({ ownerId: ALICE, contactId: BOB });
    await svc.removeAddressBookContact(ALICE, BOB);
    expect(await svc.isAddressBookContact(ALICE, BOB)).toBe(false);
  });

  it("specialist add/remove cycle and self-block", async () => {
    const add = await svc.addSpecialist({
      ownerId: ALICE,
      specialistId: BOB,
    });
    expect(add.ok).toBe(true);
    expect(await svc.isSpecialist(ALICE, BOB)).toBe(true);
    await svc.removeSpecialist(ALICE, BOB);
    expect(await svc.isSpecialist(ALICE, BOB)).toBe(false);

    const self = await svc.addSpecialist({
      ownerId: ALICE,
      specialistId: ALICE,
    });
    expect(self.ok).toBe(false);
  });

  it("address-book contact does NOT make them a friend (relation separation)", async () => {
    await svc.addAddressBookContact({ ownerId: ALICE, contactId: BOB });
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
  });

  it("specialist does NOT make them a friend or address-book contact", async () => {
    await svc.addSpecialist({ ownerId: ALICE, specialistId: BOB });
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
    expect(await svc.isAddressBookContact(ALICE, BOB)).toBe(false);
  });
});

describe("social-contacts-service / owner-local friend circles", () => {
  let svc: SocialContactsService;
  beforeEach(() => {
    svc = makeService();
  });

  it("setting a circle is owner-local and requires no consent / no friendship", async () => {
    const res = await svc.setFriendCircle({
      ownerId: ALICE,
      personId: BOB,
      circle: "close_family",
    });
    expect(res.ok).toBe(true);
    expect(await svc.getFriendCircle(ALICE, BOB)).toBe("close_family");
    // labelling does NOT create a friendship and is one-directional
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
    expect(await svc.getFriendCircle(BOB, ALICE)).toBe("none");
  });

  it("does not auto-add to address book or specialists", async () => {
    await svc.setFriendCircle({
      ownerId: ALICE,
      personId: BOB,
      circle: "distant_friend",
    });
    expect(await svc.isAddressBookContact(ALICE, BOB)).toBe(false);
    expect(await svc.isSpecialist(ALICE, BOB)).toBe(false);
  });

  it("setting 'none' clears the label", async () => {
    await svc.setFriendCircle({
      ownerId: ALICE,
      personId: BOB,
      circle: "close_friend",
    });
    await svc.setFriendCircle({ ownerId: ALICE, personId: BOB, circle: "none" });
    expect(await svc.getFriendCircle(ALICE, BOB)).toBe("none");
    expect((await svc.listFriendCircles(ALICE)).length).toBe(0);
  });

  it("blocks putting yourself into a circle", async () => {
    const res = await svc.setFriendCircle({
      ownerId: ALICE,
      personId: ALICE,
      circle: "close_friend",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("SELF_RELATION_NOT_ALLOWED");
  });
});
