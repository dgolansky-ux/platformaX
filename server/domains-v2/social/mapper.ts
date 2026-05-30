import type {
  BlockedUserDTO,
  FriendDTO,
  FriendRequestDTO,
  FriendRequestStatus,
  RelationshipStateDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { BlockedUserRecord, FriendshipRecord } from "./repository";

export function toFriendDTO(
  ownerUserId: UserId,
  record: FriendshipRecord,
): FriendDTO {
  const friendId =
    record.requesterUserId === ownerUserId
      ? record.recipientUserId
      : record.requesterUserId;
  return {
    ownerId: ownerUserId,
    friendId,
    acceptedAt: record.respondedAt ?? record.updatedAt,
  };
}

export function toFriendRequestDTO(record: FriendshipRecord): FriendRequestDTO {
  const status: FriendRequestStatus =
    record.status === "pending" ||
    record.status === "accepted" ||
    record.status === "rejected" ||
    record.status === "cancelled"
      ? record.status
      : "cancelled";
  return {
    id: record.id,
    requesterUserId: record.requesterUserId,
    recipientUserId: record.recipientUserId,
    status,
    createdAt: record.createdAt,
    respondedAt: record.respondedAt,
    updatedAt: record.updatedAt,
  };
}

export function toBlockedUserDTO(record: BlockedUserRecord): BlockedUserDTO {
  return {
    id: record.id,
    blockerUserId: record.blockerUserId,
    blockedUserId: record.blockedUserId,
    reason: record.reason,
    createdAt: record.createdAt,
    revokedAt: record.revokedAt,
  };
}

export function relationshipState(
  viewerUserId: UserId,
  otherUserId: UserId,
  state: RelationshipStateDTO["state"],
): RelationshipStateDTO {
  return { viewerUserId, otherUserId, state };
}
