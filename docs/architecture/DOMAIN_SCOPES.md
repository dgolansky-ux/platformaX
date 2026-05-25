# PlatformaX V2 — Domain Scopes

Detailed scope definitions for each domain, clarifying what each domain owns and what it explicitly does NOT own.

## Owner domains

### identity
- **Owns:** profile, auth subject, public/private profile DTO, professions
- **Does NOT own:** feed, friendships, communities, posts
- **Reads from:** (none at scaffold stage)
- **Publishes events:** (to be defined)

### social
- **Owns:** friends/contact graph, relationship state, contact access
- **Does NOT own:** profile PII, posts, feed engine
- **Reads from:** identity (public-api)
- **Publishes events:** (to be defined)

### communities-v2
- **Owns:** community profile, members, roles, settings, invites, join requests, feed settings
- **Does NOT own:** posts, comments, chat, events, modules
- **Reads from:** identity (public-api), social (public-api)
- **Publishes events:** (to be defined)

### content-v2
- **Owns:** posts, feeds, comments, reactions, topics, read-models
- **Does NOT own:** memberships, roles, profiles, friendships
- **Submodules:** posts, feeds, comments, reactions, topics, read-models, publisher
- **Note:** publisher is application orchestration, not data domain
- **Reads from:** identity (public-api), communities-v2 (public-api)
- **Publishes events:** (to be defined)

### channels
- **Owns:** channel definitions, channel memberships, channel settings
- **Does NOT own:** messages, chat history, community roles
- **Reads from:** communities-v2 (public-api)
- **Publishes events:** (to be defined)

### chat
- **Owns:** messages, conversations, read state, typing indicators
- **Does NOT own:** channels, community roles, profiles
- **Reads from:** channels (public-api), identity (public-api)
- **Publishes events:** (to be defined)

### events
- **Owns:** event definitions, RSVPs, event lifecycle, event visibility
- **Does NOT own:** community membership, profiles, posts
- **Reads from:** identity (public-api), communities-v2 (public-api)
- **Publishes events:** (to be defined)

### modules
- **Owns:** ModuleDefinition, registry, enablement
- **Does NOT own:** actual module business data
- **Reads from:** communities-v2 (public-api)
- **Publishes events:** (to be defined)

### media
- **Owns:** media assets, upload contracts, validation, refs
- **Does NOT own:** base64/dataUrl payloads (FORBIDDEN)
- **Reads from:** identity (public-api)
- **Publishes events:** (to be defined)

## Composition domains

### public-hub
- **Owns:** composition/read view of public profiles and communities
- **Does NOT own:** source-of-truth data
- **Reads from:** identity (public-api), communities-v2 (public-api), content-v2 (public-api)
- **Publishes events:** (none — read-only composition)

## Operational domains

### notifications
- **Owns:** notification delivery, templates, preferences
- **Does NOT own:** content creation, profiles
- **Reads from:** identity (public-api), communities-v2 (events)

### search
- **Owns:** search indexing, query engine, relevance
- **Does NOT own:** source data
- **Reads from:** All domains (events/public-api for indexing)

### moderation
- **Owns:** moderation rules, reports, actions, queues
- **Does NOT own:** content creation
- **Reads from:** content-v2 (events), communities-v2 (events)

### audit
- **Owns:** audit log, trail, events
- **Does NOT own:** business logic
- **Reads from:** All domains (events for audit trail)

### system
- **Owns:** health, config, feature flags, maintenance
- **Does NOT own:** domain data
- **Reads from:** (internal system metrics)
