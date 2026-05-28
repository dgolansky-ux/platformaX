-- media — allow statusPhoto purpose on media_assets
-- POST-STEP_47 / fix/point-zero-foundation-audit-blockers
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         Committed for future Supabase wiring under STORAGE_ADAPTER_ENV_REQUIRED.
--
-- Background
--   Runtime (media domain) accepts purpose values: 'avatar', 'banner',
--   'statusPhoto'. The original migration 0002_media_assets.sql constrained
--   `purpose` to ('avatar', 'banner') only — when statusPhoto support was added
--   to the runtime (STEP_47) the CHECK constraint was not extended, so a real
--   write of a statusPhoto asset would fail at the DB boundary.
--
-- Effect
--   Forward-additive: extends the allowed enum to include 'statusPhoto'.
--   Existing rows are unaffected; no data migration is required. PostgreSQL has
--   no in-place "extend CHECK" — the equivalent is DROP + ADD of the same
--   constraint name, which is what this migration does. No column drops, no
--   data loss, no destructive operation.
--
-- Rollback plan
--   ALTER TABLE media_assets DROP CONSTRAINT media_assets_purpose_check;
--   ALTER TABLE media_assets ADD CONSTRAINT media_assets_purpose_check
--     CHECK (purpose IN ('avatar', 'banner'));
--   (Safe only if no statusPhoto rows exist; otherwise the new constraint
--   would fail validation.)

ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_purpose_check;

ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_purpose_check
  CHECK (purpose IN ('avatar', 'banner', 'statusPhoto'));
