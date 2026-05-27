/**
 * Transactional outbox — contracts + in-memory reference adapter.
 *
 * Rules: PX-EVENT-002 (outbox row written in the same TX as the source write),
 * PX-CURSOR-001 (listPending uses opaque cursor, not offset). This is a
 * split-ready skeleton: contracts + a deterministic in-memory adapter for tests.
 * It is NOT wired into real publish flows yet, and there is no live DB.
 */
import type { EventEnvelope } from "@shared/contracts/event-envelope";
import { asOutboxMessageId, type OutboxMessageId } from "@shared/contracts/ids";
import {
  decodeOpaqueCursor,
  encodeOpaqueCursor,
} from "@shared/contracts/cursor";

export type OutboxStatus = "pending" | "dispatched" | "failed";

/** Persisted outbox row (internal). Mirrors the 0004 migration shape. */
export interface OutboxMessageRecord {
  id: OutboxMessageId;
  /** EventEnvelope.id of the source event. */
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  actorId: string | null;
  payload: Record<string, unknown>;
  idempotencyKey: string | null;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  dispatchedAt: string | null;
}

/** Transport-safe projection — never exposes payload internals or lastError. */
export interface OutboxMessageDTO {
  id: OutboxMessageId;
  type: string;
  status: OutboxStatus;
  occurredAt: string;
  createdAt: string;
  dispatchedAt: string | null;
}

export interface ListPendingResult {
  items: OutboxMessageRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OutboxRepository {
  append(message: OutboxMessageRecord): Promise<void>;
  markDispatched(id: OutboxMessageId, now: string): Promise<void>;
  markFailed(id: OutboxMessageId, reason: string, now: string): Promise<void>;
  listPending(limit: number, cursor?: string | null): Promise<ListPendingResult>;
}

export interface CreateOutboxMessageDeps {
  generateId?: () => string;
  now?: () => Date;
}

function defaultId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `obx_${Date.now().toString(36)}_${Math.floor(Math.random() * 0xffffff).toString(16)}`;
}

export function createOutboxMessageFromEnvelope(
  envelope: EventEnvelope<string, Record<string, unknown>>,
  deps: CreateOutboxMessageDeps = {},
): OutboxMessageRecord {
  const createdAt = (deps.now ? deps.now() : new Date()).toISOString();
  const id = asOutboxMessageId(deps.generateId ? deps.generateId() : defaultId());
  return {
    id,
    eventId: envelope.id,
    type: envelope.type,
    version: envelope.version,
    occurredAt: envelope.occurredAt,
    actorId: envelope.actorId,
    payload: envelope.payload,
    idempotencyKey: envelope.idempotencyKey,
    status: "pending",
    attempts: 0,
    lastError: null,
    createdAt,
    dispatchedAt: null,
  };
}

export function toOutboxMessageDTO(record: OutboxMessageRecord): OutboxMessageDTO {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    occurredAt: record.occurredAt,
    createdAt: record.createdAt,
    dispatchedAt: record.dispatchedAt,
  };
}

const DEFAULT_MAX_LIMIT = 100;

/**
 * Deterministic in-memory outbox for tests / local composition. Pending rows are
 * returned in stable (createdAt, id) order with opaque-cursor pagination.
 */
export function createInMemoryOutboxRepository(
  maxLimit = DEFAULT_MAX_LIMIT,
): OutboxRepository {
  const rows = new Map<string, OutboxMessageRecord>();

  return {
    async append(message) {
      rows.set(message.id, { ...message });
    },

    async markDispatched(id, now) {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, status: "dispatched", dispatchedAt: now });
    },

    async markFailed(id, reason, now) {
      const row = rows.get(id);
      if (row) {
        rows.set(id, {
          ...row,
          status: "failed",
          lastError: reason,
          attempts: row.attempts + 1,
          dispatchedAt: row.dispatchedAt ?? now,
        });
      }
    },

    async listPending(limit, cursor) {
      const cap = Math.min(Math.max(1, limit), maxLimit);
      const pending = [...rows.values()]
        .filter((r) => r.status === "pending")
        .sort((a, b) =>
          a.createdAt === b.createdAt
            ? a.id.localeCompare(b.id)
            : a.createdAt.localeCompare(b.createdAt),
        );

      let startIdx = 0;
      if (cursor) {
        const decoded = decodeOpaqueCursor(cursor);
        if (decoded.ok) {
          const { lastId, lastRank } = decoded.value;
          startIdx = pending.findIndex(
            (r) => r.createdAt === lastRank && r.id === lastId,
          );
          startIdx = startIdx < 0 ? 0 : startIdx + 1;
        }
      }

      const slice = pending.slice(startIdx, startIdx + cap);
      const hasMore = startIdx + cap < pending.length;
      const last = slice[slice.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeOpaqueCursor({ lastId: last.id, lastRank: last.createdAt })
          : null;
      return { items: slice, nextCursor, hasMore };
    },
  };
}
