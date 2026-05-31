import type { RelationshipStateDTO } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { FriendshipRecord } from "./repository";

export function isSelfRelation(a: UserId, b: UserId): boolean {
  return a === b;
}

export function isPendingBetween(
  rows: readonly FriendshipRecord[],
  requesterUserId: UserId,
  recipientUserId: UserId,
): boolean {
  return rows.some(
    (row) =>
      row.status === "pending" &&
      row.requesterUserId === requesterUserId &&
      row.recipientUserId === recipientUserId,
  );
}

export function hasAcceptedFriendship(
  rows: readonly FriendshipRecord[],
): boolean {
  return rows.some((row) => row.status === "accepted");
}

export function resolveRelationshipState(input: {
  viewerUserId: UserId;
  otherUserId: UserId;
  blockedByViewer: boolean;
  blockedByOther: boolean;
  hasAcceptedFriendship: boolean;
  hasPendingSent: boolean;
  hasPendingReceived: boolean;
}): RelationshipStateDTO["state"] {
  if (input.viewerUserId === input.otherUserId) return "owner";
  if (input.blockedByViewer) return "blocked_by_viewer";
  if (input.blockedByOther) return "blocked_by_other";
  if (input.hasAcceptedFriendship) return "friends";
  if (input.hasPendingSent) return "pending_sent";
  if (input.hasPendingReceived) return "pending_received";
  return "stranger";
}
