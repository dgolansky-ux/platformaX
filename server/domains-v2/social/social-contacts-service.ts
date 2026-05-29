/**
 * social / contacts — service: friendships + address-book + specialists.
 *
 * Owner is the source of truth for the four UI lists. Friendship is the
 * only relation that requires consent (request → accept). Address-book and
 * specialist entries are owner-side bookmarks; they do NOT grant PII access
 * on their own (the PII gate lives in `identity/contact-access-policy.ts`).
 */
import type {
  AddressBookEntry,
  FriendEntry,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  AddAddressBookContactInput,
  AddSpecialistInput,
  FriendRequest,
  RespondToFriendRequestInput,
  SendFriendRequestInput,
} from "./social-contacts-dto";
import {
  canRespondToFriendRequest,
  isDuplicatePendingFriendRequest,
  isSelfRelation,
} from "./social-contacts-policy";
import type {
  AddressBookRepository,
  FriendRequestRepository,
  FriendshipRepository,
  SpecialistRepository,
} from "./social-contacts-ports";

export type SocialContactsClock = { now: () => Date };
export type SocialContactsIdGenerator = { next: () => string };

export type SocialContactsServiceDeps = {
  friends: FriendshipRepository;
  friendRequests: FriendRequestRepository;
  addressBook: AddressBookRepository;
  specialists: SpecialistRepository;
  clock: SocialContactsClock;
  ids: SocialContactsIdGenerator;
};

export type SocialContactsErrorCode =
  | "SELF_RELATION_NOT_ALLOWED"
  | "PENDING_DUPLICATE"
  | "NOT_RECEIVER"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_PENDING";

export type SocialContactsError = {
  code: SocialContactsErrorCode;
  message: string;
};

export type SocialContactsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SocialContactsError };

export interface SocialContactsService {
  // friendships
  areFriends(a: UserId, b: UserId): Promise<boolean>;
  listFriends(ownerId: UserId): Promise<FriendEntry[]>;
  sendFriendRequest(
    input: SendFriendRequestInput,
  ): Promise<SocialContactsResult<FriendRequest>>;
  respondToFriendRequest(
    input: RespondToFriendRequestInput,
  ): Promise<SocialContactsResult<FriendRequest>>;
  listIncomingFriendRequests(receiverUserId: UserId): Promise<FriendRequest[]>;
  listOutgoingFriendRequests(requesterUserId: UserId): Promise<FriendRequest[]>;
  removeFriend(a: UserId, b: UserId): Promise<void>;

  // address book
  listAddressBook(ownerId: UserId): Promise<AddressBookEntry[]>;
  addAddressBookContact(
    input: AddAddressBookContactInput,
  ): Promise<SocialContactsResult<AddressBookEntry>>;
  removeAddressBookContact(ownerId: UserId, contactId: UserId): Promise<void>;
  isAddressBookContact(ownerId: UserId, contactId: UserId): Promise<boolean>;

  // specialists
  listSpecialists(ownerId: UserId): Promise<SpecialistEntry[]>;
  addSpecialist(
    input: AddSpecialistInput,
  ): Promise<SocialContactsResult<SpecialistEntry>>;
  removeSpecialist(ownerId: UserId, specialistId: UserId): Promise<void>;
  isSpecialist(ownerId: UserId, specialistId: UserId): Promise<boolean>;
}

