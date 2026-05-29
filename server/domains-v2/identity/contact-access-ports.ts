/**
 * identity / contact-access — repository ports.
 *
 * Cross-domain composition (and any future Supabase/HTTP transport) imports
 * these interfaces, not the concrete `repository.ts`. The in-memory
 * implementation in `contact-access-repository.ts` is the only concrete
 * adapter that ships in this slice.
 */
import type {
  ApprovedContactField,
  ContactFieldPermission,
  ContactRequest,
  OwnerContactFieldsDTO,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";

export interface ContactFieldsRepository {
  getByOwner(ownerId: UserId): Promise<OwnerContactFieldsDTO | null>;
  upsert(record: OwnerContactFieldsDTO): Promise<OwnerContactFieldsDTO>;
}

export interface ContactPermissionsRepository {
  getByOwner(ownerId: UserId): Promise<ContactFieldPermission | null>;
  upsert(
    ownerId: UserId,
    permissions: ContactFieldPermission,
  ): Promise<ContactFieldPermission>;
}

export type CreateContactRequestInput = {
  id: string;
  fromUserId: UserId;
  toUserId: UserId;
  message: string;
  purpose?: string;
  status: "pending";
  approvedFields: readonly ApprovedContactField[];
  createdAt: string;
  updatedAt: string;
};

export interface ContactRequestsRepository {
  create(input: CreateContactRequestInput): Promise<ContactRequest>;
  getById(id: string): Promise<ContactRequest | null>;
  listByReceiver(toUserId: UserId): Promise<ContactRequest[]>;
  listBySender(fromUserId: UserId): Promise<ContactRequest[]>;
  /**
   * For policy duplicate-check: returns every existing request between two
   * users in the from→to direction (any status).
   */
  listByPair(
    fromUserId: UserId,
    toUserId: UserId,
  ): Promise<ContactRequest[]>;
  /**
   * Most recent ACCEPTED request between viewer and owner, in either
   * direction. Used by the visibility policy.
   */
  latestAcceptedBetween(
    a: UserId,
    b: UserId,
  ): Promise<ContactRequest | null>;
  update(
    id: string,
    patch: {
      status: "accepted" | "rejected" | "cancelled";
      approvedFields?: readonly ApprovedContactField[];
      updatedAt: string;
    },
  ): Promise<ContactRequest>;
}
