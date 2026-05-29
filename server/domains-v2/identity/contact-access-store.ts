/**
 * identity / contact-access — in-memory repository implementations.
 *
 * Used by tests and by the application use-case during the MOCK_LOCAL_ONLY
 * phase before an HTTP/Supabase transport ships. The interfaces (`./contact-
 * access-ports`) are the contract; this file is one valid implementation.
 */
import type {
  ApprovedContactField,
  ContactFieldPermission,
  ContactRequest,
  OwnerContactFieldsDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  ContactFieldsRepository,
  ContactPermissionsRepository,
  ContactRequestsRepository,
  CreateContactRequestInput,
} from "./contact-access-ports";

export function createInMemoryContactFieldsRepository(): ContactFieldsRepository {
  const store = new Map<UserId, OwnerContactFieldsDTO>();
  return {
    async getByOwner(ownerId) {
      return store.get(ownerId) ?? null;
    },
    async upsert(record) {
      store.set(record.userId, record);
      return record;
    },
  };
}

export function createInMemoryContactPermissionsRepository(): ContactPermissionsRepository {
  const store = new Map<UserId, ContactFieldPermission>();
  return {
    async getByOwner(ownerId) {
      return store.get(ownerId) ?? null;
    },
    async upsert(ownerId, permissions) {
      store.set(ownerId, permissions);
      return permissions;
    },
  };
}

export function createInMemoryContactRequestsRepository(): ContactRequestsRepository {
  const rows = new Map<string, ContactRequest>();

  return {
    async create(input: CreateContactRequestInput) {
      const row: ContactRequest = { ...input };
      rows.set(row.id, row);
      return row;
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listByReceiver(toUserId) {
      return [...rows.values()].filter((r) => r.toUserId === toUserId);
    },
    async listBySender(fromUserId) {
      return [...rows.values()].filter((r) => r.fromUserId === fromUserId);
    },
    async listByPair(fromUserId, toUserId) {
      return [...rows.values()].filter(
        (r) => r.fromUserId === fromUserId && r.toUserId === toUserId,
      );
    },
    async latestAcceptedBetween(a, b) {
      const candidates = [...rows.values()].filter(
        (r) =>
          r.status === "accepted" &&
          ((r.fromUserId === a && r.toUserId === b) ||
            (r.fromUserId === b && r.toUserId === a)),
      );
      if (candidates.length === 0) return null;
      candidates.sort((x, y) =>
        x.updatedAt < y.updatedAt ? 1 : x.updatedAt > y.updatedAt ? -1 : 0,
      );
      return candidates[0];
    },
    async update(id, patch) {
      const existing = rows.get(id);
      if (!existing) {
        throw new Error(`ContactRequest ${id} not found`);
      }
      const approvedFields: readonly ApprovedContactField[] =
        patch.status === "accepted"
          ? (patch.approvedFields ?? [])
          : existing.approvedFields;
      const next: ContactRequest = {
        ...existing,
        status: patch.status,
        approvedFields,
        updatedAt: patch.updatedAt,
      };
      rows.set(id, next);
      return next;
    },
  };
}