export function createSocialContactsService(
  deps: SocialContactsServiceDeps,
): SocialContactsService {
  return {
    async areFriends(a, b) {
      return deps.friends.areFriends(a, b);
    },
    async listFriends(ownerId) {
      return deps.friends.listForOwner(ownerId);
    },
    async sendFriendRequest(input) {
      if (isSelfRelation(input.requesterUserId, input.receiverUserId)) {
        return {
          ok: false,
          error: {
            code: "SELF_RELATION_NOT_ALLOWED",
            message: "Cannot send a friend request to yourself.",
          },
        };
      }
      const existing = await deps.friendRequests.listByPair(
        input.requesterUserId,
        input.receiverUserId,
      );
      if (
        isDuplicatePendingFriendRequest(
          input.requesterUserId,
          input.receiverUserId,
          existing,
        )
      ) {
        return {
          ok: false,
          error: {
            code: "PENDING_DUPLICATE",
            message:
              "A pending or accepted friend request from you to this user already exists.",
          },
        };
      }
      const created = await deps.friendRequests.create({
        id: deps.ids.next(),
        requesterUserId: input.requesterUserId,
        receiverUserId: input.receiverUserId,
        createdAt: deps.clock.now().toISOString(),
      });
      return { ok: true, value: created };
    },
    async respondToFriendRequest(input) {
      const existing = await deps.friendRequests.getById(input.requestId);
      if (!existing) {
        return {
          ok: false,
          error: {
            code: "REQUEST_NOT_FOUND",
            message: "Friend request not found.",
          },
        };
      }
      if (existing.status !== "pending") {
        return {
          ok: false,
          error: {
            code: "REQUEST_NOT_PENDING",
            message: `Cannot respond to a request in status ${existing.status}.`,
          },
        };
      }
      if (!canRespondToFriendRequest(existing, input.responderUserId)) {
        return {
          ok: false,
          error: {
            code: "NOT_RECEIVER",
            message: "Only the receiver may respond to this request.",
          },
        };
      }
      const now = deps.clock.now().toISOString();
      const updated = await deps.friendRequests.update(input.requestId, {
        status: input.action,
        respondedAt: now,
      });
      if (input.action === "accepted") {
        await deps.friends.add(
          existing.requesterUserId,
          existing.receiverUserId,
          now,
        );
      }
      return { ok: true, value: updated };
    },
    async listIncomingFriendRequests(receiverUserId) {
      const all = await deps.friendRequests.listIncoming(receiverUserId);
      return all.filter((r) => r.status === "pending");
    },
    async listOutgoingFriendRequests(requesterUserId) {
      const all = await deps.friendRequests.listOutgoing(requesterUserId);
      return all.filter((r) => r.status === "pending");
    },
    async removeFriend(a, b) {
      await deps.friends.remove(a, b);
    },

    async listAddressBook(ownerId) {
      return deps.addressBook.list(ownerId);
    },
    async addAddressBookContact(input) {
      if (isSelfRelation(input.ownerId, input.contactId)) {
        return {
          ok: false,
          error: {
            code: "SELF_RELATION_NOT_ALLOWED",
            message: "Cannot add yourself to your address book.",
          },
        };
      }
      const entry: AddressBookEntry = {
        ownerId: input.ownerId,
        contactId: input.contactId,
        addedAt: deps.clock.now().toISOString(),
      };
      await deps.addressBook.add(entry);
      return { ok: true, value: entry };
    },
    async removeAddressBookContact(ownerId, contactId) {
      await deps.addressBook.remove(ownerId, contactId);
    },
    async isAddressBookContact(ownerId, contactId) {
      return deps.addressBook.has(ownerId, contactId);
    },

    async listSpecialists(ownerId) {
      return deps.specialists.list(ownerId);
    },
    async addSpecialist(input) {
      if (isSelfRelation(input.ownerId, input.specialistId)) {
        return {
          ok: false,
          error: {
            code: "SELF_RELATION_NOT_ALLOWED",
            message: "Cannot mark yourself as a specialist.",
          },
        };
      }
      const entry: SpecialistEntry = {
        ownerId: input.ownerId,
        specialistId: input.specialistId,
        addedAt: deps.clock.now().toISOString(),
      };
      await deps.specialists.add(entry);
      return { ok: true, value: entry };
    },
    async removeSpecialist(ownerId, specialistId) {
      await deps.specialists.remove(ownerId, specialistId);
    },
    async isSpecialist(ownerId, specialistId) {
      return deps.specialists.has(ownerId, specialistId);
    },
  };
}
