/**
 * features-v2/social/contacts / mock-adapter — MOCK_LOCAL_ONLY transport.
 *
 * Status: MOCK_LOCAL_ONLY. There is no HTTP layer yet, but the frontend
 * MUST NOT import `@server/*` (PX-ARCH-001). This adapter implements the
 * same async surface the future HTTP adapter will expose, backed by the
 * already-tested in-memory store from the application use-case. Wiring
 * happens here at the bundle edge — the production bundle does NOT
 * include this module once a real transport ships.
 *
 * `client/*` boundary: no `@server/*` imports — uses only the shared
 * contracts (`@shared/contracts/contacts`). Re-implementing the small
 * in-memory store locally (instead of pulling the server one in) keeps
 * the bundle clean and the boundary guard happy.
 */
import type {
  AddressBookEntry,
  ApprovedContactField,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
  ContactRequest,
  ContactsTabData,
  FriendEntry,
  SpecialistEntry,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

type IncomingFR = ContactsTabData["incomingFriendRequests"][number];

type AdapterStore = {
  friends: Map<string, FriendEntry>;
  contacts: Map<string, AddressBookEntry>;
  specialists: Map<string, SpecialistEntry>;
  contactRequests: Map<string, ContactRequest>;
  friendRequests: Map<string, IncomingFR>;
};

function emptyStore(): AdapterStore {
  return {
    friends: new Map(),
    contacts: new Map(),
    specialists: new Map(),
    contactRequests: new Map(),
    friendRequests: new Map(),
  };
}

const ALICE = "u-mock-alice" as UserId;
const BOB = "u-mock-bob" as UserId;
const CAROL = "u-mock-carol" as UserId;
const DAN = "u-mock-dan" as UserId;

/** Seeds a small, deterministic dataset so the UI shell renders something. */
function seedDemoData(store: AdapterStore, viewer: UserId): void {
  const now = "2026-05-29T03:00:00Z";
  store.friends.set(`${viewer}|${BOB}`, {
    ownerId: viewer,
    friendId: BOB,
    acceptedAt: now,
  });
  store.contacts.set(`${viewer}|${CAROL}`, {
    ownerId: viewer,
    contactId: CAROL,
    addedAt: now,
  });
  store.specialists.set(`${viewer}|${DAN}`, {
    ownerId: viewer,
    specialistId: DAN,
    addedAt: now,
  });
  store.contactRequests.set("req-demo-1", {
    id: "req-demo-1",
    fromUserId: ALICE,
    toUserId: viewer,
    message: "Cześć! Chciałbym z Tobą współpracować w temacie produktu.",
    purpose: "Współpraca",
    status: "pending",
    approvedFields: [],
    createdAt: now,
    updatedAt: now,
  });
  store.friendRequests.set("fr-demo-1", {
    id: "fr-demo-1",
    fromUserId: ALICE,
    createdAt: now,
  });
}

export type ContactsMockAdapter = {
  getContactsTabData(viewer: UserId): Promise<ContactsTabData>;
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

function computeAvailableActions(
  rel: Omit<ContactProfileRelationshipDTO, "availableActions">,
): readonly ContactProfileAction[] {
  if (rel.viewerId === null) return [];
  if (rel.viewerId === rel.ownerId) return [];
  const out: ContactProfileAction[] = [];
  out.push(rel.isFriend ? "REMOVE_FRIEND" : "SEND_FRIEND_REQUEST");
  if (rel.contactRequestStatus === "none" || rel.contactRequestStatus === "rejected") {
    out.push("REQUEST_CONTACT");
  } else if (rel.contactRequestStatus === "pending") {
    out.push("RESPOND_TO_CONTACT_REQUEST");
  }
  out.push(rel.isAddressBookContact ? "REMOVE_FROM_CONTACTS" : "ADD_TO_CONTACTS");
  out.push(rel.isSpecialist ? "REMOVE_SPECIALIST" : "ADD_AS_SPECIALIST");
  return out;
}

export const contactsMockAdapter: ContactsMockAdapter = {
  async getContactsTabData(viewer) {
    ensureSeeded(viewer);
    const friends = [...store.friends.values()].filter(
      (f) => f.ownerId === viewer,
    );
    const contacts = [...store.contacts.values()].filter(
      (c) => c.ownerId === viewer,
    );
    const specialists = [...store.specialists.values()].filter(
      (s) => s.ownerId === viewer,
    );
    const incomingContactRequests = [...store.contactRequests.values()].filter(
      (r) => r.toUserId === viewer && r.status === "pending",
    );
    const incomingFriendRequests = [...store.friendRequests.values()];
    return {
      viewerId: viewer,
      friends,
      contacts,
      specialists,
      incomingContactRequests,
      incomingFriendRequests,
    };
  },

  async getViewerSafeProfileState(ownerId, viewerId) {
    const rel: Omit<ContactProfileRelationshipDTO, "availableActions"> = {
      ownerId,
      viewerId,
      isFriend: false,
      isAddressBookContact: false,
      isSpecialist: false,
      contactRequestStatus: "none",
      friendRequestStatus: "none",
      visibleContactFields: {},
    };
    return { ...rel, availableActions: computeAvailableActions(rel) };
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
      approvedFields:
        args.action === "accepted" ? (args.approvedFields ?? []) : [],
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

  __resetForTests() {
    store.friends.clear();
    store.contacts.clear();
    store.specialists.clear();
    store.contactRequests.clear();
    store.friendRequests.clear();
    seededFor = null;
  },
};
