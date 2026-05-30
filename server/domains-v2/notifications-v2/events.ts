/**
 * notifications-v2 — events surface.
 *
 * notifications-v2 does NOT publish domain events of its own (it is the
 * terminal sink: events flow IN from source domains via application-v2
 * mappers). This module exposes the typed shape application-v2 uses to feed
 * the domain — and a small marker so cross-domain readers can confirm that
 * the notifications layer is consumer-only by design.
 *
 * Status: OUTBOX_SKELETON — outbox/worker runtime is not wired in Slice 14.
 */

export interface NotificationCreationRequest {
  /** Stable id of the upstream event that drove this create. */
  upstreamEventId: string;
  /** Optional correlation id propagated end-to-end. */
  correlationId: string | null;
  /** Dedupe key the consumer should pass to the service to guarantee idempotency. */
  dedupeKey: string | null;
}

export type NotificationsDomainEvent = never;
