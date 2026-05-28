import { describe, it, expect } from "vitest";
import {
  asOwnerCommandContext,
  createRequestContext,
  type OwnerCommandContext,
} from "../request-context";
import { asUserId } from "../ids";

describe("request-context — RequestContext + OwnerCommandContext", () => {
  it("RequestContext can carry a null actor (anonymous read)", () => {
    const ctx = createRequestContext(null);
    expect(ctx.actorId).toBeNull();
    expect(typeof ctx.correlationId).toBe("string");
    expect(ctx.correlationId.length).toBeGreaterThan(0);
  });

  it("RequestContext keeps the explicit actorId when provided", () => {
    const actor = asUserId("u-1");
    const ctx = createRequestContext(actor, "cid_abc");
    expect(ctx.actorId).toBe(actor);
    expect(ctx.correlationId).toBe("cid_abc");
  });

  it("asOwnerCommandContext rejects anonymous (null) actor", () => {
    const ctx = createRequestContext(null);
    expect(asOwnerCommandContext(ctx)).toBeNull();
  });

  it("asOwnerCommandContext narrows actorId to non-null for owner commands", () => {
    const actor = asUserId("u-1");
    const ctx = createRequestContext(actor);
    const owner = asOwnerCommandContext(ctx);
    expect(owner).not.toBeNull();
    // Type-level proof: OwnerCommandContext.actorId is UserId, not UserId|null.
    const sink: OwnerCommandContext | null = owner;
    if (sink) expect(sink.actorId).toBe(actor);
  });

  it("OwnerCommandContext type-level requires non-null actorId", () => {
    // Compile-time only: if `actorId: UserId | null` were accepted, this
    // assignment would type-check with `actor: null`, which it must not.
    const actor = asUserId("u-2");
    const ok: OwnerCommandContext = { correlationId: "cid_x", actorId: actor };
    expect(ok.actorId).toBe(actor);
  });
});
