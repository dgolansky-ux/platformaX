// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

import type { UserId } from "@shared/contracts/branded-ids";
import type {
  FriendDTO,
  FriendRequestDTO,
  RelationshipStateDTO,
} from "@shared/contracts/contacts";
import type { SocialRelationshipService } from "@server/domains-v2/social/public-api";

export type ProfileRelationshipActionsDTO = {
  relationship: RelationshipStateDTO["state"];
  canSendFriendRequest: boolean;
  canCancelFriendRequest: boolean;
  canAcceptFriendRequest: boolean;
  canRejectFriendRequest: boolean;
  canRemoveFriend: boolean;
  canBlockUser: boolean;
};

export type FriendsPageViewDTO = {
  ownerUserId: UserId;
  friends: readonly FriendDTO[];
  pendingSent: readonly FriendRequestDTO[];
  pendingReceived: readonly FriendRequestDTO[];
};

export type SocialUseCasesDeps = {
  social: SocialRelationshipService;
};

export interface SocialUseCasesService {
  getProfileRelationshipActions(
    viewerUserId: UserId,
    profileOwnerUserId: UserId,
  ): Promise<ProfileRelationshipActionsDTO>;
  sendFriendRequestFromProfile(input: {
    viewerUserId: UserId;
    profileOwnerUserId: UserId;
  }): ReturnType<SocialRelationshipService["sendFriendRequest"]>;
  acceptFriendRequestFromProfile(input: {
    viewerUserId: UserId;
    requestId: string;
  }): ReturnType<SocialRelationshipService["acceptFriendRequest"]>;
  rejectFriendRequestFromProfile(input: {
    viewerUserId: UserId;
    requestId: string;
  }): ReturnType<SocialRelationshipService["rejectFriendRequest"]>;
  removeFriendFromProfile(input: {
    viewerUserId: UserId;
    profileOwnerUserId: UserId;
  }): ReturnType<SocialRelationshipService["removeFriend"]>;
  blockUserFromProfile(input: {
    viewerUserId: UserId;
    profileOwnerUserId: UserId;
    reason?: string;
  }): ReturnType<SocialRelationshipService["blockUser"]>;
  getFriendsPageView(viewerUserId: UserId): Promise<FriendsPageViewDTO>;
}

export function createSocialUseCasesService(
  deps: SocialUseCasesDeps,
): SocialUseCasesService {
  return {
    async getProfileRelationshipActions(viewerUserId, profileOwnerUserId) {
      const rel = await deps.social.getRelationshipState(
        viewerUserId,
        profileOwnerUserId,
      );
      const relationship = rel.state;
      return {
        relationship,
        canSendFriendRequest: relationship === "stranger",
        canCancelFriendRequest: relationship === "pending_sent",
        canAcceptFriendRequest: relationship === "pending_received",
        canRejectFriendRequest: relationship === "pending_received",
        canRemoveFriend: relationship === "friends",
        canBlockUser:
          relationship !== "owner" && relationship !== "blocked_by_viewer",
      };
    },

    sendFriendRequestFromProfile({ viewerUserId, profileOwnerUserId }) {
      return deps.social.sendFriendRequest({
        requesterUserId: viewerUserId,
        recipientUserId: profileOwnerUserId,
      });
    },

    acceptFriendRequestFromProfile({ viewerUserId, requestId }) {
      return deps.social.acceptFriendRequest({
        requestId,
        responderUserId: viewerUserId,
        action: "accepted",
      });
    },

    rejectFriendRequestFromProfile({ viewerUserId, requestId }) {
      return deps.social.rejectFriendRequest({
        requestId,
        responderUserId: viewerUserId,
        action: "rejected",
      });
    },

    removeFriendFromProfile({ viewerUserId, profileOwnerUserId }) {
      return deps.social.removeFriend(viewerUserId, profileOwnerUserId);
    },

    blockUserFromProfile({ viewerUserId, profileOwnerUserId, reason }) {
      return deps.social.blockUser({
        blockerUserId: viewerUserId,
        blockedUserId: profileOwnerUserId,
        reason,
      });
    },

    async getFriendsPageView(viewerUserId) {
      const [friendsList, pendingSent, pendingReceived] = await Promise.all([
        deps.social.listFriends(viewerUserId),
        deps.social.listPendingSentRequests(viewerUserId),
        deps.social.listPendingReceivedRequests(viewerUserId),
      ]);
      return {
        ownerUserId: viewerUserId,
        friends: friendsList.items,
        pendingSent,
        pendingReceived,
      };
    },
  };
}
