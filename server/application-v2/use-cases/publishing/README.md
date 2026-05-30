# application-v2/use-cases/publishing — Slice 17

Status: PUBLISHING_CORE_READY (FOUNDATION_READY for `friend_feed`, `community_*`,
`channel`, `workplace`; TARGET_PARTIAL for `important_event` and
`profile_presentation` until those domains land in V2).

## What this layer does

Unified publishing facade across every V2 publishable surface. It does NOT
own any data and does NOT replace per-target use-cases. It does three things:

1. **Target Publishing Registry** (`registry.ts`) — enumerates every target
   the viewer is allowed to publish to (or sees with a truthful blocked
   reason). Backs the UI's `TargetSelector`.
2. **`buildPublishingPreview`** (`preview.ts`) — builds the read-only,
   PII-free preview the composer renders before publish.
3. **`publish(command)` dispatcher** (`service.ts`) — routes a unified
   `PublishingCommand` to the matching per-target use-case
   (`friend-feed`, `community-feeds`, `channel-content`, `workplace-feed`,
   important-event partial, profile-presentation partial). Result is packed
   into the unified `PublishingResult` envelope. Idempotency is enforced via
   `idempotencyKey` (LRU; underlying domains also enforce persistence-level
   invariants).

## Boundaries

- Only imports `public-api` of each domain / use-case it orchestrates.
- Returns view-safe DTOs only (no raw records, no PII).
- No god-service — per-target logic stays in its own file under `targets/`.
- No deploys, no schema writes, no transport.

## What's still partial

- `important_event` target: backend domain not yet present in V2 →
  registry returns `status: partial`, `blockedReason: backend_not_ready_v2`;
  dispatcher returns truthful `partial` result. UI must render the
  partial composer state, not pretend the post saved.
- `profile_presentation` target: same gap, same truthful contract.

## Tests

See `__tests__/`:
- `registry.test.ts` — owner sees friend feed; community member/staff see
  the right community feeds; channel lead vs non-lead; workplace owner;
  stranger sees no private targets; partial targets carry truthful reason.
- `service.test.ts` — dispatcher routes correctly to each target;
  idempotency dedupes the same key; empty body rejected; important_event /
  profile_presentation return `partial` status.
