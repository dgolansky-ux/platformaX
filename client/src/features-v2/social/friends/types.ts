export type SocialPerson = {
  userId: string;
  displayName: string;
  username: string;
  avatarInitial: string;
};

export type RelationshipBadge =
  | "friend"
  | "pending_sent"
  | "pending_received"
  | "blocked";

export type FriendCardModel = {
  person: SocialPerson;
  relationship: RelationshipBadge;
};

export type ContactAccessField =
  | "email"
  | "phone"
  | "website"
  | "otherContactMethods";

export type ContactRequestCardModel = {
  id: string;
  requester: SocialPerson;
  ownerUserId: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  requestedFields: readonly ContactAccessField[];
  approvedFields: readonly ContactAccessField[];
  message?: string;
};

export type FriendsPageView = {
  friends: readonly FriendCardModel[];
};

export type FriendRequestsPageView = {
  pendingSent: readonly FriendCardModel[];
  pendingReceived: readonly FriendCardModel[];
};

export type ContactRequestsPageView = {
  requests: readonly ContactRequestCardModel[];
};
