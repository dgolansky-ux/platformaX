# media — UI Feature

Status: `PARTIAL`

## Purpose
Typed frontend boundary for the V2 media domain. Exposes `mediaAdapter` and a
generic `MediaPicker` / `AvatarUploader` / `BannerUploader` stack so every
surface (profile, friend feed, communities, channels, workplaces, events,
publishing composer) can validate + intent-create uploads without importing
the backend domain directly.

## Runtime state
- `MEDIA_RUNTIME_PARTIAL` — local mock adapter (`MOCK_LOCAL_ONLY`,
  `BACKEND_NOT_STARTED`).
- `STORAGE_ADAPTER_ENV_REQUIRED` — no storage backend wired;
  `isStorageConnected()` is `false`.
- `LIVE_UPLOAD_NOT_STARTED` — bytes cannot be stored yet; the UI surfaces
  this honestly through `MediaUploadBlockedState`. `completeUpload` returns
  `STORAGE_UNAVAILABLE` instead of pretending success.
- `VARIANT_PROCESSING_SKELETON` — variants are declared by the purpose
  registry but no real image processing pipeline is wired; the display kit
  falls back gracefully via `resolveDisplayUrl`.

## Structure
- `types.ts` — typed boundary re-exports (`MediaUploadAdapter`, result types,
  DTOs, purpose, owner, variant) sourced from `@shared/contracts/media`.
- `media-adapter.ts` — local **mock** implementation backed by in-memory
  `Map`s. Validates mime/size/maxFiles/owner-type, rejects inline `data:`
  refs, supports idempotent intent replay. No `@server/*` imports, no
  `localStorage`/`sessionStorage`, no base64/FileReader.
- `mediaValidation.ts` — frontend mirror of the purpose-registry checks plus
  helpers (`metaFromFile`, `generateIdempotencyKey`, `purposeAcceptAttr`).
- `mediaVariantResolver.ts` — display-time variant picker that selects the
  best-available URL per surface (avatar / banner / feed_card / full / teaser
  / gallery_tile).
- `useMediaUpload.ts` — single-file upload hook with object-URL preview
  cleanup, inline validation and honest blocked-state surfacing.
- `MediaPicker.tsx` — purpose-aware multi-file picker (composer / gallery).
- `MediaPreviewGrid.tsx`, `MediaPurposeHint.tsx`,
  `MediaUploadBlockedState.tsx` — composable picker pieces.
- `AvatarUploader.tsx`, `BannerUploader.tsx` — subtle owner-only editors.
- `BrokenMediaFallback.tsx`, `MediaSkeleton.tsx` — display-kit placeholders.
- `index.ts` — feature barrel.

## Constraints
- Must not import `@server/*` (production code) or `@shared/wiring/*` (path
  removed because it pulled server runtime into the client bundle).
- Must not import other feature domains' internal modules or legacy code.
- No base64/data-url, no `readAsDataURL`, no `FileReader`, no
  `localStorage`/`sessionStorage` persistence.
