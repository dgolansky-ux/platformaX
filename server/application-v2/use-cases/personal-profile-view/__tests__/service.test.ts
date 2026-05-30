import { beforeEach, describe, expect, it } from "vitest";
import { toUserId } from "@shared/contracts/branded-ids";
import {
  createContactAccessService,
  createIdentityService,
  createInMemoryContactFieldsRepository,
  createInMemoryContactPermissionsRepository,
  createInMemoryContactRequestsRepository,
  type ContactAccessService,
  type IdentityProfileRepository,
  type IdentityService,
} from "@server/domains-v2/identity/public-api";
import { createInMemoryIdentityProfileRepository } from "@server/domains-v2/identity/repository";
import {
  createInMemoryAddressBookRepository,
  createInMemoryContactGroupRepository,
  createInMemoryFriendRequestRepository,
  createInMemoryFriendshipRepository,
  createInMemorySpecialistRepository,
  createSocialContactsService,
  type SocialContactsService,
} from "@server/domains-v2/social/public-api";
import { makeRelationshipSignalResolver } from "@server/application-v2/use-cases/contacts/public-api";
import {
  createPersonalProfileViewService,
  createProfilePageActions,
  type PersonalProfileViewService,
} from "../public-api";

const OWNER_ID = "user-owner";
const FRIEND_ID = "user-friend";
const STRANGER_ID = "user-stranger";
const OWNER_USERNAME = "owner-slug";

interface Stack {
  view: PersonalProfileViewService;
  actions: ReturnType<typeof createProfilePageActions>;
  identity: IdentityService;
  identityRepository: IdentityProfileRepository;
  contactAccess: ContactAccessService;
  social: SocialContactsService;
}

async function wire(): Promise<Stack> {
  const identityRepository = createInMemoryIdentityProfileRepository();
  const identity = createIdentityService({
    repository: identityRepository,
    clock: () => "2026-05-30T08:00:00.000Z",
  });

  const social = createSocialContactsService({
    friends: createInMemoryFriendshipRepository(),
    friendRequests: createInMemoryFriendRequestRepository(),
    addressBook: createInMemoryAddressBookRepository(),
    specialists: createInMemorySpecialistRepository(),
    groups: createInMemoryContactGroupRepository(),
    clock: { now: () => new Date("2026-05-30T08:00:00Z") },
    ids: (() => {
      let n = 0;
      return { next: () => `fr-${++n}` };
    })(),
  });

  let identitySeq = 0;
  const identityCAdeps = {
    fields: createInMemoryContactFieldsRepository(),
    permissions: createInMemoryContactPermissionsRepository(),
    requests: createInMemoryContactRequestsRepository(),
    clock: { now: () => new Date("2026-05-30T08:00:00Z") },
    ids: { next: () => `req-${++identitySeq}` },
  };

  const identityStub = createContactAccessService({
    ...identityCAdeps,
    friendship: {
      async resolve() {
        return { isFriend: false, acceptedContactRequest: null };
      },
    },
  });
  const resolver = makeRelationshipSignalResolver(social, identityStub);
  const contactAccess = createContactAccessService({
    ...identityCAdeps,
    friendship: resolver,
  });

  await identity.completeOnboarding(OWNER_ID, {
    firstName: "Anna",
    lastName: "Kowalska",
    dateOfBirth: "1990-03-15",
    phone: "+48600000000",
  });
  await identity.updatePrivateProfile(OWNER_ID, {
    profileSlug: OWNER_USERNAME,
    bio: "Krótka informacja o Annie.",
    location: "Warszawa",
  });
  await contactAccess.updateMyContactFields({
    userId: toUserId(OWNER_ID),
    phone: "+48600000111",
    emailContact: "anna@example.com",
    instagram: "@anna.k",
  });
  await contactAccess.updateMyContactPermissions({
    userId: toUserId(OWNER_ID),
    patch: { instagram: { friends: true, approved: true } },
  });

  const view = createPersonalProfileViewService({
    identity,
    identityRepository,
    contactAccess,
    social,
  });
  const actions = createProfilePageActions({ social, contactAccess });
  return { view, actions, identity, identityRepository, contactAccess, social };
}

