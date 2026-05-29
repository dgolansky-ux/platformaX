/**
 * social / contacts — repository ports for friendships, address-book,
 * specialists. Concrete implementations live in `social-contacts-repository.ts`.
 */
import type {
  AddressBookEntry,
  FriendEntry,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type { FriendRequest } from "./social-contacts-dto";

export interface FriendshipRepository {
  /**
   * Returns true when `a` and `b` are mutually `accepted` friends.
   * Direction-insensitive.
   */
  areFriends(a: UserId, b: UserId): Promise<boolean>;
  listForOwner(ownerId: UserId): Promise<FriendEntry[]>;
  add(a: UserId, b: UserId, acceptedAt: string): Promise<void>;
  remove(a: UserId, b: UserId): Promise<void>;
}

export interface FriendRequestRepository {
  create(input: {
    id: string;
    requesterUserId: UserId;
    receiverUserId: UserId;
    createdAt: string;
  }): Promise<FriendRequest>;
  getById(id: string): Promise<FriendRequest | null>;
  listIncoming(receiverUserId: UserId): Promise<FriendRequest[]>;
  listOutgoing(requesterUserId: UserId): Promise<FriendRequest[]>;
  listByPair(
    requesterUserId: UserId,
    receiverUserId: UserId,
  ): Promise<FriendRequest[]>;
  update(
    id: string,
    patch: {
      status: "accepted" | "rejected" | "cancelled";
      respondedAt: string;
    },
  ): Promise<FriendRequest>;
}

export interface AddressBookRepository {
  list(ownerId: UserId): Promise<AddressBookEntry[]>;
  has(ownerId: UserId, contactId: UserId): Promise<boolean>;
  add(entry: AddressBookEntry): Promise<AddressBookEntry>;
  remove(ownerId: UserId, contactId: UserId): Promise<void>;
}

export interface SpecialistRepository {
  list(ownerId: UserId): Promise<SpecialistEntry[]>;
  has(ownerId: UserId, specialistId: UserId): Promise<boolean>;
  add(entry: SpecialistEntry): Promise<SpecialistEntry>;
  remove(ownerId: UserId, specialistId: UserId): Promise<void>;
}
