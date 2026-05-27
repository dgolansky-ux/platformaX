/**
 * application-v2/runtime — split-ready runtime infrastructure (skeleton).
 * Status: PARTIAL (contracts + in-memory reference adapters + migration as code;
 * not wired into real publish/upload flows, no live DB).
 *
 * Rules: PX-EVENT-002, PX-IDEMPOTENCY-001, PX-CURSOR-001.
 */
export type {
  OutboxStatus,
  OutboxMessageRecord,
  OutboxMessageDTO,
  ListPendingResult,
  OutboxRepository,
  CreateOutboxMessageDeps,
} from "./outbox";
export {
  createOutboxMessageFromEnvelope,
  toOutboxMessageDTO,
  createInMemoryOutboxRepository,
} from "./outbox";

export type {
  IdempotencyStatus,
  IdempotencyRecord,
  IdempotencyRepository,
} from "./idempotency";
export { createInMemoryIdempotencyRepository } from "./idempotency";
