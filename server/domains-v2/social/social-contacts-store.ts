/**
 * social / contacts — in-memory repository implementations.
 */
import type {
  AddressBookEntry,
  ContactGroupEntry,
  FriendEntry,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { FriendRequest } from "./social-contacts-dto";
import type {
  AddressBookRepository,
  ContactGroupRepository,
  FriendRequestRepository,
  FriendshipRepository,
  SpecialistRepository,
} from "./social-contacts-ports";

function pairKey(a: UserId, b: UserId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function createInMemoryFriendshipRepository(): FriendshipRepository {
  const friends = new Map<string, { a: UserId; b: UserId; acceptedAt: string }>();
  return {
    async areFriends(a, b) {
      return friends.has(pairKey(a, b));
    },
    async listForOwner(ownerId) {
      const out: FriendEntry[] = [];
      for (const f of friends.values()) {
        if (f.a === ownerId) {
          out.push({ ownerId, friendId: f.b, acceptedAt: f.acceptedAt });
        } else if (f.b === ownerId) {
          out.push({ ownerId, friendId: f.a, acceptedAt: f.acceptedAt });
        }
      }
      return out;
    },
    async add(a, b, acceptedAt) {
      friends.set(pairKey(a, b), { a, b, acceptedAt });
    },
    async remove(a, b) {
      friends.delete(pairKey(a, b));
    },
  };
}

export function createInMemoryFriendRequestRepository(): FriendRequestRepository {
  const rows = new Map<string, FriendRequest>();
  return {
    async create(input) {
      const row: FriendRequest = {
        ...input,
        status: "pending",
        respondedAt: null,
      };
      rows.set(row.id, row);
      return row;
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listIncoming(receiverUserId) {
      return [...rows.values()].filter(
        (r) => r.receiverUserId === receiverUserId,
      );
    },
    async listOutgoing(requesterUserId) {
      return [...rows.values()].filter(
        (r) => r.requesterUserId === requesterUserId,
      );
    },
    async listByPair(requesterUserId, receiverUserId) {
      return [...rows.values()].filter(
        (r) =>
          r.requesterUserId === requesterUserId &&
          r.receiverUserId === receiverUserId,
      );
    },
    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) throw new Error(`FriendRequest ${id} not found`);
      const next: FriendRequest = { ...existing, ...patch };
      rows.set(id, next);
      return next;
    },
  };
}

export function createInMemoryAddressBookRepository(): AddressBookRepository {
  const rows = new Map<string, AddressBookEntry>();
  const k = (ownerId: UserId, contactId: UserId) => `${ownerId}->${contactId}`;
  return {
    async list(ownerId) {
      return [...rows.values()].filter((r) => r.ownerId === ownerId);
    },
    async has(ownerId, contactId) {
      return rows.has(k(ownerId, contactId));
    },
    async add(entry) {
      rows.set(k(entry.ownerId, entry.contactId), entry);
      return entry;
    },
    async remove(ownerId, contactId) {
      rows.delete(k(ownerId, contactId));
    },
  };
}

export function createInMemorySpecialistRepository(): SpecialistRepository {
  const rows = new Map<string, SpecialistEntry>();
  const k = (ownerId: UserId, specialistId: UserId) =>
    `${ownerId}->${specialistId}`;
  return {
    async list(ownerId) {
      return [...rows.values()].filter((r) => r.ownerId === ownerId);
    },
    async has(ownerId, specialistId) {
      return rows.has(k(ownerId, specialistId));
    },
    async add(entry) {
      rows.set(k(entry.ownerId, entry.specialistId), entry);
      return entry;
    },
    async remove(ownerId, specialistId) {
      rows.delete(k(ownerId, specialistId));
    },
  };
}

export function createInMemoryContactGroupRepository(): ContactGroupRepository {
  const rows = new Map<string, ContactGroupEntry>();
  const k = (ownerId: UserId, personId: UserId) => `${ownerId}->${personId}`;
  return {
    async list(ownerId) {
      return [...rows.values()].filter(
        (r) => r.ownerId === ownerId && r.circle !== "none",
      );
    },
    async get(ownerId, personId) {
      return rows.get(k(ownerId, personId))?.circle ?? "none";
    },
    async set(entry) {
      if (entry.circle === "none") {
        rows.delete(k(entry.ownerId, entry.personId));
        return;
      }
      rows.set(k(entry.ownerId, entry.personId), entry);
    },
  };
}
