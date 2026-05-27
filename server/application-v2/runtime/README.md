# application-v2 / runtime

Status: `PARTIAL`

Split-ready runtime infrastructure shared across application use-cases.
Governance: `docs/governance/RULES_REGISTRY.yml` (PX-EVENT-002, PX-IDEMPOTENCY-001, PX-CURSOR-001).

## Modules

- `outbox.ts` — transactional outbox contracts (`OutboxRepository`,
  `OutboxMessageRecord`, `OutboxMessageDTO`), `createOutboxMessageFromEnvelope`,
  and a deterministic in-memory adapter. Per PX-EVENT-002 the outbox row is
  written in the same DB transaction as the source write; a worker dispatches
  pending rows asynchronously. `listPending` uses an opaque cursor (PX-CURSOR-001).
- `idempotency.ts` — idempotency contracts (`IdempotencyRepository`,
  `IdempotencyRecord`) and an in-memory adapter for create/publish/upload/finalize
  retries (PX-IDEMPOTENCY-001).

## Scope (honest evidence)

- Contracts + in-memory reference adapters + tests exist.
- Migration as code: `supabase/migrations/0004_runtime_outbox_idempotency.sql`
  (not applied — no live db push).
- NOT wired into real publish/upload flows yet; no live DB; no worker process.
  Full transactional-outbox runtime remains a manual gate.
