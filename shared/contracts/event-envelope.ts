/**
 * EventEnvelope — standard shape for cross-domain and outbox events.
 *
 * Rule: PX-EVENT-001 (ADR-009 — event envelope + transactional outbox).
 * Every real domain event carries id/type/version/occurredAt/actorId/payload/
 * idempotencyKey. Payloads must be PII-free; consumers call the owning domain's
 * public API if they need private data.
 */
import type { UserId } from "./ids";
import { createUuid } from "./uuid";

export interface EventEnvelope<
  Type extends string,
  Payload extends Record<string, unknown>,
> {
  id: string;
  type: Type;
  version: number;
  occurredAt: string;
  actorId: UserId | null;
  payload: Payload;
  idempotencyKey: string | null;
}

export interface CreateEventEnvelopeInput<
  Type extends string,
  Payload extends Record<string, unknown>,
> {
  type: Type;
  /** Schema version of this event type. Defaults to 1. */
  version?: number;
  actorId: UserId | null;
  payload: Payload;
  idempotencyKey?: string | null;
  /** Explicit ISO timestamp. When omitted, `deps.now()` is used. */
  occurredAt?: string;
  /** Explicit id. When omitted, `deps.generateId()` is used. */
  id?: string;
}

export interface EventEnvelopeDeps {
  /** Injected id generator. Falls back to crypto.randomUUID when absent. */
  generateId?: () => string;
  /** Injected clock. Falls back to system time when absent. */
  now?: () => Date;
}

/**
 * Default id generator — UUID-formatted, aligned with the
 * `outbox_messages.event_id uuid` column type in supabase/migrations.
 * Callers may inject `deps.generateId` (tests use deterministic UUID fixtures).
 */
function defaultGenerateId(): string {
  return createUuid();
}

export function createEventEnvelope<
  Type extends string,
  Payload extends Record<string, unknown>,
>(
  input: CreateEventEnvelopeInput<Type, Payload>,
  deps: EventEnvelopeDeps = {},
): EventEnvelope<Type, Payload> {
  const occurredAt =
    input.occurredAt ?? (deps.now ? deps.now() : new Date()).toISOString();
  const id = input.id ?? (deps.generateId ? deps.generateId() : defaultGenerateId());
  return {
    id,
    type: input.type,
    version: input.version ?? 1,
    occurredAt,
    actorId: input.actorId,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey ?? null,
  };
}
