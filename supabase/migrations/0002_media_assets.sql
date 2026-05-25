-- media — profile media assets (avatar/banner)
-- STEP_32 / feat/media-avatar-banner-runtime
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         Committed for future Supabase wiring under STORAGE_ADAPTER_ENV_REQUIRED.
--
-- Notes for the future operator:
--   * Forward-additive DDL only (CREATE / ENABLE RLS). No destructive operations,
--     no permissive RLS placeholders.
--   * Raw bytes are NEVER stored in this table — only metadata + a storage path.
--     Inline-encoded payloads are forbidden (see ADR-006).
--   * The public projection must select only public-safe columns
--     (no owner_id, no storage_path, no provider, no size_bytes).

CREATE TABLE IF NOT EXISTS media_assets (
  id              uuid PRIMARY KEY,
  owner_type      text NOT NULL DEFAULT 'user'
                  CHECK (owner_type IN ('user')),
  owner_id        uuid NOT NULL,
  purpose         text NOT NULL
                  CHECK (purpose IN ('avatar', 'banner')),
  provider        text NOT NULL,
  storage_path    text NOT NULL,
  public_url      text,
  cdn_url         text,
  mime_type       text NOT NULL
                  CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes      bigint NOT NULL,
  width           integer,
  height          integer,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'ready', 'failed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_owner_purpose_idx
  ON media_assets (owner_id, purpose);

CREATE INDEX IF NOT EXISTS media_assets_updated_at_idx
  ON media_assets (updated_at DESC);

-- RLS is enabled with NO policy yet: it fails closed (no rows readable through
-- the API) until the Supabase adapter is wired and policies are reviewed against
-- the media domain policy module.
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
