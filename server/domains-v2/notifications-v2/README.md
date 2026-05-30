# notifications-v2

Status: `BACKEND_PARTIAL`
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose

In-app Activity Center + notification settings foundation. Owns notification records,
read/unread/archive lifecycle, per-category in-app settings and the **event registry**
that records which product events create notifications and to whom.

## Owns

- Notification records (recipient, actor ref, type, category, source ref, status, dedupe).
- Per-user in-app notification settings per category.
- Event registry (decision table: createsNotification yes/no per product event).
- Unread count read-model.

## Does NOT own

- Email delivery, push delivery, mobile-native delivery.
- Source content (post bodies, comment bodies, raw event payloads).
- AI ranking / priority scoring.
- Global activity feed.
- Source-domain internals (it imports nothing from other domains).

## Public surface

- `public-api.ts`
- `contracts.ts`
- `events.ts` (consumer-only; the domain does NOT publish events)
- `event-registry.ts` (decision table)
- `dto.ts`

## Internal modules (not importable cross-domain)

- `service.ts`, `store.ts`, `ports.ts`, `mapper.ts`, `policy.ts`

## Runtime justification

`BACKEND_PARTIAL`: in-memory repository ships; durable adapter pending.
`OUTBOX_SKELETON`: notifications consume application-v2 mappings; full outbox/worker
runtime is not wired this slice.

## Canonical governance

- [Rules Registry](../../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none.
