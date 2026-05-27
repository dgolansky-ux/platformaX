# media — UI Feature

Status: `PARTIAL`

## Purpose
Typed frontend boundary for the media domain. Exposes `mediaAdapter` so app-v2
profile screens depend on a stable contract without bundling server runtime.
Types come from `@shared/contracts/media-view`.

## Runtime state
- `MEDIA_UPLOAD_CLIENT_BOUNDARY_PARTIAL` — client-only adapter; no server runtime bundled.
- `CLIENT_MEDIA_TRANSPORT_NOT_CONNECTED` — no transport wired; `isStorageConnected()` is `false`.
- `LIVE_UPLOAD_NOT_STARTED` — bytes cannot be stored yet; the UI surfaces this honestly.

## Constraints
- No file under `client/src` may import `@server/*` (enforced by check-client-server-boundary).
- Types come only from `@shared/contracts/*`; the media domain runtime stays server-side.
- Must not import other feature domains' internal modules or legacy code.
- No base64/data-url, no `readAsDataURL`, no localStorage/sessionStorage persistence.
