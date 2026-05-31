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
 * QUALITY_STRUCTURE_EXCEPTION — this is the single canonical contract for the
 * whole Kontakty slice (field/permission types, request lifecycle, the four
 * owner-vs-mutual relation concepts, owner-local circle labels, and the view
 * DTOs). Keeping them in one source-of-truth file is deliberate; splitting
 * would fragment the contract and create circular type imports between the
 * view DTOs and the relation enums. Exceeds the 15-export structural budget
 * for that reason. Registered in EXCEPTIONS_REGISTER.md.
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
  | "revoked"
  | "cancelled";

/** A contact request as the owner / receiver sees it. */
export type ContactRequest = {
  id: string;
  fromUserId: UserId;
  toUserId: UserId;
  message: string;
  purpose?: string;
  requestedFields: readonly ApprovedContactField[];
  status: ContactRequestStatus;
  /** Empty until `respondToContactRequest({ action: 'accepted', ... })`. */
  approvedFields: readonly ApprovedContactField[];
  createdAt: string;
  respondedAt?: string | null;
  updatedAt: string;
};

/**
 * Owner-local relationship circle. This is a label the owner applies to a
 * person in THEIR own contact view. It is NOT a global relation, requires
 * NO consent from the labelled person, and grants NO access to PII. The
 * mutual friendship relation (`FriendEntry` / `FriendRequest`) and the PII
 * gate (`VisibleContactFieldsDTO`) are entirely separate concerns.
 */
export type FriendCircle =
  | "close_friend"
  | "distant_friend"
  | "close_family"
  | "distant_family"
  | "none";

/** Assignable circles as a runtime array (excludes the implicit "none"). */
export const FRIEND_CIRCLE_VALUES: readonly Exclude<FriendCircle, "none">[] = [
  "close_friend",
  "distant_friend",
  "close_family",
  "distant_family",
] as const;

/**
 * One owner-local circle label for a person in MY contacts. Owner-side only;
 * the labelled person never sees it and it never feeds the PII policy.
 */
export type ContactGroupEntry = {
  ownerId: UserId;
  personId: UserId;
  circle: FriendCircle;
  /** When the owner last set this label. */
  updatedAt: string;
};

/**
 * Public-safe summary of a person rendered in a contact list. Carries NO PII
 * — phone/email only ever travel through `VisibleContactFieldsDTO` after the
 * policy gate. `professionName` / `categoryName` are public profile facets.
 */
export type ContactPersonSummary = {
  userId: UserId;
  displayName: string;
  handle: string;
  avatarInitial: string;
  professionName?: string;
  categoryName?: string;
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
 *
 * The four concepts stay independent here:
 *  - `isMutualFriend` / `friendRequestStatus` — the consent-based friendship.
 *  - `contactRequestStatus` / `visibleContactFields` — the PII-reveal grant.
 *  - `isAddressBookContact` / `isSpecialist` / `friendCircle` — owner-local
 *    bookmarks/labels that imply NOTHING about consent or PII access.
 */
export type ContactProfileRelationshipDTO = {
  ownerId: UserId;
  viewerId: UserId | null;
  /** Mutual accepted friendship (always mutual in V2). */
  isMutualFriend: boolean;
  isAddressBookContact: boolean;
  isSpecialist: boolean;
  /** Owner-local circle label; "none" = the owner has not categorized them. */
  friendCircle: FriendCircle;
  contactRequestStatus: ContactRequestStatus | "none";
  friendRequestStatus: FriendRequestStatus | "none";
  visibleContactFields: VisibleContactFieldsDTO["fields"];
  availableActions: readonly ContactProfileAction[];
};

/**
 * One row in the owner's Kontakty list. Bundles the public-safe person
 * summary with the owner-local labels and the (already policy-filtered)
 * relationship/permission status, so the frontend renders without ever
 * computing policy itself.
 */
export type ContactListItemDTO = {
  person: ContactPersonSummary;
  // owner-local labels / groups
  isAddressBookContact: boolean;
  isSpecialist: boolean;
  friendCircle: FriendCircle;
  // mutual relationship status
  isMutualFriend: boolean;
  friendRequestStatus: FriendRequestStatus | "none";
  // contact-permission status
  contactRequestStatus: ContactRequestStatus | "none";
  visibleContactFields: VisibleContactFieldsDTO["fields"];
  availableActions: readonly ContactProfileAction[];
};

/**
 * Aggregate DTO for the Kontakty view. Beyond the mutual `friends` and the
 * owner-local `contacts` / `specialists` bookmarks, `circles` carries the
 * owner-local circle labels (bliżsi/dalsi znajomi, bliska/dalsza rodzina).
 * All of `contacts` / `specialists` / `circles` are owner-local: they never
 * imply consent and never grant PII.
 */
export type ContactsTabData = {
  viewerId: UserId;
  friends: readonly FriendEntry[];
  contacts: readonly AddressBookEntry[];
  specialists: readonly SpecialistEntry[];
  circles: readonly ContactGroupEntry[];
  incomingContactRequests: readonly ContactRequest[];
  incomingFriendRequests: readonly {
    id: string;
    fromUserId: UserId;
    createdAt: string;
  }[];
};

/**
 * Slice 19 DTO aliases used by social/contact orchestration layers.
 * These are public-safe wrappers over the canonical contact/friendship contracts.
 */
export type RelationshipStateDTO = {
  viewerUserId: UserId;
  otherUserId: UserId;
  state:
    | "owner"
    | "stranger"
    | "pending_sent"
    | "pending_received"
    | "friends"
    | "blocked_by_viewer"
    | "blocked_by_other";
};

export type FriendDTO = FriendEntry;

export type FriendRequestDTO = {
  id: string;
  requesterUserId: UserId;
  recipientUserId: UserId;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string | null;
  updatedAt: string;
};

export type FriendsListDTO = {
  ownerUserId: UserId;
  items: readonly FriendDTO[];
  nextCursor: string | null;
};

export type ContactAccessRequestDTO = ContactRequest;

export type ContactVisibilityDTO = {
  ownerUserId: UserId;
  viewerUserId: UserId | null;
  approvedFields: readonly ApprovedContactField[];
  visibleFields: VisibleContactFieldsDTO["fields"];
};

export type ContactPanelDTO = {
  ownerUserId: UserId;
  viewerUserId: UserId | null;
  relationship: RelationshipStateDTO["state"];
  visibility: ContactVisibilityDTO;
};

export type BlockedUserDTO = {
  id: string;
  blockerUserId: UserId;
  blockedUserId: UserId;
  reason?: string;
  createdAt: string;
  revokedAt?: string | null;
};

export type SendFriendRequestInput = {
  requesterUserId: UserId;
  recipientUserId: UserId;
};

export type RespondFriendRequestInput = {
  requestId: string;
  responderUserId: UserId;
  action: "accepted" | "rejected";
};

export type RequestContactAccessInput = {
  requesterUserId: UserId;
  ownerUserId: UserId;
  requestedFields: readonly ApprovedContactField[];
  message?: string;
};

export type ApproveContactAccessInput = {
  requestId: string;
  ownerUserId: UserId;
  approvedFields: readonly ApprovedContactField[];
};

// Error / Result types intentionally live in
// `server/application-v2/use-cases/contacts/service.ts` (and the matching
// per-domain service files). Re-declaring them in shared/contracts would
// duplicate the source of truth without buying cross-boundary use.
