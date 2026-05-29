-- 0005_community_feeds.sql
-- Communities Slice 5 — three community feeds + descendant publishing.
-- STATUS: SCHEMA DRAFT (BACKEND_PARTIAL). The in-memory adapters in
-- content-v2/community-feeds + communities-v2 are the current source of truth;
-- this forward schema is additive-only (no DROP/ALTER DROP) and is NOT pushed
-- by this slice (no db push). A DB adapter implements the same repository ports.
--
-- privacy: no PII columns — author/publisher are user id references only.

-- ── communities-v2: per-community feed settings ────────────────────────────
CREATE TABLE IF NOT EXISTS community_feed_settings (
  community_id                       TEXT PRIMARY KEY,
  community_all_enabled              BOOLEAN NOT NULL DEFAULT TRUE,
  community_all_posting_policy       TEXT    NOT NULL DEFAULT 'all_members',  -- all_members | staff_only
  relational_enabled                 BOOLEAN NOT NULL DEFAULT FALSE,
  relational_monthly_limit           INTEGER NOT NULL DEFAULT 3,              -- 1..10
  staff_only_enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
  descendant_publishing_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  descendant_publishing_roles        TEXT[]  NOT NULL DEFAULT ARRAY['founder','admin'],
  updated_at                         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT relational_limit_range CHECK (relational_monthly_limit BETWEEN 1 AND 10),
  CONSTRAINT posting_policy_valid   CHECK (community_all_posting_policy IN ('all_members','staff_only'))
);

-- ── content-v2: community posts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id                  TEXT PRIMARY KEY,
  author_user_id      TEXT NOT NULL,
  published_by_user_id TEXT NOT NULL,
  body                TEXT NOT NULL,
  media_refs          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status              TEXT NOT NULL DEFAULT 'published',  -- published | deleted
  source_community_id TEXT NOT NULL,
  source_feed_type    TEXT NOT NULL,                      -- community_all | relational | staff_only
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts (author_user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_source ON community_posts (source_community_id);

-- ── content-v2: denormalised per-community feed items (read model) ─────────
CREATE TABLE IF NOT EXISTS community_feed_items (
  id                  TEXT PRIMARY KEY,
  post_id             TEXT NOT NULL,
  community_id        TEXT NOT NULL,
  feed_type           TEXT NOT NULL,                      -- community_all | relational | staff_only
  author_user_id      TEXT NOT NULL,
  published_by_user_id TEXT NOT NULL,
  body                TEXT NOT NULL,
  media_refs          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source_community_id TEXT NOT NULL,
  distribution_id     TEXT,
  status              TEXT NOT NULL DEFAULT 'active',      -- active | deleted
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedupe_key          TEXT NOT NULL,
  month_key           TEXT GENERATED ALWAYS AS (to_char(created_at, 'YYYY-MM')) STORED
);
-- idempotent distribution: one item per (community, feed, distribution|post)
CREATE UNIQUE INDEX IF NOT EXISTS uq_community_feed_items_dedupe ON community_feed_items (dedupe_key);
-- cursor read path: newest-first within one community feed
CREATE INDEX IF NOT EXISTS idx_community_feed_items_feed ON community_feed_items (community_id, feed_type, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_community_feed_items_author ON community_feed_items (author_user_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_items_distribution ON community_feed_items (distribution_id);
CREATE INDEX IF NOT EXISTS idx_community_feed_items_source ON community_feed_items (source_community_id);
-- relational monthly quota count (per community, author, month)
CREATE INDEX IF NOT EXISTS idx_community_feed_items_relational_quota
  ON community_feed_items (community_id, author_user_id, month_key)
  WHERE feed_type = 'relational';

-- ── content-v2: distribution audit trail (optional) ────────────────────────
CREATE TABLE IF NOT EXISTS community_post_distributions (
  id                  TEXT PRIMARY KEY,
  distribution_id     TEXT NOT NULL,
  post_id             TEXT NOT NULL,
  source_community_id TEXT NOT NULL,
  feed_type           TEXT NOT NULL,
  target_count        INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_post_distributions_dist ON community_post_distributions (distribution_id);

-- RLS: enabled by default; concrete policies are added when the DB adapter
-- lands (Slice 5 ships in-memory). No permissive catch-all policies here.
ALTER TABLE community_feed_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feed_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_distributions ENABLE ROW LEVEL SECURITY;
