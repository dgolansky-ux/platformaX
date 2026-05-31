import type {
  BlockUserInput,
  CancelFriendRequestInput,
  RelationshipStateDTO,
  RespondFriendRequestInput,
  SocialRelationshipResult,
  UnblockUserInput,
} from "./dto";
import type {
  BlockedUserDTO,
  FriendDTO,
  FriendRequestDTO,
  FriendsListDTO,
  SendFriendRequestInput,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

export interface SocialRelationshipServiceContract {
  sendFriendRequest(
    input: SendFriendRequestInput,
  ): Promise<SocialRelationshipResult<FriendRequestDTO>>;
  cancelFriendRequest(
    input: CancelFriendRequestInput,
  ): Promise<SocialRelationshipResult<FriendRequestDTO>>;
  acceptFriendRequest(
    input: RespondFriendRequestInput,
  ): Promise<SocialRelationshipResult<FriendRequestDTO>>;
  rejectFriendRequest(
    input: RespondFriendRequestInput,
  ): Promise<SocialRelationshipResult<FriendRequestDTO>>;
  removeFriend(
    actorUserId: UserId,
    otherUserId: UserId,
  ): Promise<SocialRelationshipResult<FriendDTO>>;
  blockUser(
    input: BlockUserInput,
  ): Promise<SocialRelationshipResult<BlockedUserDTO>>;
  unblockUser(
    input: UnblockUserInput,
  ): Promise<SocialRelationshipResult<BlockedUserDTO>>;
  getRelationshipState(
    viewerUserId: UserId,
    otherUserId: UserId,
  ): Promise<RelationshipStateDTO>;
  listFriends(ownerUserId: UserId): Promise<FriendsListDTO>;
  listPendingSentRequests(ownerUserId: UserId): Promise<FriendRequestDTO[]>;
  listPendingReceivedRequests(ownerUserId: UserId): Promise<FriendRequestDTO[]>;
  areFriends(a: UserId, b: UserId): Promise<boolean>;
  getFriendIdsForViewer(viewerUserId: UserId): Promise<readonly UserId[]>;
  listBlockedUsers(blockerUserId: UserId): Promise<BlockedUserDTO[]>;
}
