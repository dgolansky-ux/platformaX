/**
 * Idempotency — contracts + in-memory reference adapter.
 *
 * Rules: PX-IDEMPOTENCY-001 / PX-IDEMP-001 (ADR-015). Retry-sensitive commands
 * (create/publish/upload/finalize) reserve an idempotency key, then store the
 * result so a replay returns the same outcome. Split-ready skeleton: contracts +
 * a deterministic in-memory adapter for tests. Not wired into real flows; no DB.
 */
import type { IdempotencyKey } from "@shared/contracts/ids";

export type IdempotencyStatus = "reserved" | "completed" | "failed" | "expired";

export interface IdempotencyRecord {
  key: IdempotencyKey;
  /** Operation scope, e.g. "media.confirmUpload" or "identity.completeOnboarding". */
  scope: string;
  requestHash: string;
  responseHash: string | null;
  status: IdempotencyStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface IdempotencyRepository {
  find(key: IdempotencyKey, scope: string): Promise<IdempotencyRecord | null>;
  reserve(
    key: IdempotencyKey,
    scope: string,
    requestHash: string,
    now: string,
    expiresAt: string,
  ): Promise<IdempotencyRecord>;
  storeResult(
    key: IdempotencyKey,
    scope: string,
    responseHash: string,
    status: IdempotencyStatus,
    now: string,
  ): Promise<void>;
  releaseFailed(key: IdempotencyKey, scope: string, now: string): Promise<void>;
}

function compositeKey(key: string, scope: string): string {
  return `${scope}::${key}`;
}

/** Deterministic in-memory idempotency store for tests / local composition. */
export function createInMemoryIdempotencyRepository(): IdempotencyRepository {
  const rows = new Map<string, IdempotencyRecord>();

  return {
    async find(key, scope) {
      return rows.get(compositeKey(key, scope)) ?? null;
    },

    async reserve(key, scope, requestHash, now, expiresAt) {
      const record: IdempotencyRecord = {
        key,
        scope,
        requestHash,
        responseHash: null,
        status: "reserved",
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };
      rows.set(compositeKey(key, scope), record);
      return record;
    },

    async storeResult(key, scope, responseHash, status, now) {
      const existing = rows.get(compositeKey(key, scope));
      if (existing) {
        rows.set(compositeKey(key, scope), {
          ...existing,
          responseHash,
          status,
          updatedAt: now,
        });
      }
    },

    async releaseFailed(key, scope, now) {
      const existing = rows.get(compositeKey(key, scope));
      if (existing) {
        rows.set(compositeKey(key, scope), {
          ...existing,
          status: "failed",
          updatedAt: now,
        });
      }
    },
  };
}
