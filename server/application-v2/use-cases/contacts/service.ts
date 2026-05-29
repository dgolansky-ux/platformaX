/**
 * application-v2/use-cases/contacts — orchestration.
 *
 * Composes identity (`contact-access`) + social (`social-contacts`) into a
 * single view + action surface for the Kontakty tab and the public-profile
 * action buttons.
 *
 * Constraints (mirrored from `use-cases/profile`):
 *  - imports only `public-api.ts` from identity and social — no internals.
 *  - owns NO entities or persistence.
 *  - never returns raw owner-only DTOs through the view DTOs.
 *  - injects the cross-domain `RelationshipSignalResolver` into the
 *    identity service so identity never imports social.
 */
import type {
  ApprovedContactField,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
  ContactRequest,
  ContactRequestStatus,
  ContactsTabData,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ContactAccessService,
  RelationshipSignalResolver,
} from "@server/domains-v2/identity/public-api";
import type {
  SocialContactsService,
} from "@server/domains-v2/social/public-api";

export type ContactsApplicationServiceDeps = {
  identityContactAccess: ContactAccessService;
  socialContacts: SocialContactsService;
};

export type ContactsApplicationErrorCode =
  | "SELF_REQUEST_NOT_ALLOWED"
  | "PENDING_DUPLICATE"
  | "NOT_RECEIVER"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_PENDING"
  | "UNKNOWN_FIELD"
  | "FORBIDDEN"
  | "UNKNOWN";

export type ContactsApplicationError = {
  code: ContactsApplicationErrorCode;
  message: string;
};

export type ContactsApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ContactsApplicationError };

export interface ContactsApplicationService {
  /** Aggregate DTO for the four-tab Kontakty view (owner is the viewer). */
  getContactsTabData(
    viewerId: UserId,
  ): Promise<ContactsApplicationResult<ContactsTabData>>;

  /**
   * Single DTO the public-profile page reads to render relationship state
   * + available actions. Carries `visibleContactFields` already filtered by
   * the identity policy — so the frontend cannot accidentally leak PII.
   */
  getViewerSafeContactProfileState(
    ownerId: UserId,
    viewerId: UserId | null,
  ): Promise<ContactsApplicationResult<ContactProfileRelationshipDTO>>;

  /** A→B asks B for PII access. */
  requestContactAccess(input: {
    fromUserId: UserId;
    toUserId: UserId;
    message: string;
    purpose?: string;
  }): Promise<ContactsApplicationResult<ContactRequest>>;

  /** Receiver accepts a contact request with a selected field subset. */
  acceptContactRequest(input: {
    requestId: string;
    responderUserId: UserId;
    approvedFields: readonly ApprovedContactField[];
  }): Promise<ContactsApplicationResult<ContactRequest>>;

  /** Receiver rejects a contact request. */
  rejectContactRequest(input: {
    requestId: string;
    responderUserId: UserId;
  }): Promise<ContactsApplicationResult<ContactRequest>>;
}

/** Internal action-set computation; UI-only enriched contactRequestStatus. */
function actionsFor(rel: {
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
    | "cancelled";
  friendRequestStatus: "none" | "pending_sent" | "pending_received";
}): readonly ContactProfileAction[] {
  if (rel.isOwner) return [];
  const out: ContactProfileAction[] = [];

  // friendships
  if (rel.isFriend) {
    out.push("REMOVE_FRIEND");
  } else if (rel.friendRequestStatus === "pending_received") {
    out.push("RESPOND_TO_FRIEND_REQUEST");
  } else if (rel.friendRequestStatus === "none") {
    out.push("SEND_FRIEND_REQUEST");
  }

  // contact request
  if (rel.contactRequestStatus === "pending_received") {
    out.push("RESPOND_TO_CONTACT_REQUEST");
  } else if (
    rel.contactRequestStatus === "none" ||
    rel.contactRequestStatus === "rejected" ||
    rel.contactRequestStatus === "cancelled"
  ) {
    out.push("REQUEST_CONTACT");
  }

  // address book
  if (rel.isAddressBookContact) {
    out.push("REMOVE_FROM_CONTACTS");
  } else {
    out.push("ADD_TO_CONTACTS");
  }

  // specialist
  if (rel.isSpecialist) {
    out.push("REMOVE_SPECIALIST");
  } else {
    out.push("ADD_AS_SPECIALIST");
  }

  return out;
}

