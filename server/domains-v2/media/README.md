# media

Status: `PARTIAL`
Owner: @dgolansky-ux
Type: OWNER_DOMAIN

## Purpose
Owns media assets — upload intents, ownership/purpose/file validation, asset
records, variant skeletons and stable media references used by every V2
surface (profile, friend feed, communities, channels, workplaces, events,
newsletter). Other domains store a `MediaAssetRef` and never the file payload.

## Slice 18 runtime additions

The Slice 18 V2 expansion covers:

- 21 purposes across 8 owner types (see `purpose-registry.ts`).
- Generic `createUploadIntent(input)` and `completeUpload(input)` use-cases
  driven by the purpose registry — every surface uses the same primitives.
- Upload intents are persisted (in-memory) with idempotency + TTL (default
  15 minutes). Reuse is rejected; idempotent retry returns the same intent.
- Variant policy is materialised on `completeUpload` as
  `processing_skeleton` status for non-`original` variants. No real image
  processing pipeline (`VARIANT_PROCESSING_SKELETON`,
  `VIDEO_PROCESSING_NOT_STARTED`) — uploads of `video/*` mime types are
  rejected up front.
- Soft-delete (`deleteMediaAssetSoft`) hides assets from `listAssetsForOwner`
  without losing the record.
- Visibility-aware reads through `canReadMediaAsset(ctx)` honour the four
  visibility tiers (`public`, `friends_only`, `members_only`, `owner_only`).

## Runtime justification (status PARTIAL)

- DTOs (`MediaAssetDTO`, `MediaRefDTO`, `MediaVariantDTO`, `UploadIntentDTO`,
  `MediaPurposeDefinitionDTO`, `MediaValidationErrorDTO`), contracts, policy,
  mapper.
- `service.ts` use-cases: `createUploadIntent`, `completeUpload`,
  `getPublicMediaUrl`, `listAssetsForOwner`, `deleteMediaAssetSoft`,
  `verifyOwnedAssetForAttach`, plus `getPurposeDefinition` /
  `listPurposeDefinitions`.
- `repository.ts`: in-memory `MediaRepository` (metadata + variant skeletons,
  never bytes), in-memory `UploadIntentRepository` and an env-required
  `MediaStoragePort`.
- SQL schema mirrors:
  `supabase/migrations/0002_media_assets.sql` (original) +
  `supabase/migrations/0008_media_v2_expansion.sql` (V2 widening + variants +
  intents). NOT applied; no live db push.

Missing (not in this slice):
- a connected storage backend (`STORAGE_ADAPTER_ENV_REQUIRED`),
- real presigned upload (`LIVE_UPLOAD_NOT_STARTED`),
- live image processing / CDN (`VARIANT_PROCESSING_SKELETON`),
- video transcoding (`VIDEO_PROCESSING_NOT_STARTED`),
- AI moderation.

Events / outbox / idempotency: events now leave the domain wrapped in
`EventEnvelope` (PX-EVENT-001) and each envelope carries an `idempotencyKey`
(PX-IDEMP-001), but there is **no transactional outbox table yet** — publishing
is in-process via the injected `publish` callback. Status:
`OUTBOX_NOT_IMPLEMENTED` / `IDEMPOTENCY_KEY_ON_ENVELOPE_ONLY`.

## Owns
- Media asset records (metadata only — never bytes).
- Variant records (skeleton until a real pipeline is wired).
- Upload intent records (with idempotency + TTL + reuse protection).
- Public-safe media refs + URL resolution.

## Does NOT own
- Inline-encoded payloads (no base64/data-url — see ADR-006).
- Profiles (identity owns those; identity stores only a `MediaAssetRef`).
- Cross-domain authority (community admin / channel lead / workplace owner /
  event owner) — that lives in `application-v2/use-cases/media` behind the
  `MediaPermissionsPort`.

## Public surface
- `public-api.ts` — `createMediaService`, the purpose registry helpers
  (`getPurposeDefinition`, `listPurposeDefinitions`, `isMediaPurpose`,
  `buildStoragePath`, `STORAGE_PATH_PATTERN`), DTOs (asset, variant, intent,
  purpose definition, validation error, refs), contracts
  (`MediaAssetRef`, `MediaResult`, `MediaError`, `MediaErrorCode`), policy
  predicates (`canCreateUploadIntent`, `canConfirmUpload`,
  `canDeleteMediaAsset`, `canReadMediaAsset`, `MediaViewerRole`,
  `MediaReadContext`), validation limits (`MEDIA_VALIDATION_LIMITS`,
  `ALLOWED_MIME_TYPES`, `maxBytesFor`, `maxFilesFor`, `allowedMimeFor`),
  event types (`MediaEvent`, `MediaUploadIntentCreatedEvent`,
  `MediaUploadConfirmedEvent`, `MediaAssetDeletedEvent`,
  `MediaEventEnvelope`) and the `MediaRepository` / `UploadIntentRepository` /
  `MediaStoragePort` port interfaces (with `CreateMediaRecordInput`,
  `UpdateMediaRecordPatch`, `CreateUploadIntentRecordInput`,
  `CreateVariantInput`, `UploadTarget`, `UploadTargetRequest`).
- `public-api.ts` does NOT export the in-memory repository implementation
  factories or the env-required storage implementation factory — server-side
  composition (today: tests; future: HTTP/Supabase wiring) imports them
  directly from `./repository`. The boundary guard treats `./repository` as
  importable by composition code but not by other domains.
- `contracts.ts`, `events.ts`, `dto.ts`, `policy.ts`, `limits.ts`, `ports.ts`,
  `purpose-registry.ts` are the typed surfaces re-exported via
  `public-api.ts` — domains MUST go through `public-api.ts`, never deep-import.

## Internal modules (not importable by other domains)
- service, repository, policy, mapper, internal/record, internal/validation,
  internal/envelope.

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: none
