-- social + contact consent — Slice 19 foundations
-- Status: SHIPPED_AS_CODE (draft migration, not auto-applied)
--
-- Scope:
--   friendships (request + lifecycle)
--   contact_access_requests (requested/approved fields)
--   blocked_users (active block list)
--
-- Notes:
--   - no db push in this slice
--   - no PII in social tables (IDs + metadata only)

CREATE TABLE IF NOT EXISTS friendships (
  id                uuid PRIMARY KEY,
  requester_user_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  status            text NOT NULL
                    CHECK (status IN (
                      'pending',
                      'accepted',
                      'rejected',
                      'cancelled',
                      'removed',
                      'blocked'
                    )),
  created_at        timestamptz NOT NULL,
  responded_at      timestamptz,
  updated_at        timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS friendships_requester_idx
  ON friendships (requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS friendships_recipient_idx
  ON friendships (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS friendships_status_idx
  ON friendships (status);

CREATE TABLE IF NOT EXISTS contact_access_requests (
  id                uuid PRIMARY KEY,
  requester_user_id uuid NOT NULL,
  owner_user_id     uuid NOT NULL,
  requested_fields  jsonb NOT NULL,
  approved_fields   jsonb NOT NULL DEFAULT '[]'::jsonb,
  status            text NOT NULL
                    CHECK (status IN (
                      'pending',
                      'approved',
                      'rejected',
                      'revoked',
                      'cancelled'
                    )),
  message           text,
  created_at        timestamptz NOT NULL,
  responded_at      timestamptz,
  updated_at        timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_access_owner_status_idx
  ON contact_access_requests (owner_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_access_requester_status_idx
  ON contact_access_requests (requester_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS blocked_users (
  id               uuid PRIMARY KEY,
  blocker_user_id  uuid NOT NULL,
  blocked_user_id  uuid NOT NULL,
  reason           text,
  created_at       timestamptz NOT NULL,
  revoked_at       timestamptz,
  CONSTRAINT blocked_users_pair_distinct
    CHECK (blocker_user_id <> blocked_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS blocked_users_unique_active_pair
  ON blocked_users (blocker_user_id, blocked_user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS blocked_users_blocker_idx
  ON blocked_users (blocker_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blocked_users_blocked_idx
  ON blocked_users (blocked_user_id, created_at DESC);
