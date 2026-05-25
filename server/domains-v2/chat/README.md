# chat

Status: `SCAFFOLD_ONLY`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns messaging — conversations, messages, read state, and typing indicators.

## Owns
- Messages
- Conversations
- Read state
- Typing indicators

## Does NOT own
- Channels
- Community roles
- Profiles

## Public surface
- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal
