import { describe, expect, it } from "vitest";
import { toUserId } from "@shared/contracts/branded-ids";
import { createSocialRelationshipService } from "@server/domains-v2/social/public-api";
import { createSocialUseCasesService } from "../service";

const ALICE = toUserId("u-alice");
const BOB = toUserId("u-bob");
const CAROL = toUserId("u-carol");

function makeStack() {
  let seq = 0;
  const social = createSocialRelationshipService({
    createId: () => `soc-${++seq}`,
    clock: () => new Date("2026-05-30T12:00:00.000Z"),
  });
  return createSocialUseCasesService({ social });
}

describe("application-v2/use-cases/social", () => {
  it("profile relationship actions follow relationship state", async () => {
    const app = makeStack();
    const stranger = await app.getProfileRelationshipActions(ALICE, BOB);
    expect(stranger.relationship).toBe("stranger");
    expect(stranger.canSendFriendRequest).toBe(true);

    const sent = await app.sendFriendRequestFromProfile({
      viewerUserId: ALICE,
      profileOwnerUserId: BOB,
    });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const pendingSent = await app.getProfileRelationshipActions(ALICE, BOB);
    const pendingReceived = await app.getProfileRelationshipActions(BOB, ALICE);
    expect(pendingSent.relationship).toBe("pending_sent");
    expect(pendingReceived.relationship).toBe("pending_received");
    expect(pendingReceived.canAcceptFriendRequest).toBe(true);
  });

  it("friends page view returns accepted and pending lists", async () => {
    const app = makeStack();
    const sent = await app.sendFriendRequestFromProfile({
      viewerUserId: ALICE,
      profileOwnerUserId: BOB,
    });
    if (!sent.ok) throw new Error("setup failed");
    await app.acceptFriendRequestFromProfile({
      viewerUserId: BOB,
      requestId: sent.value.id,
    });
    await app.sendFriendRequestFromProfile({
      viewerUserId: ALICE,
      profileOwnerUserId: CAROL,
    });

    const view = await app.getFriendsPageView(ALICE);
    expect(view.friends.map((f) => f.friendId)).toEqual([BOB]);
    expect(view.pendingSent).toHaveLength(1);
    expect(view.pendingReceived).toHaveLength(0);
  });

  it("block action transitions relationship to blocked", async () => {
    const app = makeStack();
    const blocked = await app.blockUserFromProfile({
      viewerUserId: ALICE,
      profileOwnerUserId: BOB,
      reason: "safety",
    });
    expect(blocked.ok).toBe(true);
    const rel = await app.getProfileRelationshipActions(ALICE, BOB);
    expect(rel.relationship).toBe("blocked_by_viewer");
    expect(rel.canSendFriendRequest).toBe(false);
  });
});
