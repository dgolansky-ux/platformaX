// === Slice 24 PRE-runtime ACK marker (EXC-016) ======================
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK marker =======================================

// ALLOW_FILE_SIZE_EXCEPTION — Slice 19 added `blockUser` with pending-request
// cancellation, friend-circle owner-local labels, and address-book/specialists
// listing flows to the existing contacts service.
// Registered in EXCEPTIONS_REGISTER.md (EXC-011).
/**
 * social / contacts — service: friendships + address-book + specialists.
 *
 * Owner is the source of truth for the four UI lists. Friendship is the
 * only relation that requires consent (request → accept). Address-book and
 * specialist entries are owner-side bookmarks; they do NOT grant PII access
 * on their own (the PII gate lives in `identity/contact-access-policy.ts`).
 */
import type {
  BlockedUserDTO,
  AddressBookEntry,
  ContactGroupEntry,
  FriendCircle,
  FriendEntry,
  RelationshipStateDTO,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  AddAddressBookContactInput,
  AddSpecialistInput,
  FriendRequest,
  RespondToFriendRequestInput,
  SendFriendRequestInput,
  SetFriendCircleInput,
} from "./social-contacts-dto";
import {
  canRespondToFriendRequest,
  isDuplicatePendingFriendRequest,
  isSelfRelation,
} from "./social-contacts-policy";
import type {
  AddressBookRepository,
  ContactGroupRepository,
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
  groups: ContactGroupRepository;
  clock: SocialContactsClock;
  ids: SocialContactsIdGenerator;
};

export type SocialContactsErrorCode =
  | "SELF_RELATION_NOT_ALLOWED"
  | "PENDING_DUPLICATE"
  | "NOT_REQUESTER"
  | "NOT_RECEIVER"
  | "BLOCKED_RELATIONSHIP"
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
  isBlocked(blockerUserId: UserId, blockedUserId: UserId): Promise<boolean>;
  listFriends(ownerId: UserId): Promise<FriendEntry[]>;
  getFriendIdsForViewer(viewerUserId: UserId): Promise<readonly UserId[]>;
  getRelationshipState(
    viewerUserId: UserId,
    otherUserId: UserId,
  ): Promise<RelationshipStateDTO>;
  sendFriendRequest(
    input: SendFriendRequestInput,
  ): Promise<SocialContactsResult<FriendRequest>>;
  cancelFriendRequest(input: {
    requestId: string;
    requesterUserId: UserId;
  }): Promise<SocialContactsResult<FriendRequest>>;
  acceptFriendRequest(input: {
    requestId: string;
    recipientUserId: UserId;
  }): Promise<SocialContactsResult<FriendRequest>>;
  rejectFriendRequest(input: {
    requestId: string;
    recipientUserId: UserId;
  }): Promise<SocialContactsResult<FriendRequest>>;
  respondToFriendRequest(
    input: RespondToFriendRequestInput,
  ): Promise<SocialContactsResult<FriendRequest>>;
  listPendingSentRequests(requesterUserId: UserId): Promise<FriendRequest[]>;
  listPendingReceivedRequests(receiverUserId: UserId): Promise<FriendRequest[]>;
  listIncomingFriendRequests(receiverUserId: UserId): Promise<FriendRequest[]>;
  listOutgoingFriendRequests(requesterUserId: UserId): Promise<FriendRequest[]>;
  removeFriend(a: UserId, b: UserId): Promise<void>;
  blockUser(input: {
    blockerUserId: UserId;
    blockedUserId: UserId;
    reason?: string;
  }): Promise<SocialContactsResult<BlockedUserDTO>>;
  unblockUser(input: {
    blockerUserId: UserId;
    blockedUserId: UserId;
  }): Promise<SocialContactsResult<BlockedUserDTO>>;
  listBlockedUsers(blockerUserId: UserId): Promise<BlockedUserDTO[]>;

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

  // owner-local friend circles (bliżsi/dalsi znajomi, bliska/dalsza rodzina)
  listFriendCircles(ownerId: UserId): Promise<ContactGroupEntry[]>;
  getFriendCircle(ownerId: UserId, personId: UserId): Promise<FriendCircle>;
  setFriendCircle(
    input: SetFriendCircleInput,
  ): Promise<SocialContactsResult<ContactGroupEntry>>;
}

