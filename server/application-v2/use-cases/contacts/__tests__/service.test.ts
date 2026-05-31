import { beforeEach, describe, expect, it } from "vitest";
import {
  createContactsApplicationService,
  type ContactsApplicationService,
} from "../service";
import { makeRelationshipSignalResolver } from "../internals";
import {
  createContactAccessService,
  createInMemoryContactFieldsRepository,
  createInMemoryContactPermissionsRepository,
  createInMemoryContactRequestsRepository,
  type ContactAccessService,
} from "@server/domains-v2/identity/public-api";
import {
  createInMemoryAddressBookRepository,
  createInMemoryContactGroupRepository,
  createInMemoryFriendRequestRepository,
  createInMemoryFriendshipRepository,
  createInMemorySpecialistRepository,
  createSocialContactsService,
  type SocialContactsService,
} from "@server/domains-v2/social/public-api";
import { toUserId } from "@shared/contracts/branded-ids";

const OWNER = toUserId("u-owner");
const VIEWER = toUserId("u-viewer");

function wire(): {
  app: ContactsApplicationService;
  identity: ContactAccessService;
  social: SocialContactsService;
} {
  const social = createSocialContactsService({
    friends: createInMemoryFriendshipRepository(),
    friendRequests: createInMemoryFriendRequestRepository(),
    addressBook: createInMemoryAddressBookRepository(),
    specialists: createInMemorySpecialistRepository(),
    groups: createInMemoryContactGroupRepository(),
    clock: { now: () => new Date("2026-05-29T02:00:00Z") },
    ids: (() => {
      let n = 0;
      return { next: () => `fr-${++n}` };
    })(),
  });

  let identitySeq = 0;
  const identityDeps = {
    fields: createInMemoryContactFieldsRepository(),
    permissions: createInMemoryContactPermissionsRepository(),
    requests: createInMemoryContactRequestsRepository(),
    clock: { now: () => new Date("2026-05-29T02:00:00Z") },
    ids: { next: () => `req-${++identitySeq}` },
  };

  // First create identity service with a stub resolver so we can use it
  // when building the real resolver (which closes over identity).
  const identityStub = createContactAccessService({
    ...identityDeps,
    friendship: {
      async resolve() {
        return { isFriend: false, acceptedContactRequest: null };
      },
    },
  });

  // The real resolver references identity (for accepted-request lookup)
  // and social (for friendship). Build it after identity exists, then
  // re-wire identity to use the real resolver.
  const resolver = makeRelationshipSignalResolver(social, identityStub);
  const identity = createContactAccessService({
    ...identityDeps,
    friendship: resolver,
  });

  const app = createContactsApplicationService({
    identityContactAccess: identity,
    socialContacts: social,
  });
  return { app, identity, social };
}

