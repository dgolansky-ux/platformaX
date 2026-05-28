/**
 * Request context contracts — owner/viewer/authority model.
 *
 * Rules: PX-OWN-001 / PX-OWN-002 / PX-OBS-003.
 *
 * Every public boundary that performs a write or an owner-gated read MUST
 * receive an explicit context that names the actor and the correlation id.
 * Owner-gated commands additionally require a non-null `actorId` so the
 * service cannot silently process anonymous writes.
 *
 * `RequestContext` is the umbrella shape (anonymous reads allowed).
 * `OwnerCommandContext` is the strict shape (anonymous writes forbidden).
 *
 * Naming convention enforced by `check-owner-viewer-authority-boundary.mjs`:
 *   - `actorId` / `currentUserId` / `ownerUserId` — the authority performing
 *     the action.
 *   - `viewerUserId` — explicitly viewing (read paths).
 *   - `profileUserId` — the profile being read.
 *
 * This module re-exports the shared `RequestContext` shape from
 * `./correlation` so call sites have a single import path. The two files
 * remain split because correlation also owns the correlation-id generator.
 */
import type { UserId } from "./ids";
import {
  type RequestContext,
  createRequestContext,
  createCorrelationId,
} from "./correlation";

export type { RequestContext };
export { createCorrelationId, createRequestContext };

/**
 * Strict context for owner-gated write commands.
 *
 * Differs from `RequestContext`:
 *  - `actorId` is **non-null** — the use-case rejects anonymous writes at
 *    the type level (no `if (!actorId)` runtime branch needed).
 *
 * Example:
 *   updateMyProfile(ctx: OwnerCommandContext, patch: UpdatePrivateProfileInput)
 */
export interface OwnerCommandContext {
  correlationId: string;
  /** Authority that issued the command. Never null on owner-gated writes. */
  actorId: UserId;
}

/**
 * Promote an anonymous-capable `RequestContext` into an `OwnerCommandContext`
 * after the authority check. Returns null when the caller is anonymous so
 * the boundary can short-circuit with `UNAUTHENTICATED` without ad-hoc
 * branching.
 */
export function asOwnerCommandContext(
  ctx: RequestContext,
): OwnerCommandContext | null {
  if (!ctx.actorId) return null;
  return { correlationId: ctx.correlationId, actorId: ctx.actorId };
}
