import type {
  ContactRequestsPageView,
  ContactRequestCardModel,
  FriendCardModel,
  FriendRequestsPageView,
  FriendsPageView,
  SocialPerson,
} from "./types";

const PEOPLE: Record<string, SocialPerson> = {
  "u-owner": {
    userId: "u-owner",
    displayName: "Anna Kowalska",
    username: "anna",
    avatarInitial: "A",
  },
  "u-f1": {
    userId: "u-f1",
    displayName: "Bartek Nowak",
    username: "bartek",
    avatarInitial: "B",
  },
  "u-f2": {
    userId: "u-f2",
    displayName: "Celina Wójcik",
    username: "celina",
    avatarInitial: "C",
  },
  "u-f3": {
    userId: "u-f3",
    displayName: "Damian Lis",
    username: "damian",
    avatarInitial: "D",
  },
};

const FRIENDS: FriendCardModel[] = [
  { person: PEOPLE["u-f1"], relationship: "friend" },
  { person: PEOPLE["u-f2"], relationship: "friend" },
];

const PENDING_SENT: FriendCardModel[] = [
  { person: PEOPLE["u-f3"], relationship: "pending_sent" },
];

const PENDING_RECEIVED: FriendCardModel[] = [
  { person: PEOPLE["u-owner"], relationship: "pending_received" },
];

const CONTACT_REQUESTS: ContactRequestCardModel[] = [
  {
    id: "cr-1",
    requester: PEOPLE["u-f3"],
    ownerUserId: "u-owner",
    status: "pending",
    requestedFields: ["email", "phone", "website"],
    approvedFields: [],
    message: "Poproszę o kontakt zawodowy.",
  },
];

export const socialFriendsMockAdapter = {
  async getFriendsPageView(): Promise<FriendsPageView> {
    return { friends: FRIENDS };
  },
  async getFriendRequestsPageView(): Promise<FriendRequestsPageView> {
    return { pendingSent: PENDING_SENT, pendingReceived: PENDING_RECEIVED };
  },
  async getContactRequestsPageView(): Promise<ContactRequestsPageView> {
    return { requests: CONTACT_REQUESTS };
  },
};
