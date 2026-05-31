import { describe, expect, it } from "vitest";
import { toUserId } from "@shared/contracts/branded-ids";
import { createSocialRelationshipService } from "../service";

const ALICE = toUserId("u-alice");
const BOB = toUserId("u-bob");
const CAROL = toUserId("u-carol");

function makeService() {
  let seq = 0;
  return createSocialRelationshipService({
    clock: () => new Date("2026-05-30T10:00:00.000Z"),
    createId: () => `soc-${++seq}`,
  });
}

describe("social relationship service", () => {
  it("send + accept creates friendship and friend ids", async () => {
    const svc = makeService();
    const send = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: BOB,
    });
    expect(send.ok).toBe(true);
    if (!send.ok) return;

    const accept = await svc.acceptFriendRequest({
      requestId: send.value.id,
      responderUserId: BOB,
      action: "accepted",
    });
    expect(accept.ok).toBe(true);

    expect(await svc.areFriends(ALICE, BOB)).toBe(true);
    expect(await svc.getFriendIdsForViewer(ALICE)).toEqual([BOB]);
  });

  it("self request is denied", async () => {
    const svc = makeService();
    const res = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: ALICE,
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("SELF_RELATION_NOT_ALLOWED");
  });

  it("pending duplicate is denied in both directions", async () => {
    const svc = makeService();
    await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: BOB,
    });
    const sameDirection = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: BOB,
    });
    const reverseDirection = await svc.sendFriendRequest({
      requesterUserId: BOB,
      recipientUserId: ALICE,
    });
    expect(sameDirection.ok).toBe(false);
    expect(reverseDirection.ok).toBe(false);
  });

  it("cancel by requester moves request out of pending lists", async () => {
    const svc = makeService();
    const send = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: BOB,
    });
    if (!send.ok) throw new Error("setup failed");
    const cancel = await svc.cancelFriendRequest({
      requestId: send.value.id,
      requesterUserId: ALICE,
    });
    expect(cancel.ok).toBe(true);
    expect(await svc.listPendingSentRequests(ALICE)).toHaveLength(0);
    expect(await svc.listPendingReceivedRequests(BOB)).toHaveLength(0);
  });

  it("block prevents requests and friendship visibility", async () => {
    const svc = makeService();
    const send = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: BOB,
    });
    if (!send.ok) throw new Error("setup failed");
    await svc.acceptFriendRequest({
      requestId: send.value.id,
      responderUserId: BOB,
      action: "accepted",
    });
    const blocked = await svc.blockUser({
      blockerUserId: ALICE,
      blockedUserId: BOB,
      reason: "abuse",
    });
    expect(blocked.ok).toBe(true);
    expect(await svc.areFriends(ALICE, BOB)).toBe(false);
    const sendAgain = await svc.sendFriendRequest({
      requesterUserId: BOB,
      recipientUserId: ALICE,
    });
    expect(sendAgain.ok).toBe(false);
  });

  it("relationship state resolves pending/friends/blocked", async () => {
    const svc = makeService();
    const pending = await svc.sendFriendRequest({
      requesterUserId: ALICE,
      recipientUserId: CAROL,
    });
    if (!pending.ok) throw new Error("setup failed");
    expect((await svc.getRelationshipState(ALICE, CAROL)).state).toBe(
      "pending_sent",
    );
    expect((await svc.getRelationshipState(CAROL, ALICE)).state).toBe(
      "pending_received",
    );
    await svc.acceptFriendRequest({
      requestId: pending.value.id,
      responderUserId: CAROL,
      action: "accepted",
    });
    expect((await svc.getRelationshipState(ALICE, CAROL)).state).toBe("friends");
    await svc.blockUser({ blockerUserId: ALICE, blockedUserId: CAROL });
    expect((await svc.getRelationshipState(ALICE, CAROL)).state).toBe(
      "blocked_by_viewer",
    );
  });
});
