-- application runtime — transactional outbox + idempotency keys
-- RUNTIME_INVARIANTS_CODE_ALIGNMENT / chore/runtime-invariants-code-alignment
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         Committed for future Supabase wiring. No live db push.
--
-- Rules: PX-EVENT-002 (transactional outbox), PX-IDEMPOTENCY-001 (idempotency
--        table), ADR-009, ADR-015.
--
-- Notes for the future operator:
--   * Forward-additive DDL only (CREATE / ENABLE RLS). No destructive operations,
--     no permissive RLS placeholders.
--   * The outbox row MUST be written in the SAME transaction as the source-of-truth
--     write (PX-EVENT-002). A worker dispatches pending rows asynchronously.
--   * `status` CHECK mirrors the OutboxStatus / IdempotencyStatus unions in
--     server/application-v2/runtime/{outbox,idempotency}.ts.
--   * Payload is PII-free by contract (events carry only stable identifiers).

CREATE TABLE IF NOT EXISTS outbox_messages (
  id               uuid PRIMARY KEY,
  event_id         uuid NOT NULL,
  type             text NOT NULL,
  version          integer NOT NULL DEFAULT 1,
  occurred_at      timestamptz NOT NULL,
  actor_id         uuid,
  payload          jsonb NOT NULL,
  idempotency_key  text,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'dispatched', 'failed')),
  attempts         integer NOT NULL DEFAULT 0,
  last_error       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  dispatched_at    timestamptz
);

-- Pending-dispatch scan in stable order (status, created_at, id tie-breaker).
CREATE INDEX IF NOT EXISTS outbox_messages_pending_idx
  ON outbox_messages (created_at, id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS outbox_messages_type_idx
  ON outbox_messages (type, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  scope         text NOT NULL,
  key           text NOT NULL,
  request_hash  text NOT NULL,
  response_hash text,
  status        text NOT NULL DEFAULT 'reserved'
                CHECK (status IN ('reserved', 'completed', 'failed', 'expired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  PRIMARY KEY (scope, key)
);

-- Expiry sweep support.
CREATE INDEX IF NOT EXISTS idempotency_keys_expires_at_idx
  ON idempotency_keys (expires_at);

-- RLS enabled with NO policy yet: both tables fail closed (no rows readable
-- through the API) until the Supabase adapter and policies are reviewed.
ALTER TABLE outbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
