# communities-v2 — UI Feature

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`

## Purpose
UI shell for the communities-v2 domain. The `/communities` route renders:

- Moje społeczności
- Odkrywaj
- loading / error / empty states
- public-safe community cards

The current adapter is MOCK_LOCAL_ONLY and reads deterministic fixtures from
`shared/fixtures`. There is no HTTP transport or persistence adapter yet, so
create/open CTAs are visibly disabled with an explanation.

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Must use public-api/contracts/events for cross-domain communication (`PX-ARCH-003`)
- Must not import `@server/*` from frontend runtime (`PX-ARCH-001`)
