/**
 * shared/contracts/contacts — canonical contact-tab contract types.
 *
 * Single source of truth for the "Kontakty" slice (legacy reference:
 * docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md). Both client/** and
 * server/** import from here so the contract shape stays in one place.
 *
 * shared/contracts/* MUST NOT import from @server/* — these are independent
 * definitions, not server-runtime mirrors.
 *
 * ALLOW_PRIVATE_DTO_PII — registered in EXCEPTIONS_REGISTER.md as EXC-004.
 * The only types in this file that name PII tokens (`phone`,
 * `emailContact`) are: (a) `OwnerContactFieldsDTO` — returned only to the
 * owner; (b) `VisibleContactFieldsDTO` — returned only when the policy in
 * `application-v2/use-cases/contacts` has already confirmed the viewer is
 * allowed to see the specific field; (c) `ApprovedContactField` / runtime
 * arrays — string-literal enums, not values. There is no Public DTO in this
 * file that broadcasts raw PII to an unauthorized viewer.
 */
import type { UserId } from "./branded-ids";

/**
 * Closed enum of the contact-field kinds we expose through the contact-request
 * flow. Deliberately excludes legacy `github` (see analysis §4 row 9).
 */
export type ApprovedContactField =
  | "phone"
  | "emailContact"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "linkedin"
  | "website";

/** All ApprovedContactField values as a runtime-safe array. */
export const APPROVED_CONTACT_FIELDS: readonly ApprovedContactField[] = [
  "phone",
  "emailContact",
  "instagram",
  "facebook",
  "whatsapp",
  "telegram",
  "linkedin",
  "website",
] as const;

/** Per-field, owner-controlled visibility toggles. */
export type ContactFieldVisibility = {
  /** Friends (mutual `friendship.accepted`) may see this field. */
  friends: boolean;
  /** People with an `accepted` contact-request and this field approved. */
  approved: boolean;
};

/** Owner-only map: per field, current visibility toggles. */
export type ContactFieldPermission = Record<
  ApprovedContactField,
  ContactFieldVisibility
>;

/**
 * One contact field as it appears to the *owner* in the editor. Values are
 * raw because the owner is allowed to see them; this DTO is NEVER sent to a
 * non-owner viewer (the policy returns `VisibleContactFieldsDTO` instead).
 */
export type OwnerContactFieldsDTO = {
  userId: UserId;
  phone?: string;
  emailContact?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  telegram?: string;
  linkedin?: string;
  website?: string;
  /** Owner-only confirmation flag: "this is really my number". */
  phoneCheckinConfirmed: boolean;
};

/**
 * The subset of fields the viewer is policy-allowed to see. ABSENT keys =
 * "not allowed to see"; explicit `null` values are never produced here.
 *
 * This is the canonical output of
 * `getVisibleContactFieldsForViewer(ownerId, viewerId)` and is the ONLY
 * cross-boundary DTO that may carry raw phone/email values for a non-owner.
 */
export type VisibleContactFieldsDTO = {
  ownerId: UserId;
  viewerId: UserId | null;
  fields: Partial<Pick<
    OwnerContactFieldsDTO,
    | "phone"
    | "emailContact"
    | "instagram"
    | "facebook"
    | "whatsapp"
    | "telegram"
    | "linkedin"
    | "website"
  >>;
};

/** Lifecycle of a single contact request. */
export type ContactRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

/** A contact request as the owner / receiver sees it. */
export type ContactRequest = {
  id: string;
  fromUserId: UserId;
  toUserId: UserId;
  message: string;
  purpose?: string;
  status: ContactRequestStatus;
  /** Empty until `respondToContactRequest({ action: 'accepted', ... })`. */
  approvedFields: readonly ApprovedContactField[];
  createdAt: string;
  updatedAt: string;
};

/** A row in MY address book (one-sided; no consent required). */
export type AddressBookEntry = {
  ownerId: UserId;
  contactId: UserId;
  /** When the owner saved this person. */
  addedAt: string;
};

/** A row in MY specialists list. */
export type SpecialistEntry = {
  ownerId: UserId;
  specialistId: UserId;
  addedAt: string;
};

/** An accepted friendship in MY friend list. */
export type FriendEntry = {
  ownerId: UserId;
  friendId: UserId;
  acceptedAt: string;
};

/** Lifecycle of a friend invitation. */
export type FriendRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

/**
 * Available action keys the frontend may render as buttons. The set is
 * fixed so the UI cannot invent new actions; missing key = action not
 * available to this viewer in this state.
 */
export type ContactProfileAction =
  | "REQUEST_CONTACT"
  | "RESPOND_TO_CONTACT_REQUEST"
  | "ADD_TO_CONTACTS"
  | "REMOVE_FROM_CONTACTS"
  | "ADD_AS_SPECIALIST"
  | "REMOVE_SPECIALIST"
  | "SEND_FRIEND_REQUEST"
  | "RESPOND_TO_FRIEND_REQUEST"
  | "REMOVE_FRIEND";

/**
 * Single DTO the frontend reads to render a contact's profile actions and
 * relationship state. Carries NO raw PII unless the corresponding policy
 * gate passed and produced `visibleContactFields` already filtered.
 */
export type ContactProfileRelationshipDTO = {
  ownerId: UserId;
  viewerId: UserId | null;
  isFriend: boolean;
  isAddressBookContact: boolean;
  isSpecialist: boolean;
  contactRequestStatus: ContactRequestStatus | "none";
  friendRequestStatus: FriendRequestStatus | "none";
  visibleContactFields: VisibleContactFieldsDTO["fields"];
  availableActions: readonly ContactProfileAction[];
};

/** Aggregate DTO for the four-tab Kontakty view. */
export type ContactsTabData = {
  viewerId: UserId;
  friends: readonly FriendEntry[];
  contacts: readonly AddressBookEntry[];
  specialists: readonly SpecialistEntry[];
  incomingContactRequests: readonly ContactRequest[];
  incomingFriendRequests: readonly {
    id: string;
    fromUserId: UserId;
    createdAt: string;
  }[];
};

// Error / Result types intentionally live in
// `server/application-v2/use-cases/contacts/service.ts` (and the matching
// per-domain service files). Re-declaring them in shared/contracts would
// duplicate the source of truth without buying cross-boundary use.
