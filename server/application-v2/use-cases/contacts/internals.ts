/**
 * application-v2/use-cases/contacts — internal helpers split out of service.ts
 * to keep the orchestrator within the file-size budget. Pure composition over
 * the identity/social public-apis; no entities, no persistence.
 */
import type { ContactProfileAction } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ContactAccessService,
  RelationshipSignalResolver,
} from "@server/domains-v2/identity/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";

/** Internal action-set computation; UI-only enriched contactRequestStatus. */
export function actionsFor(rel: {
  isOwner: boolean;
  isFriend: boolean;
  isAddressBookContact: boolean;
  isSpecialist: boolean;
  contactRequestStatus:
    | "none"
    | "pending_sent"
    | "pending_received"
    | "accepted"
    | "rejected"
    | "revoked"
    | "cancelled";
  friendRequestStatus: "none" | "pending_sent" | "pending_received";
}): readonly ContactProfileAction[] {
  if (rel.isOwner) return [];
  const out: ContactProfileAction[] = [];

  if (rel.isFriend) out.push("REMOVE_FRIEND");
  else if (rel.friendRequestStatus === "pending_received") out.push("RESPOND_TO_FRIEND_REQUEST");
  else if (rel.friendRequestStatus === "none") out.push("SEND_FRIEND_REQUEST");

  if (rel.contactRequestStatus === "pending_received") out.push("RESPOND_TO_CONTACT_REQUEST");
  else if (["none", "rejected", "cancelled", "revoked"].includes(rel.contactRequestStatus)) out.push("REQUEST_CONTACT");

  out.push(rel.isAddressBookContact ? "REMOVE_FROM_CONTACTS" : "ADD_TO_CONTACTS");
  out.push(rel.isSpecialist ? "REMOVE_SPECIALIST" : "ADD_AS_SPECIALIST");

  return out;
}

/**
 * Cross-domain seam: builds the `RelationshipSignalResolver` the identity
 * service needs without identity importing social.
 */
export function makeRelationshipSignalResolver(
  socialContacts: SocialContactsService,
  identityContactAccess: ContactAccessService,
): RelationshipSignalResolver {
  return {
    async resolve(ownerId, viewerId) {
      const [isFriend, sentRequests, receivedRequests] = await Promise.all([
        socialContacts.areFriends(ownerId, viewerId),
        identityContactAccess.getSentContactRequests(viewerId),
        identityContactAccess.getIncomingContactRequests(viewerId),
      ]);
      const between = [...sentRequests, ...receivedRequests].filter(
        (r) =>
          (r.fromUserId === viewerId && r.toUserId === ownerId) ||
          (r.fromUserId === ownerId && r.toUserId === viewerId),
      );
      const accepted = between.find((r) => r.status === "accepted") ?? null;
      return {
        isFriend,
        acceptedContactRequest: accepted
          ? { approvedFields: accepted.approvedFields }
          : null,
      };
    },
  };
}

/** Owner-side counts for the Kontakty dashboard. Counts only — never PII. */
export type ContactsDashboardDTO = {
  contacts: number;
  specialists: number;
  friends: number;
  closeFriends: number;
  distantFriends: number;
  closeFamily: number;
  distantFamily: number;
  pendingContactRequests: number;
  pendingFriendRequests: number;
};

export async function buildContactsDashboard(
  socialContacts: SocialContactsService,
  identityContactAccess: ContactAccessService,
  viewerId: UserId,
): Promise<ContactsDashboardDTO> {
  const [contacts, specialists, friends, circles, incomingContact, incomingFriend] =
    await Promise.all([
      socialContacts.listAddressBook(viewerId),
      socialContacts.listSpecialists(viewerId),
      socialContacts.listFriends(viewerId),
      socialContacts.listFriendCircles(viewerId),
      identityContactAccess.getIncomingContactRequests(viewerId),
      socialContacts.listIncomingFriendRequests(viewerId),
    ]);
  const inCircle = (c: string) => circles.filter((g) => g.circle === c).length;
  return {
    contacts: contacts.length,
    specialists: specialists.length,
    friends: friends.length,
    closeFriends: inCircle("close_friend"),
    distantFriends: inCircle("distant_friend"),
    closeFamily: inCircle("close_family"),
    distantFamily: inCircle("distant_family"),
    pendingContactRequests: incomingContact.filter((r) => r.status === "pending").length,
    pendingFriendRequests: incomingFriend.length,
  };
}
