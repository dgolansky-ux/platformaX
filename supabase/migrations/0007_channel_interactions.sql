-- Channels Slice 9: channel interaction settings, comments and reactions.
-- Forward-only draft. No db push in this task.

create table if not exists channel_interaction_settings (
  channel_id text primary key,
  comments_enabled boolean not null default true,
  reactions_enabled boolean not null default true,
  comment_policy text not null check (comment_policy in ('followers', 'community_members', 'leads_only')),
  moderation_policy text not null check (moderation_policy in ('leads_can_moderate', 'lead_permission_required')),
  updated_at timestamptz not null
);

create table if not exists content_channel_comments (
  id text primary key,
  channel_post_id text not null,
  parent_comment_id text,
  author_user_id text not null,
  body text not null,
  status text not null check (status in ('active', 'edited', 'deactivated')),
  moderation_reason text,
  moderated_by_user_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists idx_content_channel_comments_post_created
  on content_channel_comments (channel_post_id, created_at asc, id asc);

create index if not exists idx_content_channel_comments_author
  on content_channel_comments (author_user_id);

create table if not exists content_channel_reactions (
  id text primary key,
  target_type text not null check (target_type in ('channel_post', 'channel_comment')),
  target_id text not null,
  user_id text not null,
  reaction_type text not null check (reaction_type in ('like')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_content_channel_reactions_target
  on content_channel_reactions (target_type, target_id);

create index if not exists idx_content_channel_reactions_user
  on content_channel_reactions (user_id);

create unique index if not exists uniq_content_channel_reactions_target_user_type
  on content_channel_reactions (target_type, target_id, user_id, reaction_type);

-- Read model skeleton for a future DB adapter. Current runtime computes batch
-- counts in repository methods.
create table if not exists content_channel_interaction_counts (
  target_type text not null check (target_type in ('channel_post', 'channel_comment')),
  target_id text not null,
  comment_count integer not null default 0,
  reaction_counts jsonb not null default '{"like":0}'::jsonb,
  updated_at timestamptz not null,
  primary key (target_type, target_id)
);