function mapErrorCode(
  code: string,
): ContactsApplicationErrorCode {
  switch (code) {
    case "SELF_REQUEST_NOT_ALLOWED":
    case "PENDING_DUPLICATE":
    case "NOT_RECEIVER":
    case "REQUEST_NOT_FOUND":
    case "REQUEST_NOT_PENDING":
    case "UNKNOWN_FIELD":
      return code as ContactsApplicationErrorCode;
    default:
      return "UNKNOWN";
  }
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

export function createContactsApplicationService(
  deps: ContactsApplicationServiceDeps,
): ContactsApplicationService {
  return {
    async getContactsTabData(viewerId) {
      const [
        friends,
        contacts,
        specialists,
        incomingContactRequests,
        incomingFriendRequests,
      ] = await Promise.all([
        deps.socialContacts.listFriends(viewerId),
        deps.socialContacts.listAddressBook(viewerId),
        deps.socialContacts.listSpecialists(viewerId),
        deps.identityContactAccess.getIncomingContactRequests(viewerId),
        deps.socialContacts.listIncomingFriendRequests(viewerId),
      ]);
      return {
        ok: true,
        value: {
          viewerId,
          friends,
          contacts,
          specialists,
          incomingContactRequests: incomingContactRequests.filter(
            (r) => r.status === "pending",
          ),
          incomingFriendRequests: incomingFriendRequests.map((r) => ({
            id: r.id,
            fromUserId: r.requesterUserId,
            createdAt: r.createdAt,
          })),
        },
      };
    },

    async getViewerSafeContactProfileState(ownerId, viewerId) {
      const isOwner = viewerId !== null && viewerId === ownerId;

      const visible: VisibleContactFieldsDTO =
        await deps.identityContactAccess.getVisibleContactFieldsForViewer(
          ownerId,
          viewerId,
        );

      if (viewerId === null) {
        // Anonymous viewer: zero PII, no actions.
        const dto: ContactProfileRelationshipDTO = {
          ownerId,
          viewerId: null,
          isFriend: false,
          isAddressBookContact: false,
          isSpecialist: false,
          contactRequestStatus: "none",
          friendRequestStatus: "none",
          visibleContactFields: visible.fields,
          availableActions: [],
        };
        return { ok: true, value: dto };
      }

      const [
        isFriend,
        isAddressBookContact,
        isSpecialist,
        sentRequests,
        receivedRequests,
        sentFriendRequests,
        receivedFriendRequests,
      ] = await Promise.all([
        deps.socialContacts.areFriends(ownerId, viewerId),
        deps.socialContacts.isAddressBookContact(viewerId, ownerId),
        deps.socialContacts.isSpecialist(viewerId, ownerId),
        deps.identityContactAccess.getSentContactRequests(viewerId),
        deps.identityContactAccess.getIncomingContactRequests(viewerId),
        deps.socialContacts.listOutgoingFriendRequests(viewerId),
        deps.socialContacts.listIncomingFriendRequests(viewerId),
      ]);

      const contactReqBetween = [...sentRequests, ...receivedRequests].find(
        (r) =>
          (r.fromUserId === viewerId && r.toUserId === ownerId) ||
          (r.fromUserId === ownerId && r.toUserId === viewerId),
      );
      let contactRequestStatus: ContactRequestStatus | "none" = "none";
      if (contactReqBetween) {
        if (contactReqBetween.status === "pending") {
          contactRequestStatus =
            contactReqBetween.fromUserId === viewerId
              ? "pending"
              : "pending"; // both directions stored as pending
        } else {
          contactRequestStatus = contactReqBetween.status;
        }
      }

      const friendReqBetween = [
        ...sentFriendRequests.map((r) => ({ ...r, direction: "out" as const })),
        ...receivedFriendRequests.map((r) => ({
          ...r,
          direction: "in" as const,
        })),
      ].find(
        (r) =>
          (r.requesterUserId === viewerId && r.receiverUserId === ownerId) ||
          (r.requesterUserId === ownerId && r.receiverUserId === viewerId),
      );
      const friendRequestStatus:
        | "none"
        | "pending_sent"
        | "pending_received" = friendReqBetween
        ? friendReqBetween.direction === "out"
          ? "pending_sent"
          : "pending_received"
        : "none";

      const enrichedContactRequestStatus: Parameters<
        typeof actionsFor
      >[0]["contactRequestStatus"] = (() => {
        if (!contactReqBetween) return "none";
        if (contactReqBetween.status === "pending") {
          return contactReqBetween.toUserId === viewerId
            ? "pending_received"
            : "pending_sent";
        }
        return contactReqBetween.status;
      })();

      const actions = actionsFor({
        isOwner,
        isFriend,
        isAddressBookContact,
        isSpecialist,
        contactRequestStatus: enrichedContactRequestStatus,
        friendRequestStatus,
      });

      const dto: ContactProfileRelationshipDTO = {
        ownerId,
        viewerId,
        isFriend,
        isAddressBookContact,
        isSpecialist,
        contactRequestStatus,
        friendRequestStatus:
          friendReqBetween && friendReqBetween.status === "pending"
            ? "pending"
            : friendReqBetween
              ? friendReqBetween.status
              : "none",
        visibleContactFields: visible.fields,
        availableActions: actions,
      };
      return { ok: true, value: dto };
    },

    async requestContactAccess(input) {
      const res = await deps.identityContactAccess.sendContactRequest(input);
      if (!res.ok) {
        return {
          ok: false,
          error: { code: mapErrorCode(res.error.code), message: res.error.message },
        };
      }
      return { ok: true, value: res.value };
    },

    async acceptContactRequest(input) {
      const res = await deps.identityContactAccess.respondToContactRequest({
        requestId: input.requestId,
        responderUserId: input.responderUserId,
        action: "accepted",
        approvedFields: input.approvedFields,
      });
      if (!res.ok) {
        return {
          ok: false,
          error: { code: mapErrorCode(res.error.code), message: res.error.message },
        };
      }
      return { ok: true, value: res.value };
    },

    async rejectContactRequest(input) {
      const res = await deps.identityContactAccess.respondToContactRequest({
        requestId: input.requestId,
        responderUserId: input.responderUserId,
        action: "rejected",
      });
      if (!res.ok) {
        return {
          ok: false,
          error: { code: mapErrorCode(res.error.code), message: res.error.message },
        };
      }
      return { ok: true, value: res.value };
    },
  };
}
