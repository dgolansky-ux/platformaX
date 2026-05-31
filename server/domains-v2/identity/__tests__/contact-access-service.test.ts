import { beforeEach, describe, expect, it } from "vitest";
import {
  createContactAccessService,
  type ContactAccessService,
} from "../contact-access-service";
import {
  createInMemoryContactFieldsRepository,
  createInMemoryContactPermissionsRepository,
  createInMemoryContactRequestsRepository,
} from "../contact-access-store";
import { toUserId } from "@shared/contracts/branded-ids";

const OWNER = toUserId("u-owner");
const SENDER = toUserId("u-sender");
const OTHER = toUserId("u-other");

function makeService(): ContactAccessService {
  let seq = 0;
  return createContactAccessService({
    fields: createInMemoryContactFieldsRepository(),
    permissions: createInMemoryContactPermissionsRepository(),
    requests: createInMemoryContactRequestsRepository(),
    clock: { now: () => new Date("2026-05-29T00:00:00Z") },
    ids: { next: () => `req-${++seq}` },
    friendship: {
      async resolve() {
        return { isFriend: false, acceptedContactRequest: null };
      },
    },
  });
}

describe("contact-access-service / fields + permissions", () => {
  let svc: ContactAccessService;
  beforeEach(() => {
    svc = makeService();
  });

  it("returns an empty owner record when there are no fields yet", async () => {
    const dto = await svc.getMyContactFields(OWNER);
    expect(dto).toEqual({ userId: OWNER, phoneCheckinConfirmed: false });
  });

  it("updateMyContactFields persists owner fields", async () => {
    await svc.updateMyContactFields({
      userId: OWNER,
      phone: "+48 700 800 900",
      emailContact: "owner@example.com",
      phoneCheckinConfirmed: true,
    });
    const dto = await svc.getMyContactFields(OWNER);
    expect(dto.phone).toBe("+48 700 800 900");
    expect(dto.emailContact).toBe("owner@example.com");
    expect(dto.phoneCheckinConfirmed).toBe(true);
  });

  it("getVisibleContactFieldsForViewer returns ZERO PII for a stranger", async () => {
    await svc.updateMyContactFields({ userId: OWNER, phone: "secret-phone" });
    const dto = await svc.getVisibleContactFieldsForViewer(OWNER, SENDER);
    expect(dto.fields).toEqual({});
  });

  it("owner viewing themselves sees every populated field", async () => {
    await svc.updateMyContactFields({
      userId: OWNER,
      phone: "owner-phone",
      linkedin: "owner-linkedin",
    });
    const dto = await svc.getVisibleContactFieldsForViewer(OWNER, OWNER);
    expect(dto.fields.phone).toBe("owner-phone");
    expect(dto.fields.linkedin).toBe("owner-linkedin");
  });
});

describe("contact-access-service / requests", () => {
  let svc: ContactAccessService;
  beforeEach(() => {
    svc = makeService();
  });

  it("blocks self request", async () => {
    const res = await svc.sendContactRequest({
      fromUserId: OWNER,
      toUserId: OWNER,
      message: "hi",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("SELF_REQUEST_NOT_ALLOWED");
  });

  it("blocks duplicate pending in the same direction", async () => {
    await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "first",
    });
    const second = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "second",
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("PENDING_DUPLICATE");
  });

  it("does NOT block the reverse direction: A→B pending leaves B→A allowed", async () => {
    // Intended behaviour (LEGACY_CONTACTS_ANALYSIS §4 row 4): at most one
    // non-terminal request PER DIRECTION. A pending A→B request is about A
    // wanting B's fields; it must not stop B from independently asking A.
    const aToB = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "A asks B",
    });
    expect(aToB.ok).toBe(true);
    const bToA = await svc.sendContactRequest({
      fromUserId: OWNER,
      toUserId: SENDER,
      message: "B asks A",
    });
    expect(bToA.ok).toBe(true);
    if (bToA.ok && aToB.ok) {
      expect(bToA.value.id).not.toBe(aToB.value.id);
      expect(bToA.value.fromUserId).toBe(OWNER);
      expect(bToA.value.toUserId).toBe(SENDER);
    }
  });

  it("only the receiver may respond to a pending request", async () => {
    const created = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    const wrong = await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OTHER,
      action: "rejected",
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.error.code).toBe("NOT_RECEIVER");
  });

  it("respondToContactRequest accepted stores only allowed enum fields", async () => {
    const created = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    const res = await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      action: "accepted",
      approvedFields: ["phone", "linkedin"],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.status).toBe("accepted");
      expect(res.value.approvedFields).toEqual(["phone", "linkedin"]);
    }
  });

  it("rejects unsupported approved fields (closed enum)", async () => {
    const created = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    const res = await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      action: "accepted",
      // @ts-expect-error testing runtime guard with an invalid enum literal
      approvedFields: ["phone", "github"],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNKNOWN_FIELD");
  });

  it("rejected request reveals NO fields", async () => {
    const created = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    const res = await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      action: "rejected",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.status).toBe("rejected");
      expect(res.value.approvedFields).toEqual([]);
    }
  });

  it("returns REQUEST_NOT_PENDING on a second response", async () => {
    const created = await svc.sendContactRequest({
      fromUserId: SENDER,
      toUserId: OWNER,
      message: "please",
    });
    if (!created.ok) throw new Error("setup failed");
    await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      action: "accepted",
      approvedFields: [],
    });
    const second = await svc.respondToContactRequest({
      requestId: created.value.id,
      responderUserId: OWNER,
      action: "rejected",
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("REQUEST_NOT_PENDING");
  });
});
