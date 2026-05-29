/**
 * social / contacts — pure policy.
 *
 * Mirrors the contact-access policy: blocks self-relations, blocks duplicate
 * pending friend requests, restricts respond-to-friend to the actual
 * receiver. Address-book and specialist entries do NOT need consent (they
 * are owner-side bookmarks) — the only check is "cannot add yourself".
 */
import type { UserId } from "@shared/contracts/branded-ids";
import type { FriendRequest } from "./social-contacts-dto";

export function isSelfRelation(a: UserId, b: UserId): boolean {
  return a === b;
}

export function canRespondToFriendRequest(
  request: Pick<FriendRequest, "receiverUserId" | "status">,
  responderUserId: UserId,
): boolean {
  return (
    request.status === "pending" && request.receiverUserId === responderUserId
  );
}

/**
 * One non-terminal friend request in a given direction at a time. After
 * accepted, the friendship row is the source of truth; further requests
 * are blocked. After rejected, only the original requester may try again.
 */
export function isDuplicatePendingFriendRequest(
  requesterUserId: UserId,
  receiverUserId: UserId,
  existing: Pick<
    FriendRequest,
    "requesterUserId" | "receiverUserId" | "status"
  >[],
): boolean {
  return existing.some(
    (r) =>
      r.requesterUserId === requesterUserId &&
      r.receiverUserId === receiverUserId &&
      (r.status === "pending" || r.status === "accepted"),
  );
}
