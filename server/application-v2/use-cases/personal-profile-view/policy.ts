/**
 * application-v2/use-cases/personal-profile-view — pure viewer-state policy.
 *
 * Computes the viewer's relation to the profile owner and translates it into
 * the per-section permission flags (canViewProfessionalLayer etc.). No IO,
 * no time source.
 */
import type {
  ProfileFriendFeedAvailabilityReason,
  ProfileViewerRelation,
  ProfileViewerStateDTO,
  ProfileVisibleContactFieldDTO,
} from "@shared/contracts/personal-profile-view";
import type {
  ContactProfileRelationshipDTO,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";

export interface RelationInputs {
  viewerUserId: string | null;
  profileOwnerUserId: string;
  profileVisibility: "public" | "friends" | "private";
  relationship: ContactProfileRelationshipDTO;
}

export function decideViewerRelation(input: RelationInputs): ProfileViewerRelation {
  const { viewerUserId, profileOwnerUserId, relationship } = input;
  if (viewerUserId === null) return "unauthenticated";
  if (viewerUserId === profileOwnerUserId) return "owner";
  if (relationship.isMutualFriend) return "friend";
  if (relationship.friendRequestStatus === "pending") {
    const pendingOutgoing =
      relationship.availableActions.includes("RESPOND_TO_FRIEND_REQUEST") === false;
    return pendingOutgoing ? "pending_friend_request_sent" : "pending_friend_request_received";
  }
  if (relationship.contactRequestStatus === "accepted") return "contact_approved";
  return "stranger";
}

export function deriveViewerState(
  relation: ProfileViewerRelation,
  input: RelationInputs,
): ProfileViewerStateDTO {
  const isOwner = relation === "owner";
  const isAuthenticated = input.viewerUserId !== null;
  const isFriend = relation === "friend";
  const isContactApproved = relation === "contact_approved";
  const isPublic = input.profileVisibility === "public";
  const isPrivate = input.profileVisibility === "private";

  const visibleContactCount = Object.keys(input.relationship.visibleContactFields).length;
  const canViewPublicProfile = isOwner || isAuthenticated || isPublic;

  const canViewProfessionalLayer = isOwner || isPublic || isFriend || isContactApproved;
  const canViewWorkplaces = isOwner || !isPrivate;
  const canViewPublicHub = isOwner || isPublic || isFriend;
  const canViewModules = canViewPublicHub;
  const canViewFriendFeedPreview = isOwner || isFriend;
  const canOpenChannels = isOwner || isPublic || isFriend || isContactApproved;
  const canOpenWorkplaces = canViewWorkplaces;
  const canViewContactFields = visibleContactCount > 0;

  return {
    viewerUserId: input.viewerUserId,
    profileOwnerUserId: input.profileOwnerUserId,
    relation,
    canEditProfile: isOwner,
    canViewPublicProfile,
    canViewProfessionalLayer,
    canViewWorkplaces,
    canViewPublicHub,
    canViewModules,
    canViewFriendFeedPreview,
    canViewContactFields,
    canSendFriendRequest: !isOwner && isAuthenticated && relation === "stranger",
    canAcceptFriendRequest:
      !isOwner && isAuthenticated && relation === "pending_friend_request_received",
    canRequestContactAccess:
      !isOwner && isAuthenticated && input.relationship.contactRequestStatus === "none",
    canOpenChannels,
    canOpenWorkplaces,
  };
}

export function friendFeedAvailability(
  relation: ProfileViewerRelation,
): { canView: boolean; reason: ProfileFriendFeedAvailabilityReason; targetRoute: string } {
  if (relation === "owner") return { canView: true, reason: "owner", targetRoute: "/friends-feed" };
  if (relation === "friend") return { canView: true, reason: "friend", targetRoute: "/friends-feed" };
  if (relation === "unauthenticated") {
    return { canView: false, reason: "anonymous", targetRoute: "/login" };
  }
  return { canView: false, reason: "stranger", targetRoute: "/friends-feed" };
}

export function projectVisibleContactFields(
  visible: VisibleContactFieldsDTO,
): readonly ProfileVisibleContactFieldDTO[] {
  const out: ProfileVisibleContactFieldDTO[] = [];
  for (const [field, value] of Object.entries(visible.fields)) {
    if (typeof value === "string" && value.length > 0) {
      out.push({
        field: field as ProfileVisibleContactFieldDTO["field"],
        value,
      });
    }
  }
  return out;
}

export function hiddenFieldsReason(
  relation: ProfileViewerRelation,
  visibleCount: number,
): "owner" | "friend_policy" | "stranger" | "anonymous" | "none" {
  if (visibleCount > 0) return "none";
  if (relation === "owner") return "owner";
  if (relation === "friend") return "friend_policy";
  if (relation === "unauthenticated") return "anonymous";
  return "stranger";
}
