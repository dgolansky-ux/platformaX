-- media — Slice 18 V2 expansion: purpose + owner + variants + upload intents
-- feat/contacts-v2-clean-room-slice (Slice 18: media upload & asset pipeline)
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         Committed for future Supabase wiring under STORAGE_ADAPTER_ENV_REQUIRED.
--
-- Background
--   The V2 media domain now covers 21 purposes across 8 owner types (profile,
--   community, channel, workplace, event, post, profile_presentation,
--   important_event). It also introduces media variants (skeleton until a real
--   image pipeline is wired) and tracked upload intents (idempotent + expiring).
--   The original migration 0002_media_assets.sql constrained `owner_type` and
--   `purpose` to V1 values; this migration extends them and adds the new
--   variant + upload-intent tables.
--
-- Effect
--   * Forward-additive DDL only (CREATE / ALTER ADD).
--   * Extends the existing `owner_type`, `purpose` and `status` enum CHECKs to
--     accept every V2 value. Existing rows are renamed at the application
--     boundary (`profile_avatar` etc.) — this migration does NOT rewrite legacy
--     data; the application layer is responsible for any backfill.
--   * Adds `owner_user_id`, `original_filename`, `duration_seconds`,
--     `visibility`, `deleted_at` columns on `media_assets`.
--   * New tables: `media_variants`, `media_upload_intents`.
--
-- Rollback plan
--   Drop the new tables and revert the `owner_type` / `purpose` / `status`
--   CHECK constraints to the previous (V1) values. Safe only if no V2-only rows
--   exist; otherwise the legacy constraints would fail validation.

-- ---------- media_assets: V2 columns + enum widening ----------

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS owner_user_id     uuid,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS duration_seconds  integer,
  ADD COLUMN IF NOT EXISTS visibility        text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS deleted_at        timestamptz;

ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_owner_type_check;
ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_owner_type_check
  CHECK (owner_type IN (
    'user_profile',
    'community',
    'channel',
    'workplace',
    'event',
    'post',
    'profile_presentation',
    'important_event'
  ));

ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_purpose_check;
ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_purpose_check
  CHECK (purpose IN (
    'profile_avatar',
    'profile_banner',
    'profile_bio_media',
    'profile_presentation_media',
    'profile_important_event_media',
    'friend_feed_post_media',
    'community_avatar',
    'community_banner',
    'community_post_media',
    'community_staff_post_media',
    'community_relational_post_media',
    'channel_avatar',
    'channel_banner',
    'channel_post_media',
    'workplace_logo',
    'workplace_banner',
    'workplace_post_media',
    'workplace_teaser_media',
    'event_cover',
    'event_gallery',
    'newsletter_message_media'
  ));

ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_status_check;
ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_status_check
  CHECK (status IN (
    'upload_intent_created',
    'uploaded',
    'processing',
    'ready',
    'failed',
    'deleted'
  ));

ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_visibility_check;
ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_visibility_check
  CHECK (visibility IN ('public', 'friends_only', 'members_only', 'owner_only'));

CREATE INDEX IF NOT EXISTS media_assets_owner_type_owner_id_idx
  ON media_assets (owner_type, owner_id);

CREATE INDEX IF NOT EXISTS media_assets_owner_user_id_idx
  ON media_assets (owner_user_id);

CREATE INDEX IF NOT EXISTS media_assets_purpose_idx
  ON media_assets (purpose);

CREATE INDEX IF NOT EXISTS media_assets_status_idx
  ON media_assets (status);

CREATE INDEX IF NOT EXISTS media_assets_created_at_idx
  ON media_assets (created_at DESC);

-- ---------- media_variants ----------

CREATE TABLE IF NOT EXISTS media_variants (
  id               uuid PRIMARY KEY,
  media_asset_id   uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_type     text NOT NULL
                   CHECK (variant_type IN (
                     'original','thumbnail','small','medium','large',
                     'avatar','banner','preview'
                   )),
  width            integer,
  height           integer,
  storage_key      text,
  url              text,
  status           text NOT NULL DEFAULT 'processing_skeleton'
                   CHECK (status IN (
                     'processing_skeleton','processing','ready','failed'
                   )),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_asset_id, variant_type)
);

CREATE INDEX IF NOT EXISTS media_variants_asset_idx
  ON media_variants (media_asset_id);

ALTER TABLE media_variants ENABLE ROW LEVEL SECURITY;

-- ---------- media_upload_intents ----------

CREATE TABLE IF NOT EXISTS media_upload_intents (
  id                   uuid PRIMARY KEY,
  actor_user_id        uuid NOT NULL,
  owner_type           text NOT NULL
                       CHECK (owner_type IN (
                         'user_profile','community','channel','workplace',
                         'event','post','profile_presentation','important_event'
                       )),
  owner_id             uuid NOT NULL,
  purpose              text NOT NULL,
  allowed_mime_types   jsonb NOT NULL,
  max_size_bytes       bigint NOT NULL,
  max_files            integer NOT NULL,
  expires_at           timestamptz NOT NULL,
  status               text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','used','expired','cancelled')),
  idempotency_key      text NOT NULL,
  asset_id             uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  created_at           timestamptz NOT NULL DEFAULT now(),
  used_at              timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS media_upload_intents_idempotency_unique_idx
  ON media_upload_intents (actor_user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS media_upload_intents_actor_status_expires_idx
  ON media_upload_intents (actor_user_id, status, expires_at);

ALTER TABLE media_upload_intents ENABLE ROW LEVEL SECURITY;
