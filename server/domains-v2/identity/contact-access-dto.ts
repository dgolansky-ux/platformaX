/**
 * identity / contact-access — internal DTOs + Input shapes.
 *
 * Owns the PII side of the Kontakty slice: the owner's contact fields,
 * the per-field visibility toggles, and the contact-request entity that a
 * stranger uses to ask for access. Cross-domain types live in
 * `@shared/contracts/contacts`; this module re-exports them via the service
 * and the public-api surface so callers never `import "@server/.../internal"`.
 *
 * ALLOW_PRIVATE_DTO_PII — registered as EXC-004 in EXCEPTIONS_REGISTER.md.
 * Owner-only Input/Owner types co-located with the request DTO; the file-name
 * matches the PII guard glob (`dto`) so the guard scans it, but every PII-
 * carrying type here is owner-only and never reaches a public viewer through
 * the policy filter in `application-v2/use-cases/contacts`.
 */
import type {
  ApprovedContactField,
  ContactFieldPermission,
  ContactRequest,
  ContactRequestStatus,
  OwnerContactFieldsDTO,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

export type { ContactRequest, ContactRequestStatus };
export type { OwnerContactFieldsDTO, VisibleContactFieldsDTO };
export type { ContactFieldPermission, ApprovedContactField };

/** Default per-field permissions for a new profile — everything denied. */
export function defaultContactFieldPermissions(): ContactFieldPermission {
  return {
    phone: { friends: false, approved: false },
    emailContact: { friends: false, approved: false },
    instagram: { friends: false, approved: false },
    facebook: { friends: false, approved: false },
    whatsapp: { friends: false, approved: false },
    telegram: { friends: false, approved: false },
    linkedin: { friends: false, approved: false },
    website: { friends: false, approved: false },
  };
}

/** Owner-only patch of contact fields. Optional keys = "leave unchanged". */
export type UpdateContactFieldsInput = {
  userId: UserId;
  phone?: string | null;
  emailContact?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  /** Owner confirms `phone` is their real number. */
  phoneCheckinConfirmed?: boolean;
};

/** Owner-only patch of per-field visibility toggles. */
export type UpdateContactPermissionsInput = {
  userId: UserId;
  /** Sparse map: only listed fields change. */
  patch: Partial<ContactFieldPermission>;
};

/** Input for stranger asking owner for PII access. */
export type SendContactRequestInput = {
  fromUserId: UserId;
  toUserId: UserId;
  message: string;
  purpose?: string;
};

/** Input for owner replying to a pending request. */
export type RespondToContactRequestInput = {
  requestId: string;
  responderUserId: UserId;
} & (
  | { action: "accepted"; approvedFields: readonly ApprovedContactField[] }
  | { action: "rejected" }
);
