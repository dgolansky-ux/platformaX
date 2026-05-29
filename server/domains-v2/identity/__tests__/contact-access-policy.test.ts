import { describe, expect, it } from "vitest";
import {
  buildVisibleContactFields,
  canRespondToContactRequest,
  canSeeContactField,
  isApprovedFieldsValid,
  isDuplicatePendingRequest,
  isSelfRequest,
  type RelationshipSignal,
} from "../contact-access-policy";
import { defaultContactFieldPermissions } from "../contact-access-dto";
import { toUserId } from "@shared/contracts/branded-ids";

const OWNER = toUserId("u-owner");
const VIEWER = toUserId("u-viewer");
const OTHER = toUserId("u-other");

const ownerFields = {
  userId: OWNER,
  phone: "+48 600 100 200",
  emailContact: "owner@example.com",
  instagram: "owner_ig",
  phoneCheckinConfirmed: true,
};

describe("contact-access-policy / canSeeContactField", () => {
  it("owner sees their own field regardless of permissions", () => {
    const dec = canSeeContactField(
      "phone",
      OWNER,
      OWNER,
      defaultContactFieldPermissions(),
      { isFriend: false, acceptedContactRequest: null },
    );
    expect(dec).toEqual({ allowed: true, reason: "owner" });
  });

  it("stranger with no relationship is denied", () => {
    const dec = canSeeContactField(
      "phone",
      OWNER,
      VIEWER,
      defaultContactFieldPermissions(),
      { isFriend: false, acceptedContactRequest: null },
    );
    expect(dec).toEqual({ allowed: false, reason: "stranger" });
  });

  it("friend with permission.friends ON is allowed", () => {
    const perm = defaultContactFieldPermissions();
    perm.phone.friends = true;
    const dec = canSeeContactField("phone", OWNER, VIEWER, perm, {
      isFriend: true,
      acceptedContactRequest: null,
    });
    expect(dec.allowed).toBe(true);
  });

  it("friend with permission.friends OFF is denied", () => {
    const dec = canSeeContactField(
      "phone",
      OWNER,
      VIEWER,
      defaultContactFieldPermissions(),
      { isFriend: true, acceptedContactRequest: null },
    );
    expect(dec.allowed).toBe(false);
  });

  it("approved request without permission.approved is denied (double gate)", () => {
    const perm = defaultContactFieldPermissions();
    perm.phone.approved = false;
    const rel: RelationshipSignal = {
      isFriend: false,
      acceptedContactRequest: { approvedFields: ["phone"] },
    };
    const dec = canSeeContactField("phone", OWNER, VIEWER, perm, rel);
    expect(dec.allowed).toBe(false);
    expect(dec.reason).toBe("permission_off");
  });

  it("approved request + permission.approved ON is allowed", () => {
    const perm = defaultContactFieldPermissions();
    perm.phone.approved = true;
    const rel: RelationshipSignal = {
      isFriend: false,
      acceptedContactRequest: { approvedFields: ["phone"] },
    };
    const dec = canSeeContactField("phone", OWNER, VIEWER, perm, rel);
    expect(dec).toEqual({ allowed: true, reason: "approved_request" });
  });
});

describe("contact-access-policy / buildVisibleContactFields", () => {
  it("returns zero fields for a stranger (PUBLIC DTO ZERO PII property)", () => {
    const dto = buildVisibleContactFields(
      OWNER,
      VIEWER,
      ownerFields,
      defaultContactFieldPermissions(),
      { isFriend: false, acceptedContactRequest: null },
    );
    expect(dto.fields).toEqual({});
    expect("phone" in dto.fields).toBe(false);
    expect("emailContact" in dto.fields).toBe(false);
  });

  it("owner viewing themselves sees every populated field", () => {
    const dto = buildVisibleContactFields(
      OWNER,
      OWNER,
      ownerFields,
      defaultContactFieldPermissions(),
      { isFriend: false, acceptedContactRequest: null },
    );
    expect(dto.fields.phone).toBe(ownerFields.phone);
    expect(dto.fields.emailContact).toBe(ownerFields.emailContact);
  });

  it("only the approved-and-permitted fields are returned for an accepted request", () => {
    const perm = defaultContactFieldPermissions();
    perm.phone.approved = true;
    perm.emailContact.approved = true;
    perm.instagram.approved = false;
    const rel: RelationshipSignal = {
      isFriend: false,
      acceptedContactRequest: {
        approvedFields: ["phone", "instagram"],
      },
    };
    const dto = buildVisibleContactFields(OWNER, VIEWER, ownerFields, perm, rel);
    expect(dto.fields.phone).toBe(ownerFields.phone);
    expect(dto.fields.instagram).toBeUndefined();
    expect(dto.fields.emailContact).toBeUndefined();
  });
});

describe("contact-access-policy / request lifecycle", () => {
  it("blocks self-request", () => {
    expect(isSelfRequest(OWNER, OWNER)).toBe(true);
    expect(isSelfRequest(OWNER, VIEWER)).toBe(false);
  });

  it("only receiver can respond to a pending request", () => {
    expect(
      canRespondToContactRequest(
        { toUserId: OWNER, status: "pending" },
        OWNER,
      ),
    ).toBe(true);
    expect(
      canRespondToContactRequest(
        { toUserId: OWNER, status: "pending" },
        VIEWER,
      ),
    ).toBe(false);
  });

  it("cannot respond to a non-pending request", () => {
    expect(
      canRespondToContactRequest(
        { toUserId: OWNER, status: "accepted" },
        OWNER,
      ),
    ).toBe(false);
  });

  it("blocks duplicate pending or accepted same-direction requests", () => {
    expect(
      isDuplicatePendingRequest(VIEWER, OWNER, [
        { fromUserId: VIEWER, toUserId: OWNER, status: "pending" },
      ]),
    ).toBe(true);
    expect(
      isDuplicatePendingRequest(VIEWER, OWNER, [
        { fromUserId: VIEWER, toUserId: OWNER, status: "accepted" },
      ]),
    ).toBe(true);
    expect(
      isDuplicatePendingRequest(VIEWER, OWNER, [
        { fromUserId: VIEWER, toUserId: OWNER, status: "rejected" },
      ]),
    ).toBe(false);
    expect(
      isDuplicatePendingRequest(VIEWER, OWNER, [
        { fromUserId: OTHER, toUserId: OWNER, status: "pending" },
      ]),
    ).toBe(false);
  });

  it("rejects unknown approved fields (closed enum)", () => {
    expect(isApprovedFieldsValid(["phone", "linkedin"])).toBe(true);
    expect(isApprovedFieldsValid(["phone", "github"])).toBe(false);
    expect(isApprovedFieldsValid([])).toBe(true);
  });
});
