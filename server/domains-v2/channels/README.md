# channels

Status: `BACKEND_PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Runtime (BACKEND_PARTIAL)
In-memory runtime: `dto/ports/policy/store/service/mapper/public-api`. A channel
is owned by a community (`ownerType="community"`); following a channel is a
SEPARATE relation from community membership. Community authority is enforced by
the application use-case (via communities public-api) before createChannel —
this domain imports no communities internals. Public DTO has no PII. No
post/feed storage lives here: channel content belongs to `content-v2/channel-posts`
and is orchestrated by `application-v2/use-cases/channel-content`. DB + transport
pending.

Slice 8 adds lead permissions for content: `publish_channel_content`,
`manage_channel_content`, `pin_channel_post`. Slice 9 adds interaction
permissions/settings: `moderate_channel_comments`,
`manage_channel_interactions`, `commentsEnabled`, `reactionsEnabled`, and
`commentPolicy` (`followers` / `community_members` / `leads_only`). Community
founder/admin authority does not bypass these channel lead permissions for
publishing or interaction moderation.

## Purpose
Owns channel definitions, channel memberships, and channel settings.

## Owns
- Channel definitions
- Channel memberships
- Channel settings
- Channel interaction settings and lead permissions

## Does NOT own
- Messages
- Chat history
- Community roles
- Channel post comments/reactions/counts (owned by `content-v2`)

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
