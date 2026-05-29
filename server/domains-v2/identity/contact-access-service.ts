/**
 * identity / contact-access — service.
 *
 * Composes the three repositories (fields, permissions, requests) with the
 * pure policy. The service intentionally takes a `RelationshipSignalResolver`
 * dependency instead of importing the social domain — that resolver is
 * injected by the application use-case and is the cross-domain seam.
 */
import type {
  ApprovedContactField,
  ContactRequest,
  OwnerContactFieldsDTO,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import { APPROVED_CONTACT_FIELDS } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  RespondToContactRequestInput,
  SendContactRequestInput,
  UpdateContactFieldsInput,
  UpdateContactPermissionsInput,
} from "./contact-access-dto";
import { defaultContactFieldPermissions } from "./contact-access-dto";
import {
  buildVisibleContactFields,
  canRespondToContactRequest,
  isApprovedFieldsValid,
  isDuplicatePendingRequest,
  isSelfRequest,
  type RelationshipSignal,
} from "./contact-access-policy";
import type {
  ContactFieldsRepository,
  ContactPermissionsRepository,
  ContactRequestsRepository,
} from "./contact-access-ports";

export type ContactAccessClock = { now: () => Date };
export type ContactAccessIdGenerator = { next: () => string };

/**
 * Cross-domain seam: the social domain owns "is X friend of Y". The service
 * does not import social; the application use-case passes this resolver in.
 */
export type RelationshipSignalResolver = {
  resolve(ownerId: UserId, viewerId: UserId): Promise<RelationshipSignal>;
};

export type ContactAccessServiceDeps = {
  fields: ContactFieldsRepository;
  permissions: ContactPermissionsRepository;
  requests: ContactRequestsRepository;
  clock: ContactAccessClock;
  ids: ContactAccessIdGenerator;
  friendship: RelationshipSignalResolver;
};

export type ContactAccessErrorCode =
  | "SELF_REQUEST_NOT_ALLOWED"
  | "PENDING_DUPLICATE"
  | "NOT_RECEIVER"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_NOT_PENDING"
  | "UNKNOWN_FIELD";

export type ContactAccessError = {
  code: ContactAccessErrorCode;
  message: string;
};

export type ContactAccessResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ContactAccessError };

export interface ContactAccessService {
  getMyContactFields(ownerId: UserId): Promise<OwnerContactFieldsDTO>;
  updateMyContactFields(
    input: UpdateContactFieldsInput,
  ): Promise<OwnerContactFieldsDTO>;
  updateMyContactPermissions(
    input: UpdateContactPermissionsInput,
  ): Promise<ReturnType<typeof defaultContactFieldPermissions>>;
  getVisibleContactFieldsForViewer(
    ownerId: UserId,
    viewerId: UserId | null,
  ): Promise<VisibleContactFieldsDTO>;
  sendContactRequest(
    input: SendContactRequestInput,
  ): Promise<ContactAccessResult<ContactRequest>>;
  getIncomingContactRequests(receiverId: UserId): Promise<ContactRequest[]>;
  getSentContactRequests(senderId: UserId): Promise<ContactRequest[]>;
  respondToContactRequest(
    input: RespondToContactRequestInput,
  ): Promise<ContactAccessResult<ContactRequest>>;
}

function emptyOwnerFields(ownerId: UserId): OwnerContactFieldsDTO {
  return { userId: ownerId, phoneCheckinConfirmed: false };
}

function applyFieldsPatch(
  existing: OwnerContactFieldsDTO,
  patch: UpdateContactFieldsInput,
): OwnerContactFieldsDTO {
  const next: OwnerContactFieldsDTO = { ...existing, userId: patch.userId };
  for (const key of APPROVED_CONTACT_FIELDS) {
    if (key in patch) {
      const v = patch[key];
      if (v === null) {
        delete next[key];
      } else if (typeof v === "string") {
        next[key] = v;
      }
    }
  }
  if (typeof patch.phoneCheckinConfirmed === "boolean") {
    next.phoneCheckinConfirmed = patch.phoneCheckinConfirmed;
  }
  return next;
}

