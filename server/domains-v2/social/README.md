# social

Status: `BACKEND_PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

> Runtime justification: the Kontakty slice
> (`feat/contacts-v2-clean-room-slice`) ships
> `social-contacts-{service,policy,ports,store,dto}.ts` for friendships,
> address-book and specialists. Persistence is in-memory only; a Supabase
> adapter is NOT in this slice. See
> `docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md`.

## Purpose
Owns the social graph — friends, contacts, and relationship state.

## Owns
- Friends (mutual `friendship.accepted`)
- Address-book entries (one-sided owner bookmarks)
- Specialist entries (one-sided owner bookmarks)
- Friend-request lifecycle (pending / accepted / rejected / cancelled)
- Relationship signals consumed by `identity/contact-access` via the
  `RelationshipSignalResolver` injected at application-v2 wiring time.

## Does NOT own
- Profile PII
- Posts
- Feed engine

## Public surface
- `public-api.ts`:
  - `createSocialContactsService` (legacy contacts slice surface)
  - `createSocialRelationshipService` (Slice 19 friendship + blocking flow)
  - in-memory repositories for both surfaces
  - policy + DTO contracts with no PII
- `contracts.ts` (cross-domain social relationship contract)
- `events.ts` (typed event payloads for notifications mapping)

## Internal modules (not importable by other domains)
- repository, service, policy, router, mapper, db, schema, cache-keys, internal

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