describe("personal-profile-view application service", () => {
  let stack: Stack;

  beforeEach(async () => {
    stack = await wire();
  });

  it("owner mode: full view, can edit, no relation CTA", async () => {
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: OWNER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("owner");
    expect(res.value.viewerState.canEditProfile).toBe(true);
    expect(res.value.ownerActions.canEditAvatar).toBe(true);
    expect(res.value.ownerActions.canAddWorkplace).toBe(true);
    expect(res.value.relationActions.canSendFriendRequest).toBe(false);
    expect(res.value.relationActions.canAcceptFriendRequest).toBe(false);
    expect(res.value.friendFeedPreview.canView).toBe(true);
    expect(res.value.friendFeedPreview.reason).toBe("owner");
  });

  it("stranger mode: no owner controls, can send friend request, no PII", async () => {
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("stranger");
    expect(res.value.viewerState.canEditProfile).toBe(false);
    expect(res.value.ownerActions.canEditAvatar).toBe(false);
    expect(res.value.relationActions.canSendFriendRequest).toBe(true);
    expect(res.value.relationActions.canRequestContactAccess).toBe(true);
    expect(res.value.contactPanel.visibleFields).toHaveLength(0);
    expect(res.value.contactPanel.hiddenFieldsReason).toBe("stranger");
    expect(res.value.friendFeedPreview.canView).toBe(false);
    expect(res.value.friendFeedPreview.reason).toBe("stranger");
  });

  it("unauthenticated viewer: no actions, anonymous contact reason", async () => {
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: null,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("unauthenticated");
    expect(res.value.relationActions.canSendFriendRequest).toBe(false);
    expect(res.value.relationActions.canRequestContactAccess).toBe(false);
    expect(res.value.contactPanel.hiddenFieldsReason).toBe("anonymous");
  });

  it("friend mode: friend-only fields surface when permission is on", async () => {
    await stack.social.sendFriendRequest({
      requesterUserId: toUserId(FRIEND_ID),
      receiverUserId: toUserId(OWNER_ID),
    });
    const incoming = await stack.social.listIncomingFriendRequests(toUserId(OWNER_ID));
    expect(incoming).toHaveLength(1);
    const ack = await stack.social.respondToFriendRequest({
      requestId: incoming[0].id,
      responderUserId: toUserId(OWNER_ID),
      action: "accepted",
    });
    expect(ack.ok).toBe(true);

    const res = await stack.view.getPersonalProfileView({
      viewerUserId: FRIEND_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("friend");
    expect(res.value.viewerState.canViewFriendFeedPreview).toBe(true);
    expect(res.value.friendFeedPreview.reason).toBe("friend");
    const instagram = res.value.contactPanel.visibleFields.find((f) => f.field === "instagram");
    expect(instagram?.value).toBe("@anna.k");
    const phone = res.value.contactPanel.visibleFields.find((f) => f.field === "phone");
    expect(phone).toBeUndefined();
  });

  it("contact_approved mode: only approved fields visible (double gate)", async () => {
    const send = await stack.contactAccess.sendContactRequest({
      fromUserId: toUserId(STRANGER_ID),
      toUserId: toUserId(OWNER_ID),
      message: "Cześć!",
    });
    expect(send.ok).toBe(true);
    if (!send.ok) return;
    await stack.contactAccess.updateMyContactPermissions({
      userId: toUserId(OWNER_ID),
      patch: { emailContact: { friends: false, approved: true } },
    });
    const ack = await stack.contactAccess.respondToContactRequest({
      requestId: send.value.id,
      responderUserId: toUserId(OWNER_ID),
      action: "accepted",
      approvedFields: ["emailContact"],
    });
    expect(ack.ok).toBe(true);

    const res = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("contact_approved");
    const email = res.value.contactPanel.visibleFields.find((f) => f.field === "emailContact");
    expect(email?.value).toBe("anna@example.com");
    const phone = res.value.contactPanel.visibleFields.find((f) => f.field === "phone");
    expect(phone).toBeUndefined();
  });

  it("pending_friend_request_sent: stranger who already sent waits", async () => {
    await stack.social.sendFriendRequest({
      requesterUserId: toUserId(STRANGER_ID),
      receiverUserId: toUserId(OWNER_ID),
    });
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.viewerState.relation).toBe("pending_friend_request_sent");
    expect(res.value.relationActions.canSendFriendRequest).toBe(false);
    expect(res.value.relationActions.canCancelFriendRequest).toBe(true);
    expect(res.value.relationActions.pendingFriendRequestId).not.toBeNull();
  });

  it("non-existent profile returns PROFILE_NOT_FOUND", async () => {
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: OWNER_ID,
      profileUsername: "no-such-slug",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("PROFILE_NOT_FOUND");
  });

  it("private profile is restricted to non-owner viewers", async () => {
    await stack.identity.updatePrivateProfile(OWNER_ID, { visibility: "private" });
    const stranger = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(stranger.ok).toBe(false);
    if (stranger.ok) return;
    expect(stranger.error.code).toBe("PROFILE_RESTRICTED");

    const owner = await stack.view.getPersonalProfileView({
      viewerUserId: OWNER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(owner.ok).toBe(true);
  });

  it("DTO never carries raw email/phone of owner to non-owner viewer", async () => {
    const res = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const json = JSON.stringify(res.value);
    expect(json).not.toContain("anna@example.com");
    expect(json).not.toContain("+48600000111");
  });

  it("action wrappers send and accept friend requests through social", async () => {
    const send = await stack.actions.sendFriendRequestFromProfile({
      viewerUserId: STRANGER_ID,
      profileOwnerUserId: OWNER_ID,
    });
    expect(send.ok).toBe(true);
    if (!send.ok) return;
    const accept = await stack.actions.acceptFriendRequestFromProfile({
      viewerUserId: OWNER_ID,
      pendingRequestId: send.value.id,
    });
    expect(accept.ok).toBe(true);
    const after = await stack.view.getPersonalProfileView({
      viewerUserId: STRANGER_ID,
      profileUsername: OWNER_USERNAME,
    });
    expect(after.ok).toBe(true);
    if (!after.ok) return;
    expect(after.value.viewerState.relation).toBe("friend");
  });
});