export function createContactAccessService(
  deps: ContactAccessServiceDeps,
): ContactAccessService {
  return {
    async getMyContactFields(ownerId) {
      const existing = await deps.fields.getByOwner(ownerId);
      return existing ?? emptyOwnerFields(ownerId);
    },

    async updateMyContactFields(input) {
      const existing =
        (await deps.fields.getByOwner(input.userId)) ??
        emptyOwnerFields(input.userId);
      const next = applyFieldsPatch(existing, input);
      return deps.fields.upsert(next);
    },

    async updateMyContactPermissions(input) {
      const existing =
        (await deps.permissions.getByOwner(input.userId)) ??
        defaultContactFieldPermissions();
      const next = { ...existing } as ReturnType<
        typeof defaultContactFieldPermissions
      >;
      for (const key of APPROVED_CONTACT_FIELDS) {
        const incoming = input.patch[key];
        if (incoming) next[key] = { ...next[key], ...incoming };
      }
      return deps.permissions.upsert(input.userId, next);
    },

    async getVisibleContactFieldsForViewer(ownerId, viewerId) {
      const fields =
        (await deps.fields.getByOwner(ownerId)) ?? emptyOwnerFields(ownerId);
      const permissions =
        (await deps.permissions.getByOwner(ownerId)) ??
        defaultContactFieldPermissions();
      const rel: RelationshipSignal = viewerId
        ? await deps.friendship.resolve(ownerId, viewerId)
        : { isFriend: false, acceptedContactRequest: null };
      return buildVisibleContactFields(
        ownerId,
        viewerId,
        fields,
        permissions,
        rel,
      );
    },

    async sendContactRequest(input) {
      if (isSelfRequest(input.fromUserId, input.toUserId)) {
        return {
          ok: false,
          error: {
            code: "SELF_REQUEST_NOT_ALLOWED",
            message: "Cannot send a contact request to yourself.",
          },
        };
      }
      const existing = await deps.requests.listByPair(
        input.fromUserId,
        input.toUserId,
      );
      if (
        isDuplicatePendingRequest(input.fromUserId, input.toUserId, existing)
      ) {
        return {
          ok: false,
          error: {
            code: "PENDING_DUPLICATE",
            message:
              "A pending or accepted request from you to this user already exists.",
          },
        };
      }
      const now = deps.clock.now().toISOString();
      const row = await deps.requests.create({
        id: deps.ids.next(),
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        message: input.message,
        purpose: input.purpose,
        status: "pending",
        approvedFields: [],
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true, value: row };
    },

    async getIncomingContactRequests(receiverId) {
      return deps.requests.listByReceiver(receiverId);
    },

    async getSentContactRequests(senderId) {
      return deps.requests.listBySender(senderId);
    },

    async respondToContactRequest(input) {
      const existing = await deps.requests.getById(input.requestId);
      if (!existing) {
        return {
          ok: false,
          error: {
            code: "REQUEST_NOT_FOUND",
            message: "Contact request not found.",
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
      if (!canRespondToContactRequest(existing, input.responderUserId)) {
        return {
          ok: false,
          error: {
            code: "NOT_RECEIVER",
            message: "Only the receiver may respond to this request.",
          },
        };
      }
      let approvedFields: readonly ApprovedContactField[] = [];
      if (input.action === "accepted") {
        if (!isApprovedFieldsValid(input.approvedFields)) {
          return {
            ok: false,
            error: {
              code: "UNKNOWN_FIELD",
              message: "approvedFields contains an unsupported field name.",
            },
          };
        }
        approvedFields = input.approvedFields;
      }
      const updated = await deps.requests.update(input.requestId, {
        status: input.action,
        approvedFields,
        updatedAt: deps.clock.now().toISOString(),
      });
      return { ok: true, value: updated };
    },
  };
}
