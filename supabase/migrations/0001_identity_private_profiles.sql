-- identity — private profile persistence
-- STEP_27 / feat/identity-profile-persistence
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         It is committed for future Supabase wiring under
--         BLOCKER_REQUIRES_PERSISTENCE_ADAPTER.
--
-- Notes for the future operator:
--   * Migration uses only forward-additive DDL (CREATE / ALTER ... ENABLE RLS).
--     No destructive operations and no permissive RLS placeholders.
--   * PII columns (phone, date_of_birth) are private; the public projection
--     must never select them into the public-facing API.
--   * Indexes are limited to user_id lookup and recently-updated ordering.

CREATE TABLE IF NOT EXISTS identity_private_profiles (
  user_id           uuid PRIMARY KEY,
  first_name        text,
  last_name         text,
  date_of_birth     date,
  phone             text,
  avatar_asset_id   uuid,
  banner_asset_id   uuid,
  bio               text,
  visibility        text NOT NULL DEFAULT 'public'
                    CHECK (visibility IN ('public', 'friends', 'private')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_private_profiles_updated_at_idx
  ON identity_private_profiles (updated_at DESC);

-- The RLS policy below is a placeholder. When the Supabase adapter is wired,
-- the actual policies must be reviewed against the identity domain policy
-- module before enabling. Until then RLS stays enabled but with no policy,
-- which fails closed (no rows readable through the API).
ALTER TABLE identity_private_profiles ENABLE ROW LEVEL SECURITY;
