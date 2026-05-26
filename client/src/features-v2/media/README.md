# media â€” UI Feature

Status: `PARTIAL`

## Purpose
Typed frontend boundary for the media domain. Exposes `mediaAdapter` so app-v2
profile screens can validate and create avatar/banner upload intents without
importing the backend domain directly.

## Runtime state
- `MEDIA_AVATAR_BANNER_RUNTIME_PARTIAL` â€” in-memory boundary.
- `STORAGE_ADAPTER_ENV_REQUIRED` â€” no storage backend wired; `isStorageConnected()` is `false`.
- `LIVE_UPLOAD_NOT_STARTED` â€” bytes cannot be stored yet; the UI surfaces this honestly.

## Constraints
- Only `media-adapter.ts` may import `@server/domains-v2/media/public-api`.
- Must not import other feature domains' internal modules or legacy code.
- No base64/data-url, no `readAsDataURL`, no localStorage/sessionStorage persistence.

## Canonical governance

- Rules Registry: `docs/governance/RULES_REGISTRY.yml` (repo root)
- Governance Index: `docs/governance/GOVERNANCE_INDEX.md` (repo root)
- Domain Status Registry: `docs/governance/DOMAIN_STATUS_REGISTRY.yml` (repo root)
- Status Taxonomy: `docs/governance/STATUS_TAXONOMY.md` (repo root)

Local exceptions: none
