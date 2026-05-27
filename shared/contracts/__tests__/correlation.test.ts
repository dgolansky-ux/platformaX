import { describe, it, expect } from "vitest";
import {
  createCorrelationId,
  createRequestContext,
  CORRELATION_CONTEXT_SKELETON_READY,
} from "@shared/contracts/correlation";
import { asUserId } from "@shared/contracts/ids";

describe("correlation context", () => {
  it("uses the injected id generator deterministically", () => {
    expect(createCorrelationId(() => "fixed")).toBe("fixed");
  });

  it("generates a non-empty id without an injected generator", () => {
    const id = createCorrelationId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("builds a RequestContext with explicit actor and correlation id", () => {
    const ctx = createRequestContext(asUserId("u-1"), "cid-1");
    expect(ctx).toEqual({ correlationId: "cid-1", actorId: "u-1" });
  });

  it("allows an anonymous actor (null)", () => {
    const ctx = createRequestContext(null, "cid-2");
    expect(ctx.actorId).toBeNull();
  });

  it("exposes the skeleton-ready marker (honest scope)", () => {
    expect(CORRELATION_CONTEXT_SKELETON_READY).toBe("CORRELATION_CONTEXT_SKELETON_READY");
  });
});
