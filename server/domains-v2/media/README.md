# media

Status: `PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns media assets — upload intents, file validation and stable media references.
Identity (and other domains) store a `MediaAssetRef` and never the file payload.

## Runtime justification (status PARTIAL)
First runtime slice for avatar/banner uploads:
- DTOs (`MediaAssetDTO`, `MediaRefDTO`, `UploadIntentDTO`), contracts, policy, mapper.
- `service.ts` use-cases: `createAvatarUploadIntent`, `createBannerUploadIntent`,
  `confirmProfileMediaUpload`, `getPublicMediaUrl`,
  `verifyProfileAssetForAttach` (owner + purpose + ready check used by the
  application layer before identity persists a profile media ref).
- `repository.ts`: in-memory `MediaRepository` (metadata only — never bytes) and an
  env-required `MediaStoragePort`.
- SQL schema mirror: `supabase/migrations/0002_media_assets.sql` (NOT applied; no live db push).

Missing (not in this slice): a connected storage backend
(`STORAGE_ADAPTER_ENV_REQUIRED`), real presigned upload (`LIVE_UPLOAD_NOT_STARTED`),
image processing/CDN, feed/chat media.

Events / outbox / idempotency: events now leave the domain wrapped in
`EventEnvelope` (PX-EVENT-001) and each envelope carries an `idempotencyKey`
(PX-IDEMP-001), but there is **no transactional outbox table yet** — publishing
is in-process via the injected `publish` callback. Status:
`OUTBOX_NOT_IMPLEMENTED` / `IDEMPOTENCY_KEY_ON_ENVELOPE_ONLY`.

DB constraint alignment: `supabase/migrations/0004_media_assets_status_photo.sql`
extends the original `purpose` CHECK enum to include `statusPhoto`, matching the
runtime; without this the original 0002 migration would have rejected status
photo writes at the DB boundary once persistence is wired.

## Owns
- Media assets metadata
- Upload intents / validation
- Public media refs and URL resolution

## Does NOT own
- Inline-encoded payloads (no base64/data-url — see ADR-006)
- Profiles (identity owns those; identity stores only a `MediaAssetRef`)

## Public surface
- `public-api.ts` (service factory, repo/storage factories, DTOs, contracts, policy, events)
- `contracts.ts`, `events.ts`, `dto.ts`

## Internal modules (not importable by other domains)
- service, repository, policy, mapper, internal/record, internal/validation

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
