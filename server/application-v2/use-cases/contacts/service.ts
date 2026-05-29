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
  AddressBookEntry,
  ApprovedContactField,
  ContactGroupEntry,
  ContactProfileRelationshipDTO,
  ContactRequest,
  ContactRequestStatus,
  ContactsTabData,
  FriendCircle,
  SpecialistEntry,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { ContactAccessService } from "@server/domains-v2/identity/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import {
  actionsFor,
  buildContactsDashboard,
  type ContactsDashboardDTO,
} from "./internals";

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
  getProfileContactRelationship(
    ownerId: UserId,
    viewerId: UserId | null,
  ): Promise<ContactsApplicationResult<ContactProfileRelationshipDTO>>;

  /** Owner-side dashboard counts (counts only — never PII). */
  getContactsDashboard(
    viewerId: UserId,
  ): Promise<ContactsApplicationResult<ContactsDashboardDTO>>;

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

  /** Owner-local: label a person with a circle (or "none"); no consent, no PII. */
  updateOwnerLocalContactGroup(input: {
    ownerId: UserId;
    personId: UserId;
    circle: FriendCircle;
  }): Promise<ContactsApplicationResult<ContactGroupEntry>>;

  /** Owner-local bookmark: save a person to my address book (no consent, no PII). */
  addToContacts(
    ownerId: UserId,
    contactId: UserId,
  ): Promise<ContactsApplicationResult<AddressBookEntry>>;
  removeFromContacts(
    ownerId: UserId,
    contactId: UserId,
  ): Promise<ContactsApplicationResult<void>>;

  /** Owner-local bookmark: tag a person as a specialist (no consent, no PII). */
  addAsSpecialist(
    ownerId: UserId,
    specialistId: UserId,
  ): Promise<ContactsApplicationResult<SpecialistEntry>>;
  removeSpecialist(
    ownerId: UserId,
    specialistId: UserId,
  ): Promise<ContactsApplicationResult<void>>;
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

/** Re-map a domain Result error onto the application error shape. */
function mapResult<T>(
  res: { ok: true; value: T } | { ok: false; error: { code: string; message: string } },
): ContactsApplicationResult<T> {
  return res.ok
    ? { ok: true, value: res.value }
    : { ok: false, error: { code: mapErrorCode(res.error.code), message: res.error.message } };
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
        circles,
        incomingContactRequests,
        incomingFriendRequests,
      ] = await Promise.all([
        deps.socialContacts.listFriends(viewerId),
        deps.socialContacts.listAddressBook(viewerId),
        deps.socialContacts.listSpecialists(viewerId),
        deps.socialContacts.listFriendCircles(viewerId),
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
          circles,
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

    async getContactsDashboard(viewerId) {
      return {
        ok: true,
        value: await buildContactsDashboard(
          deps.socialContacts,
          deps.identityContactAccess,
          viewerId,
        ),
      };
    },

    async getProfileContactRelationship(ownerId, viewerId) {
      const isOwner = viewerId !== null && viewerId === ownerId;

      const visible: VisibleContactFieldsDTO =
        await deps.identityContactAccess.getVisibleContactFieldsForViewer(
          ownerId,
          viewerId,
        );

      if (viewerId === null) {
        // Anonymous viewer: zero PII, no actions, no owner-local labels.
        const dto: ContactProfileRelationshipDTO = {
          ownerId,
          viewerId: null,
          isMutualFriend: false,
          isAddressBookContact: false,
          isSpecialist: false,
          friendCircle: "none",
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
        friendCircle,
        sentRequests,
        receivedRequests,
        sentFriendRequests,
        receivedFriendRequests,
      ] = await Promise.all([
        deps.socialContacts.areFriends(ownerId, viewerId),
        deps.socialContacts.isAddressBookContact(viewerId, ownerId),
        deps.socialContacts.isSpecialist(viewerId, ownerId),
        deps.socialContacts.getFriendCircle(viewerId, ownerId),
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
        isMutualFriend: isFriend,
        isAddressBookContact,
        isSpecialist,
        friendCircle,
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
      return mapResult(await deps.identityContactAccess.sendContactRequest(input));
    },

    async acceptContactRequest(input) {
      return mapResult(
        await deps.identityContactAccess.respondToContactRequest({
          requestId: input.requestId,
          responderUserId: input.responderUserId,
          action: "accepted",
          approvedFields: input.approvedFields,
        }),
      );
    },

    async rejectContactRequest(input) {
      return mapResult(
        await deps.identityContactAccess.respondToContactRequest({
          requestId: input.requestId,
          responderUserId: input.responderUserId,
          action: "rejected",
        }),
      );
    },

    async updateOwnerLocalContactGroup(input) {
      return mapResult(await deps.socialContacts.setFriendCircle(input));
    },

    async addToContacts(ownerId, contactId) {
      return mapResult(
        await deps.socialContacts.addAddressBookContact({ ownerId, contactId }),
      );
    },
    async removeFromContacts(ownerId, contactId) {
      await deps.socialContacts.removeAddressBookContact(ownerId, contactId);
      return { ok: true, value: undefined };
    },
    async addAsSpecialist(ownerId, specialistId) {
      return mapResult(
        await deps.socialContacts.addSpecialist({ ownerId, specialistId }),
      );
    },
    async removeSpecialist(ownerId, specialistId) {
      await deps.socialContacts.removeSpecialist(ownerId, specialistId);
      return { ok: true, value: undefined };
    },
  };
}
