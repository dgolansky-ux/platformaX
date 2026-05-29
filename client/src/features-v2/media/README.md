# media — UI Feature

Status: `PARTIAL`

## Purpose
Typed frontend boundary for the media domain. Exposes `mediaAdapter` so app-v2
profile screens can validate and create avatar/banner upload intents without
importing the backend domain directly.

## Runtime state
- `MEDIA_AVATAR_BANNER_RUNTIME_PARTIAL` — local mock adapter
  (`MOCK_LOCAL_ONLY`, `BACKEND_NOT_STARTED`).
- `STORAGE_ADAPTER_ENV_REQUIRED` — no storage backend wired;
  `isStorageConnected()` is `false`.
- `LIVE_UPLOAD_NOT_STARTED` — bytes cannot be stored yet; the UI surfaces this
  honestly. `confirmProfileMediaUpload` returns `STORAGE_UNAVAILABLE` instead
  of pretending success.

## Structure
- `types.ts` — typed boundary re-exports (`MediaUploadAdapter`, result types,
  DTOs) sourced from `@shared/contracts/media`.
- `media-adapter.ts` — local **mock** implementation backed by an in-memory
  `Map`. Validates mime type + size + rejects inline `data:` refs. No
  `@server/*` imports, no `localStorage`/`sessionStorage`, no base64/FileReader.
- `index.ts` — feature barrel exporting `mediaAdapter` and `createMockMediaAdapter`.

## Constraints
- Must not import `@server/*` (production code) or `@shared/wiring/*` (path
  removed because it pulled server runtime into the client bundle).
- Must not import other feature domains' internal modules or legacy code.
- No base64/data-url, no `readAsDataURL`, no `FileReader`, no
  `localStorage`/`sessionStorage` persistence.