describe("contacts application service / view DTO + actions", () => {
  let app: ContactsApplicationService;
  let identity: ContactAccessService;
  let social: SocialContactsService;
  beforeEach(() => {
    const wired = wire();
    app = wired.app;
    identity = wired.identity;
    social = wired.social;
  });

  it("anonymous viewer sees zero PII and no actions", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      phone: "+48-secret",
      emailContact: "owner@example.com",
    });
    const res = await app.getProfileContactRelationship(OWNER, null);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.visibleContactFields).toEqual({});
    expect(res.value.availableActions).toEqual([]);
    expect(res.value.isMutualFriend).toBe(false);
    expect(res.value.friendCircle).toBe("none");
  });

  it("stranger viewer sees zero PII and the right action set", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      phone: "+48-secret",
    });
    const res = await app.getProfileContactRelationship(OWNER, VIEWER);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.visibleContactFields).toEqual({});
    expect(res.value.availableActions).toContain("REQUEST_CONTACT");
    expect(res.value.availableActions).toContain("SEND_FRIEND_REQUEST");
    expect(res.value.availableActions).toContain("ADD_TO_CONTACTS");
    expect(res.value.availableActions).toContain("ADD_AS_SPECIALIST");
  });

  it("after accepted request + permission ON, the viewer sees the approved field only", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      phone: "+48-secret",
      emailContact: "owner@example.com",
    });
    await identity.updateMyContactPermissions({
      userId: OWNER,
      patch: { phone: { friends: false, approved: true } },
    });
    const created = await app.requestContactAccess({
      fromUserId: VIEWER,
      toUserId: OWNER,
      message: "Cześć, jestem zainteresowany współpracą.",
    });
    if (!created.ok) throw new Error("setup failed");
    const acc = await app.acceptContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      approvedFields: ["phone"],
    });
    expect(acc.ok).toBe(true);
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.visibleContactFields.phone).toBe("+48-secret");
    expect(view.value.visibleContactFields.emailContact).toBeUndefined();
  });

  it("friendship alone does NOT reveal PII when permission.friends is OFF", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      phone: "+48-secret",
    });
    const fr = await social.sendFriendRequest({
      requesterUserId: VIEWER,
      receiverUserId: OWNER,
    });
    if (!fr.ok) throw new Error("setup failed");
    await social.respondToFriendRequest({
      requestId: fr.value.id,
      responderUserId: OWNER,
      action: "accepted",
    });
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.isMutualFriend).toBe(true);
    expect(view.value.visibleContactFields).toEqual({});
    expect(view.value.availableActions).toContain("REMOVE_FRIEND");
  });

  it("getContactsTabData aggregates all four lists for the owner", async () => {
    await social.addAddressBookContact({ ownerId: OWNER, contactId: VIEWER });
    await social.addSpecialist({ ownerId: OWNER, specialistId: VIEWER });
    const incomingFR = await social.sendFriendRequest({
      requesterUserId: VIEWER,
      receiverUserId: OWNER,
    });
    if (!incomingFR.ok) throw new Error("setup failed");
    const incomingCR = await identity.sendContactRequest({
      fromUserId: VIEWER,
      toUserId: OWNER,
      message: "please",
    });
    if (!incomingCR.ok) throw new Error("setup failed");

    const tab = await app.getContactsTabData(OWNER);
    if (!tab.ok) throw new Error("tab failed");
    expect(tab.value.contacts.length).toBe(1);
    expect(tab.value.specialists.length).toBe(1);
    expect(tab.value.incomingFriendRequests.length).toBe(1);
    expect(tab.value.incomingContactRequests.length).toBe(1);
    expect(tab.value.friends.length).toBe(0);
  });

  it("requestContactAccess rejects self-request via the application error code", async () => {
    const res = await app.requestContactAccess({
      fromUserId: OWNER,
      toUserId: OWNER,
      message: "hi",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("SELF_REQUEST_NOT_ALLOWED");
  });

  it("rejectContactRequest does not reveal any field", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      phone: "+48-secret",
    });
    const created = await app.requestContactAccess({
      fromUserId: VIEWER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    await app.rejectContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
    });
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.visibleContactFields).toEqual({});
  });
});