export function createSocialContactsService(
  deps: SocialContactsServiceDeps,
): SocialContactsService {
  const blocks = new Map<string, BlockedUserDTO>();
  const key = (a: UserId, b: UserId) => `${a}->${b}`;
  const isBlockedEither = (a: UserId, b: UserId): boolean =>
    blocks.has(key(a, b)) || blocks.has(key(b, a));
  const activeBlockFor = (
    blockerUserId: UserId,
    blockedUserId: UserId,
  ): BlockedUserDTO | null => blocks.get(key(blockerUserId, blockedUserId)) ?? null;

  return {
    async areFriends(a, b) {
      if (isBlockedEither(a, b)) return false;
      return deps.friends.areFriends(a, b);
    },
    async isBlocked(blockerUserId, blockedUserId) {
      return activeBlockFor(blockerUserId, blockedUserId) !== null;
    },
    async listFriends(ownerId) {
      const raw = await deps.friends.listForOwner(ownerId);
      return raw.filter(
        (entry) => !isBlockedEither(entry.ownerId, entry.friendId),
      );
    },
    async getFriendIdsForViewer(viewerUserId) {
      const friends = await this.listFriends(viewerUserId);
      return friends.map((f) => f.friendId);
    },
    async getRelationshipState(viewerUserId, otherUserId) {
      if (viewerUserId === otherUserId) {
        return { viewerUserId, otherUserId, state: "owner" };
      }
      if (activeBlockFor(viewerUserId, otherUserId)) {
        return { viewerUserId, otherUserId, state: "blocked_by_viewer" };
      }
      if (activeBlockFor(otherUserId, viewerUserId)) {
        return { viewerUserId, otherUserId, state: "blocked_by_other" };
      }
      if (await deps.friends.areFriends(viewerUserId, otherUserId)) {
        return { viewerUserId, otherUserId, state: "friends" };
      }
      const outgoing = await deps.friendRequests.listByPair(
        viewerUserId,
        otherUserId,
      );
      if (outgoing.some((r) => r.status === "pending")) {
        return { viewerUserId, otherUserId, state: "pending_sent" };
      }
      const incoming = await deps.friendRequests.listByPair(
        otherUserId,
        viewerUserId,
      );
      if (incoming.some((r) => r.status === "pending")) {
        return { viewerUserId, otherUserId, state: "pending_received" };
      }
      return { viewerUserId, otherUserId, state: "stranger" };
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
      if (isBlockedEither(input.requesterUserId, input.receiverUserId)) {
        return {
          ok: false,
          error: {
            code: "BLOCKED_RELATIONSHIP",
            message:
              "Cannot send friend request while either side has an active block.",
          },
        };
      }
      const existing = await deps.friendRequests.listByPair(
        input.requesterUserId,
        input.receiverUserId,
      );
      const reverse = await deps.friendRequests.listByPair(
        input.receiverUserId,
        input.requesterUserId,
      );
      if (
        isDuplicatePendingFriendRequest(
          input.requesterUserId,
          input.receiverUserId,
          existing,
        )
        || reverse.some((req) => req.status === "pending")
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
    async cancelFriendRequest(input) {
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
      if (existing.requesterUserId !== input.requesterUserId) {
        return {
          ok: false,
          error: {
            code: "NOT_REQUESTER",
            message: "Only requester may cancel this request.",
          },
        };
      }
      if (existing.status !== "pending") {
        return {
          ok: false,
          error: {
            code: "REQUEST_NOT_PENDING",
            message: `Cannot cancel request in status ${existing.status}.`,
          },
        };
      }
      const now = deps.clock.now().toISOString();
      const updated = await deps.friendRequests.update(input.requestId, {
        status: "cancelled",
        respondedAt: now,
      });
      return { ok: true, value: updated };
    },
    async acceptFriendRequest(input) {
      return this.respondToFriendRequest({
        requestId: input.requestId,
        responderUserId: input.recipientUserId,
        action: "accepted",
      });
    },
    async rejectFriendRequest(input) {
      return this.respondToFriendRequest({
        requestId: input.requestId,
        responderUserId: input.recipientUserId,
        action: "rejected",
      });
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
    async listPendingSentRequests(requesterUserId) {
      return this.listOutgoingFriendRequests(requesterUserId);
    },
    async listPendingReceivedRequests(receiverUserId) {
      return this.listIncomingFriendRequests(receiverUserId);
    },
    async removeFriend(a, b) {
      await deps.friends.remove(a, b);
    },
    async blockUser(input) {
      if (isSelfRelation(input.blockerUserId, input.blockedUserId)) {
        return {
          ok: false,
          error: {
            code: "SELF_RELATION_NOT_ALLOWED",
            message: "Cannot block yourself.",
          },
        };
      }
      const now = deps.clock.now().toISOString();
      await deps.friends.remove(input.blockerUserId, input.blockedUserId);
      const outgoing = await deps.friendRequests.listByPair(
        input.blockerUserId,
        input.blockedUserId,
      );
      const incoming = await deps.friendRequests.listByPair(
        input.blockedUserId,
        input.blockerUserId,
      );
      // SCALABILITY_EXCEPTION: bounded by pending friend requests between two specific users (FIXED_CAP, typically 0–2 rows).
      const pendingPair = [...outgoing, ...incoming].filter(
        (request) => request.status === "pending",
      );
      await Promise.all(
        pendingPair.map((request) =>
          deps.friendRequests.update(request.id, {
            status: "cancelled",
            respondedAt: now,
          }),
        ),
      );
      const record: BlockedUserDTO = {
        id: `blk-${input.blockerUserId}-${input.blockedUserId}`,
        blockerUserId: input.blockerUserId,
        blockedUserId: input.blockedUserId,
        reason: input.reason,
        createdAt: now,
        revokedAt: null,
      };
      blocks.set(key(input.blockerUserId, input.blockedUserId), record);
      return { ok: true, value: record };
    },
    async unblockUser(input) {
      const existing = activeBlockFor(input.blockerUserId, input.blockedUserId);
      if (!existing) {
        return {
          ok: false,
          error: {
            code: "REQUEST_NOT_FOUND",
            message: "No active block for that pair.",
          },
        };
      }
      const updated: BlockedUserDTO = {
        ...existing,
        revokedAt: deps.clock.now().toISOString(),
      };
      blocks.delete(key(input.blockerUserId, input.blockedUserId));
      return { ok: true, value: updated };
    },
    async listBlockedUsers(blockerUserId) {
      return [...blocks.values()].filter(
        (row) => row.blockerUserId === blockerUserId,
      );
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

    async listFriendCircles(ownerId) {
      return deps.groups.list(ownerId);
    },
    async getFriendCircle(ownerId, personId) {
      return deps.groups.get(ownerId, personId);
    },
    async setFriendCircle(input) {
      if (isSelfRelation(input.ownerId, input.personId)) {
        return {
          ok: false,
          error: {
            code: "SELF_RELATION_NOT_ALLOWED",
            message: "Cannot put yourself into a contact circle.",
          },
        };
      }
      const entry: ContactGroupEntry = {
        ownerId: input.ownerId,
        personId: input.personId,
        circle: input.circle,
        updatedAt: deps.clock.now().toISOString(),
      };
      await deps.groups.set(entry);
      return { ok: true, value: entry };
    },
  };
}