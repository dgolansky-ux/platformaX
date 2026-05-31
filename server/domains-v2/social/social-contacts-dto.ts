/**
 * social / contacts — internal DTOs for the three social relations in the
 * Kontakty slice: friendships, address-book entries and specialists.
 *
 * privacy classification: Public DTO — these types reference user IDs only.
 * No PII (phone/email/dateOfBirth) appears in any type below; the PII side
 * is owned by `identity/contact-access-*` and policy-filtered before any
 * cross-boundary call.
 */
import type {
  AddressBookEntry,
  ContactGroupEntry,
  FriendCircle,
  FriendEntry,
  FriendRequestStatus,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

export type { AddressBookEntry, ContactGroupEntry, FriendCircle, FriendEntry, SpecialistEntry };
export type { FriendRequestStatus };

export type FriendRequest = {
  id: string;
  requesterUserId: UserId;
  receiverUserId: UserId;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type SendFriendRequestInput = {
  requesterUserId: UserId;
  receiverUserId: UserId;
};

export type RespondToFriendRequestInput = {
  requestId: string;
  responderUserId: UserId;
  action: "accepted" | "rejected";
};

export type AddAddressBookContactInput = {
  ownerId: UserId;
  contactId: UserId;
};

export type AddSpecialistInput = {
  ownerId: UserId;
  specialistId: UserId;
};

export type SetFriendCircleInput = {
  ownerId: UserId;
  personId: UserId;
  circle: FriendCircle;
};
