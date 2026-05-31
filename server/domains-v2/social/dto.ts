/**
 * server/domains-v2/social/dto — Public DTO surface for friendship +
 * relationship state.
 *
 * privacy classification: Public.
 *
 * All exported types are public-safe re-exports of the canonical
 * `@shared/contracts/contacts` types: they carry only user IDs, relationship
 * status enums, and ISO timestamps. No PII (phone, emailContact, address,
 * dateOfBirth) crosses this boundary — those live in the identity domain's
 * owner-only contact-fields surface, gated by EXC-004.
 */
import type {
  BlockedUserDTO,
  FriendDTO,
  FriendRequestDTO,
  FriendsListDTO,
  RelationshipStateDTO,
  SendFriendRequestInput,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { FriendshipStatus } from "./repository";

export type {
  RelationshipStateDTO,
  FriendDTO,
  FriendRequestDTO,
  FriendsListDTO,
  BlockedUserDTO,
  SendFriendRequestInput,
};

export type RespondFriendRequestInput = {
  requestId: string;
  responderUserId: UserId;
  action: "accepted" | "rejected";
};

export type CancelFriendRequestInput = {
  requestId: string;
  requesterUserId: UserId;
};

export type RemoveFriendInput = {
  actorUserId: UserId;
  otherUserId: UserId;
};

export type BlockUserInput = {
  blockerUserId: UserId;
  blockedUserId: UserId;
  reason?: string;
};

export type UnblockUserInput = {
  blockerUserId: UserId;
  blockedUserId: UserId;
};

export type SocialRelationshipErrorCode =
  | "SELF_RELATION_NOT_ALLOWED"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_PENDING"
  | "NOT_REQUESTER"
  | "NOT_RECIPIENT"
  | "DUPLICATE_PENDING_REQUEST"
  | "ALREADY_FRIENDS"
  | "BLOCKED_RELATIONSHIP";

export type SocialRelationshipError = {
  code: SocialRelationshipErrorCode;
  message: string;
};

export type SocialRelationshipResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SocialRelationshipError };

export type RelationshipSnapshot = {
  state: RelationshipStateDTO["state"];
  latestStatus: FriendshipStatus | "none";
  pendingRequestId: string | null;
};
