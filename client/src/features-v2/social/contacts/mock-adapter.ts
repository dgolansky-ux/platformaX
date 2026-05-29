/**
 * features-v2/social/contacts / mock-adapter — MOCK_LOCAL_ONLY transport.
 *
 * Status: MOCK_LOCAL_ONLY. There is no HTTP layer yet, but the frontend
 * MUST NOT import `@server/*` (PX-ARCH-001). This adapter implements the
 * same async surface the future HTTP adapter will expose, backed by a
 * small in-memory store that mirrors the already-tested application
 * use-case. Wiring happens here at the bundle edge — the production bundle
 * does NOT include this module once a real transport ships.
 *
 * The adapter (not the React component) is the policy seam: it resolves the
 * owner-local labels (contact / specialist / friendCircle), the mutual
 * relationship status and the already-filtered `visibleContactFields`, and
 * hands the component a ready-to-render `ContactListItemDTO`. The component
 * never computes policy.
 */
import type {
  AddressBookEntry,
  ApprovedContactField,
  ContactGroupEntry,
  ContactListItemDTO,
  ContactPersonSummary,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
  ContactRequest,
  ContactsTabData,
  FriendCircle,
  FriendEntry,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

type IncomingFR = ContactsTabData["incomingFriendRequests"][number];

type AdapterStore = {
  friends: Map<string, FriendEntry>;
  contacts: Map<string, AddressBookEntry>;
  specialists: Map<string, SpecialistEntry>;
  circles: Map<string, ContactGroupEntry>;
  contactRequests: Map<string, ContactRequest>;
  friendRequests: Map<string, IncomingFR>;
};

function emptyStore(): AdapterStore {
  return {
    friends: new Map(),
    contacts: new Map(),
    specialists: new Map(),
    circles: new Map(),
    contactRequests: new Map(),
    friendRequests: new Map(),
  };
}

const ALICE = "u-mock-alice" as UserId;
const BOB = "u-mock-bob" as UserId;
const CAROL = "u-mock-carol" as UserId;
const DAN = "u-mock-dan" as UserId;
const EWA = "u-mock-ewa" as UserId;
const FILIP = "u-mock-filip" as UserId;

/** Public-safe demo directory — NO PII, only profile facets + display name. */
const PEOPLE: Record<string, ContactPersonSummary> = {
  [ALICE]: { userId: ALICE, displayName: "Anna Kowalska", handle: "anna", avatarInitial: "A" },
  [BOB]: { userId: BOB, displayName: "Bartek Nowak", handle: "bartek", avatarInitial: "B" },
  [CAROL]: { userId: CAROL, displayName: "Celina Wójcik", handle: "celina", avatarInitial: "C" },
  [DAN]: {
    userId: DAN,
    displayName: "Damian Lis",
    handle: "damian",
    avatarInitial: "D",
    professionName: "Fizjoterapeuta",
    categoryName: "Medycyna",
  },
  [EWA]: { userId: EWA, displayName: "Ewa Zielińska", handle: "ewa", avatarInitial: "E" },
  [FILIP]: { userId: FILIP, displayName: "Filip Mazur", handle: "filip", avatarInitial: "F" },
};

function summaryFor(id: UserId): ContactPersonSummary {
  return (
    PEOPLE[id] ?? {
      userId: id,
      displayName: String(id),
      handle: String(id).replace(/^u-?/, ""),
      avatarInitial: String(id).replace(/^u-?/, "").slice(0, 1).toUpperCase() || "?",
    }
  );
}

/** Seeds a small, deterministic dataset so the UI shell renders something. */
function seedDemoData(store: AdapterStore, viewer: UserId): void {
  const now = "2026-05-29T03:00:00Z";
  store.friends.set(`${viewer}|${BOB}`, { ownerId: viewer, friendId: BOB, acceptedAt: now });
  store.contacts.set(`${viewer}|${CAROL}`, { ownerId: viewer, contactId: CAROL, addedAt: now });
  store.specialists.set(`${viewer}|${DAN}`, { ownerId: viewer, specialistId: DAN, addedAt: now });
  // owner-local circles — independent of friendship / address-book
  store.circles.set(`${viewer}|${BOB}`, { ownerId: viewer, personId: BOB, circle: "close_friend", updatedAt: now });
  store.circles.set(`${viewer}|${CAROL}`, { ownerId: viewer, personId: CAROL, circle: "distant_friend", updatedAt: now });
  store.circles.set(`${viewer}|${EWA}`, { ownerId: viewer, personId: EWA, circle: "close_family", updatedAt: now });
  store.circles.set(`${viewer}|${FILIP}`, { ownerId: viewer, personId: FILIP, circle: "distant_family", updatedAt: now });
  store.contactRequests.set("req-demo-1", {
    id: "req-demo-1",
    fromUserId: EWA,
    toUserId: viewer,
    message: "Cześć! Chciałabym z Tobą współpracować w temacie produktu.",
    purpose: "Współpraca",
    status: "pending",
    approvedFields: [],
    createdAt: now,
    updatedAt: now,
  });
  store.friendRequests.set("fr-demo-1", { id: "fr-demo-1", fromUserId: FILIP, createdAt: now });
}

export type ContactsMockAdapter = {
  getContactsTabData(viewer: UserId): Promise<ContactsTabData>;
  /** Resolved, ready-to-render list rows for the owner's Kontakty view. */
  getContactList(viewer: UserId): Promise<ContactListItemDTO[]>;
  getViewerSafeProfileState(
    ownerId: UserId,
    viewerId: UserId | null,
  ): Promise<ContactProfileRelationshipDTO>;
  respondToContactRequest(args: {
    requestId: string;
    responderId: UserId;
    action: "accepted" | "rejected";
    approvedFields?: readonly ApprovedContactField[];
  }): Promise<ContactRequest>;
  sendContactRequest(args: {
    fromUserId: UserId;
    toUserId: UserId;
    message: string;
    purpose?: string;
  }): Promise<ContactRequest>;
  addAddressBookContact(viewer: UserId, contactId: UserId): Promise<void>;
  removeAddressBookContact(viewer: UserId, contactId: UserId): Promise<void>;
  addSpecialist(viewer: UserId, specialistId: UserId): Promise<void>;
  removeSpecialist(viewer: UserId, specialistId: UserId): Promise<void>;
  setFriendCircle(viewer: UserId, personId: UserId, circle: FriendCircle): Promise<void>;
  /** Test helper: replace the underlying store with a fresh empty one. */
  __resetForTests(): void;
};

const store = emptyStore();
let seededFor: UserId | null = null;

function ensureSeeded(viewer: UserId): void {
  if (seededFor !== viewer) {
    seedDemoData(store, viewer);
    seededFor = viewer;
  }
}

function actionsForListItem(item: {
  isAddressBookContact: boolean;
  isSpecialist: boolean;
  isMutualFriend: boolean;
}): ContactProfileAction[] {
  const out: ContactProfileAction[] = [];
  if (item.isMutualFriend) out.push("REMOVE_FRIEND");
  if (item.isAddressBookContact) out.push("REMOVE_FROM_CONTACTS");
  if (item.isSpecialist) out.push("REMOVE_SPECIALIST");
  return out;
}

function buildListItem(viewer: UserId, personId: UserId): ContactListItemDTO {
  const isAddressBookContact = store.contacts.has(`${viewer}|${personId}`);
  const isSpecialist = store.specialists.has(`${viewer}|${personId}`);
  const isMutualFriend = store.friends.has(`${viewer}|${personId}`);
  const friendCircle = store.circles.get(`${viewer}|${personId}`)?.circle ?? "none";
  return {
    person: summaryFor(personId),
    isAddressBookContact,
    isSpecialist,
    friendCircle,
    isMutualFriend,
    friendRequestStatus: "none",
    contactRequestStatus: "none",
    visibleContactFields: {},
    availableActions: actionsForListItem({
      isAddressBookContact,
      isSpecialist,
      isMutualFriend,
    }),
  };
}

function collectPersonIds(viewer: UserId): UserId[] {
  const ids = new Set<UserId>();
  for (const f of store.friends.values()) if (f.ownerId === viewer) ids.add(f.friendId);
  for (const c of store.contacts.values()) if (c.ownerId === viewer) ids.add(c.contactId);
  for (const s of store.specialists.values()) if (s.ownerId === viewer) ids.add(s.specialistId);
  for (const g of store.circles.values()) if (g.ownerId === viewer) ids.add(g.personId);
  return [...ids];
}

export const contactsMockAdapter: ContactsMockAdapter = {
  async getContactsTabData(viewer) {
    ensureSeeded(viewer);
    return {
      viewerId: viewer,
      friends: [...store.friends.values()].filter((f) => f.ownerId === viewer),
      contacts: [...store.contacts.values()].filter((c) => c.ownerId === viewer),
      specialists: [...store.specialists.values()].filter((s) => s.ownerId === viewer),
      circles: [...store.circles.values()].filter((g) => g.ownerId === viewer),
      incomingContactRequests: [...store.contactRequests.values()].filter(
        (r) => r.toUserId === viewer && r.status === "pending",
      ),
      incomingFriendRequests: [...store.friendRequests.values()],
    };
  },

  async getContactList(viewer) {
    ensureSeeded(viewer);
    return collectPersonIds(viewer).map((id) => buildListItem(viewer, id));
  },

  async getViewerSafeProfileState(ownerId, viewerId) {
    const isMutualFriend =
      viewerId !== null && store.friends.has(`${viewerId}|${ownerId}`);
    const friendCircle =
      viewerId === null
        ? "none"
        : store.circles.get(`${viewerId}|${ownerId}`)?.circle ?? "none";
    const isAddressBookContact =
      viewerId !== null && store.contacts.has(`${viewerId}|${ownerId}`);
    const isSpecialist =
      viewerId !== null && store.specialists.has(`${viewerId}|${ownerId}`);
    return {
      ownerId,
      viewerId,
      isMutualFriend,
      isAddressBookContact,
      isSpecialist,
      friendCircle,
      contactRequestStatus: "none",
      friendRequestStatus: "none",
      visibleContactFields: {},
      availableActions: [],
    };
  },

  async respondToContactRequest(args) {
    const existing = store.contactRequests.get(args.requestId);
    if (!existing) throw new Error(`contact request ${args.requestId} not found`);
    if (existing.toUserId !== args.responderId) {
      throw new Error("only the receiver may respond");
    }
    const next: ContactRequest = {
      ...existing,
      status: args.action,
      approvedFields: args.action === "accepted" ? (args.approvedFields ?? []) : [],
      updatedAt: new Date().toISOString(),
    };
    store.contactRequests.set(args.requestId, next);
    return next;
  },

  async sendContactRequest(args) {
    if (args.fromUserId === args.toUserId) {
      throw new Error("cannot send request to yourself");
    }
    const id = `req-mock-${Date.now()}`;
    const now = new Date().toISOString();
    const row: ContactRequest = {
      id,
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      message: args.message,
      purpose: args.purpose,
      status: "pending",
      approvedFields: [],
      createdAt: now,
      updatedAt: now,
    };
    store.contactRequests.set(id, row);
    return row;
  },

  async addAddressBookContact(viewer, contactId) {
    store.contacts.set(`${viewer}|${contactId}`, {
      ownerId: viewer,
      contactId,
      addedAt: new Date().toISOString(),
    });
  },
  async removeAddressBookContact(viewer, contactId) {
    store.contacts.delete(`${viewer}|${contactId}`);
  },
  async addSpecialist(viewer, specialistId) {
    store.specialists.set(`${viewer}|${specialistId}`, {
      ownerId: viewer,
      specialistId,
      addedAt: new Date().toISOString(),
    });
  },
  async removeSpecialist(viewer, specialistId) {
    store.specialists.delete(`${viewer}|${specialistId}`);
  },
  async setFriendCircle(viewer, personId, circle) {
    const key = `${viewer}|${personId}`;
    if (circle === "none") {
      store.circles.delete(key);
      return;
    }
    store.circles.set(key, {
      ownerId: viewer,
      personId,
      circle,
      updatedAt: new Date().toISOString(),
    });
  },

  __resetForTests() {
    store.friends.clear();
    store.contacts.clear();
    store.specialists.clear();
    store.circles.clear();
    store.contactRequests.clear();
    store.friendRequests.clear();
    seededFor = null;
  },
};
