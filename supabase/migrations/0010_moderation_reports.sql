-- Slice 20 — moderation reports + actions (DRAFT, not yet applied).
--
-- Mirrors the in-memory shape from `server/domains-v2/moderation/repository.ts`
-- and `dto.ts`. NOT applied via `db push` — wiring requires the live transport
-- + the auth role model. Reviewed by owner before any apply.

create table if not exists moderation_reports (
  id text primary key,
  reporter_user_id text not null,
  target_type text not null,
  target_id text not null,
  target_owner_user_id text null,
  reason text not null,
  description text null,
  status text not null default 'pending',
  severity text not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_by_user_id text null,
  reviewed_at timestamptz null,
  resolution_note text null
);

create index if not exists idx_moderation_reports_status_created_at
  on moderation_reports (status, created_at desc);
create index if not exists idx_moderation_reports_target
  on moderation_reports (target_type, target_id);
create index if not exists idx_moderation_reports_reporter
  on moderation_reports (reporter_user_id, created_at desc);
create index if not exists idx_moderation_reports_reason
  on moderation_reports (reason);
create index if not exists idx_moderation_reports_severity
  on moderation_reports (severity);
create index if not exists idx_moderation_reports_reviewed_by
  on moderation_reports (reviewed_by_user_id);

-- Optional dedupe index: a single reporter cannot have more than one active
-- pending/under_review report for the same target. The application also
-- enforces this; this constraint is the storage-side belt-and-braces.
create unique index if not exists uniq_moderation_reports_active_pair
  on moderation_reports (reporter_user_id, target_type, target_id)
  where status in ('pending', 'under_review');

create table if not exists moderation_actions (
  id text primary key,
  report_id text not null references moderation_reports(id) on delete cascade,
  actor_moderator_user_id text not null,
  target_type text not null,
  target_id text not null,
  action_type text not null,
  reason_note text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_moderation_actions_report
  on moderation_actions (report_id, created_at);
create index if not exists idx_moderation_actions_actor
  on moderation_actions (actor_moderator_user_id);
create index if not exists idx_moderation_actions_target
  on moderation_actions (target_type, target_id);

-- Notes:
--  - `target_owner_user_id` is informational only — moderator review queue
--    does NOT expose target owner PII through the public-status DTO.
--  - `description` is moderator-only; the public reporter DTO never returns it.
--  - `target_type` / `reason` / `status` / `severity` / `action_type` are
--    enforced at the application layer via the corresponding TypeScript enums
--    (see `server/domains-v2/moderation/contracts.ts`). Postgres-level enums
--    are skipped here so adding a new enum value does not require a migration.
