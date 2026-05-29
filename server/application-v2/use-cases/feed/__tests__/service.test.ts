import { describe, expect, it } from "vitest";
import { createFriendFeedUseCase } from "../public-api";
import {
  createInMemoryFriendshipRepository,
  createSocialContactsService,
  createInMemoryFriendRequestRepository,
  createInMemoryAddressBookRepository,
  createInMemorySpecialistRepository,
  createInMemoryContactGroupRepository,
} from "@server/domains-v2/social/public-api";
import {
  createContentService,
  createInMemoryPostRepository,
} from "@server/domains-v2/content-v2/public-api";

const VIEWER = "u-viewer";
const FRIEND = "u-friend";
const STRANGER = "u-stranger";

function makeContent() {
  let seq = 0;
  return createContentService({
    posts: createInMemoryPostRepository(),
    clock: { now: () => new Date(`2026-05-29T00:00:0${seq % 10}Z`) },
    ids: { next: () => `p-${++seq}` },
  });
}

function makeSocial() {
  let seq = 0;
  return createSocialContactsService({
    friends: createInMemoryFriendshipRepository(),
    friendRequests: createInMemoryFriendRequestRepository(),
    addressBook: createInMemoryAddressBookRepository(),
    specialists: createInMemorySpecialistRepository(),
    groups: createInMemoryContactGroupRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `s-${++seq}` },
  });
}

describe("feed use-case — getFriendFeedFoundation", () => {
  it("returns only posts authored by the viewer's friends (no global feed)", async () => {
    const social = makeSocial();
    const content = makeContent();
    // Establish friendship VIEWER <-> FRIEND via an accepted request.
    const req = await social.sendFriendRequest({ requesterUserId: FRIEND, receiverUserId: VIEWER });
    if (!req.ok) throw new Error("setup req");
    const acc = await social.respondToFriendRequest({ requestId: req.value.id, responderUserId: VIEWER, action: "accepted" });
    if (!acc.ok) throw new Error("setup accept");

    await content.createPost({ authorUserId: FRIEND, contextType: "friend_post", contextId: FRIEND, body: "hi", visibility: "friends" });
    await content.createPost({ authorUserId: STRANGER, contextType: "friend_post", contextId: STRANGER, body: "spam", visibility: "friends" });

    const usecase = createFriendFeedUseCase({ social, content });
    const feed = await usecase.getFriendFeedFoundation({ viewerUserId: VIEWER });
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].authorUserId).toBe(FRIEND);
  });

  it("returns an empty feed when the viewer has no friends", async () => {
    const social = makeSocial();
    const content = makeContent();
    await content.createPost({ authorUserId: STRANGER, contextType: "friend_post", contextId: STRANGER, body: "hi", visibility: "friends" });
    const usecase = createFriendFeedUseCase({ social, content });
    const feed = await usecase.getFriendFeedFoundation({ viewerUserId: VIEWER });
    expect(feed.items).toHaveLength(0);
    expect(feed.nextCursor).toBeNull();
  });
});