describe("contacts owner-logic / four-concept separation", () => {
  let app: ContactsApplicationService;
  let identity: ContactAccessService;
  let social: SocialContactsService;
  beforeEach(() => {
    const wired = wire();
    app = wired.app;
    identity = wired.identity;
    social = wired.social;
  });

  it("adding to contacts needs no consent and reveals no PII", async () => {
    await identity.updateMyContactFields({ userId: OWNER, phone: "+48-secret" });
    // VIEWER adds OWNER with no request/accept step at all.
    const added = await social.addAddressBookContact({
      ownerId: VIEWER,
      contactId: OWNER,
    });
    expect(added.ok).toBe(true);
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.isAddressBookContact).toBe(true);
    expect(view.value.isMutualFriend).toBe(false);
    expect(view.value.contactRequestStatus).toBe("none");
    expect(view.value.visibleContactFields).toEqual({});
  });

  it("adding as specialist needs no consent and reveals no PII", async () => {
    await identity.updateMyContactFields({
      userId: OWNER,
      emailContact: "owner@example.com",
    });
    const added = await social.addSpecialist({
      ownerId: VIEWER,
      specialistId: OWNER,
    });
    expect(added.ok).toBe(true);
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.isSpecialist).toBe(true);
    expect(view.value.isMutualFriend).toBe(false);
    expect(view.value.visibleContactFields).toEqual({});
  });

  it("friendship requires mutual consent — a sent request is not yet a friend", async () => {
    const fr = await social.sendFriendRequest({
      requesterUserId: VIEWER,
      receiverUserId: OWNER,
    });
    if (!fr.ok) throw new Error("setup failed");
    const beforeAccept = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!beforeAccept.ok) throw new Error("view failed");
    expect(beforeAccept.value.isMutualFriend).toBe(false);
    expect(beforeAccept.value.friendRequestStatus).toBe("pending");

    await social.respondToFriendRequest({
      requestId: fr.value.id,
      responderUserId: OWNER,
      action: "accepted",
    });
    const afterAccept = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!afterAccept.ok) throw new Error("view failed");
    expect(afterAccept.value.isMutualFriend).toBe(true);
  });

  it("a person can be specialist AND contact AND friend at once", async () => {
    await social.addAddressBookContact({ ownerId: VIEWER, contactId: OWNER });
    await social.addSpecialist({ ownerId: VIEWER, specialistId: OWNER });
    const fr = await social.sendFriendRequest({
      requesterUserId: VIEWER,
      receiverUserId: OWNER,
    });
    if (!fr.ok) throw new Error("setup failed");
    await social.respondToFriendRequest({
      requestId: fr.value.id,
      responderUserId: OWNER,
      action: "accepted",
    });
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.isAddressBookContact).toBe(true);
    expect(view.value.isSpecialist).toBe(true);
    expect(view.value.isMutualFriend).toBe(true);
  });

  it("friendCircle is owner-local: it changes no global relation and reveals no PII", async () => {
    await identity.updateMyContactFields({ userId: OWNER, phone: "+48-secret" });
    const res = await app.updateOwnerLocalContactGroup({
      ownerId: VIEWER,
      personId: OWNER,
      circle: "close_family",
    });
    expect(res.ok).toBe(true);
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.friendCircle).toBe("close_family");
    // global relation untouched, no PII leaked by the label
    expect(view.value.isMutualFriend).toBe(false);
    expect(view.value.friendRequestStatus).toBe("none");
    expect(view.value.visibleContactFields).toEqual({});
    // and the labelled owner does not see VIEWER in any circle
    const tab = await app.getContactsTabData(OWNER);
    if (!tab.ok) throw new Error("tab failed");
    expect(tab.value.circles.length).toBe(0);
  });
});

describe("contacts application service / dashboard + owner-local passthroughs", () => {
  let app: ContactsApplicationService;
  let identity: ContactAccessService;
  beforeEach(() => {
    const wired = wire();
    app = wired.app;
    identity = wired.identity;
  });

  it("getContactsDashboard counts owner-local lists (counts only, no PII)", async () => {
    await app.addToContacts(OWNER, VIEWER);
    await app.addAsSpecialist(OWNER, toUserId("u-spec"));
    await app.updateOwnerLocalContactGroup({ ownerId: OWNER, personId: VIEWER, circle: "close_family" });
    await identity.sendContactRequest({ fromUserId: VIEWER, toUserId: OWNER, message: "hej" });

    const res = await app.getContactsDashboard(OWNER);
    if (!res.ok) throw new Error("dashboard failed");
    expect(res.value.contacts).toBe(1);
    expect(res.value.specialists).toBe(1);
    expect(res.value.closeFamily).toBe(1);
    expect(res.value.friends).toBe(0);
    expect(res.value.pendingContactRequests).toBe(1);
    // counts only — the DTO has no field that could carry PII
    expect(Object.values(res.value).every((v) => typeof v === "number")).toBe(true);
  });

  it("addToContacts / addAsSpecialist need no consent and expose no PII", async () => {
    await identity.updateMyContactFields({ userId: OWNER, phone: "+48-secret" });
    const c = await app.addToContacts(VIEWER, OWNER);
    const s = await app.addAsSpecialist(VIEWER, OWNER);
    expect(c.ok).toBe(true);
    expect(s.ok).toBe(true);
    const view = await app.getProfileContactRelationship(OWNER, VIEWER);
    if (!view.ok) throw new Error("view failed");
    expect(view.value.isAddressBookContact).toBe(true);
    expect(view.value.isSpecialist).toBe(true);
    expect(view.value.isMutualFriend).toBe(false);
    expect(view.value.visibleContactFields).toEqual({});
  });
});
