-- Channels Slice 8: channel posts draft schema.
-- Forward-only. No db push in this task.

create table if not exists content_channel_posts (
  id text primary key,
  channel_id text not null,
  author_user_id text not null,
  body text not null,
  media_refs jsonb not null default '[]'::jsonb,
  status text not null check (status in ('draft', 'published', 'edited', 'deactivated')),
  pinned boolean not null default false,
  pinned_at timestamptz,
  pinned_by_user_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_content_channel_posts_channel_status_created
  on content_channel_posts (channel_id, status, created_at desc, id desc);

create index if not exists idx_content_channel_posts_channel_pinned
  on content_channel_posts (channel_id, pinned)
  where pinned = true and status <> 'deactivated';

create index if not exists idx_content_channel_posts_author
  on content_channel_posts (author_user_id);

create index if not exists idx_content_channel_posts_created
  on content_channel_posts (created_at desc, id desc);

create unique index if not exists uniq_content_channel_posts_one_pinned
  on content_channel_posts (channel_id)
  where pinned = true and status <> 'deactivated';
