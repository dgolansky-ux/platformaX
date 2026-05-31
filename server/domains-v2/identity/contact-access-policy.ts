/**
 * identity / contact-access — pure policy functions.
 *
 * No I/O, no time source, no side effects. Every function takes plain inputs
 * and returns a decision plus a structured reason. This file is the single
 * point that decides "can viewer V see field F of owner O?" — every other
 * caller must go through it.
 */
import type {
  ApprovedContactField,
  ContactFieldPermission,
  ContactRequest,
  OwnerContactFieldsDTO,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import { APPROVED_CONTACT_FIELDS } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

export type RelationshipSignal = {
  isFriend: boolean;
  /** Latest contact request between viewer and owner, if any. */
  acceptedContactRequest: Pick<ContactRequest, "approvedFields"> | null;
};

export type VisibilityDecision =
  | { allowed: true; reason: "owner" | "friend" | "approved_request" }
  | { allowed: false; reason: "stranger" | "permission_off" | "not_approved" };

/** Owner always sees their own field. */
export function isOwnerView(ownerId: UserId, viewerId: UserId | null): boolean {
  return viewerId !== null && viewerId === ownerId;
}

/**
 * Pure decision: can this viewer see THIS field of THIS owner?
 *
 * Mirrors the legacy double gate (see analysis §4 row 2): for a
 * non-friend viewer to see a field via an accepted contact request, BOTH
 * the request approval AND the per-field `approved` permission must be on.
 */
export function canSeeContactField(
  field: ApprovedContactField,
  ownerId: UserId,
  viewerId: UserId | null,
  permissions: ContactFieldPermission,
  rel: RelationshipSignal,
): VisibilityDecision {
  if (isOwnerView(ownerId, viewerId)) return { allowed: true, reason: "owner" };
  const perm = permissions[field];
  if (rel.isFriend && perm.friends) return { allowed: true, reason: "friend" };
  if (
    rel.acceptedContactRequest &&
    rel.acceptedContactRequest.approvedFields.includes(field) &&
    perm.approved
  ) {
    return { allowed: true, reason: "approved_request" };
  }
  if (!rel.isFriend && !rel.acceptedContactRequest) {
    return { allowed: false, reason: "stranger" };
  }
  if (rel.acceptedContactRequest && !perm.approved) {
    return { allowed: false, reason: "permission_off" };
  }
  return { allowed: false, reason: "not_approved" };
}

/**
 * Apply the per-field policy to produce the bounded `VisibleContactFieldsDTO`.
 * No PII keys are present unless `canSeeContactField` returned `allowed`.
 */
export function buildVisibleContactFields(
  ownerId: UserId,
  viewerId: UserId | null,
  ownerFields: OwnerContactFieldsDTO,
  permissions: ContactFieldPermission,
  rel: RelationshipSignal,
): VisibleContactFieldsDTO {
  const fields: VisibleContactFieldsDTO["fields"] = {};
  for (const field of APPROVED_CONTACT_FIELDS) {
    const decision = canSeeContactField(
      field,
      ownerId,
      viewerId,
      permissions,
      rel,
    );
    if (!decision.allowed) continue;
    const value = ownerFields[field];
    if (typeof value === "string" && value.length > 0) {
      fields[field] = value;
    }
  }
  return { ownerId, viewerId, fields };
}

/** A user may not request their own PII. */
export function isSelfRequest(
  fromUserId: UserId,
  toUserId: UserId,
): boolean {
  return fromUserId === toUserId;
}

/** Only the receiver of a pending request may answer it. */
export function canRespondToContactRequest(
  request: Pick<ContactRequest, "toUserId" | "status">,
  responderUserId: UserId,
): boolean {
  return request.status === "pending" && request.toUserId === responderUserId;
}

/**
 * V2 dedup rule (analysis §4 row 4):
 * - one pending request per (from→to) at a time,
 * - after `accepted` no new request is created (sender already has access),
 * - after `rejected` only the original sender can re-send.
 */
export function isDuplicatePendingRequest(
  fromUserId: UserId,
  toUserId: UserId,
  existing: Pick<ContactRequest, "fromUserId" | "toUserId" | "status">[],
): boolean {
  return existing.some(
    (r) =>
      r.fromUserId === fromUserId &&
      r.toUserId === toUserId &&
      (r.status === "pending" || r.status === "accepted"),
  );
}

/** Closed-enum validator for an approved-fields list. */
export function isApprovedFieldsValid(
  fields: readonly string[],
): fields is readonly ApprovedContactField[] {
  return fields.every((f) =>
    APPROVED_CONTACT_FIELDS.includes(f as ApprovedContactField),
  );
}
