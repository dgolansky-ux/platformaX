-- identity — personal profile core fields (forward-additive)
-- STEP_47 / feat/personal-profile-core-runtime
--
-- Status: SHIPPED_AS_CODE — this migration is NOT applied automatically.
--         No live db push. It extends `identity_private_profiles` with the
--         non-PII personal-profile columns the runtime uses today only via
--         the in-memory adapter.
--
-- Notes for the future operator:
--   * Only ADD COLUMN IF NOT EXISTS. No destructive operations.
--   * `social_links` is jsonb; the application stores a closed-key map
--     (linkedin, github, instagram, website) — schema enforcement happens
--     in the validation layer, not in a DB constraint, so future link kinds
--     do not require a migration.
--   * `status_visibility` is nullable: NULL means "no active personal status".
--     When status_text is present, status_visibility MUST be non-null
--     (enforced by service-layer validation).
--   * `civil_status` is text with a CHECK constraint that mirrors the
--     identity domain's `CivilStatus` enum.
--   * No precise-address field. `location` is a free-form short city/region.

ALTER TABLE identity_private_profiles
  ADD COLUMN IF NOT EXISTS location              text,
  ADD COLUMN IF NOT EXISTS profile_slug          text,
  ADD COLUMN IF NOT EXISTS status_text           text,
  ADD COLUMN IF NOT EXISTS status_emoji          text,
  ADD COLUMN IF NOT EXISTS status_description    text,
  ADD COLUMN IF NOT EXISTS status_visibility     text
        CHECK (status_visibility IS NULL OR status_visibility IN
              ('public', 'friends_only', 'private')),
  ADD COLUMN IF NOT EXISTS status_photo_asset_id uuid,
  ADD COLUMN IF NOT EXISTS civil_status          text
        CHECK (civil_status IS NULL OR civil_status IN
              ('single', 'in_relationship', 'engaged', 'married',
               'partnered', 'complicated', 'undisclosed')),
  ADD COLUMN IF NOT EXISTS social_links          jsonb;

-- Unique slug when set. Partial index avoids collisions on null.
CREATE UNIQUE INDEX IF NOT EXISTS identity_private_profiles_profile_slug_uidx
  ON identity_private_profiles (profile_slug)
  WHERE profile_slug IS NOT NULL;
