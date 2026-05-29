# channels — UI Feature

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`

## Purpose
UI shell for the channels domain. `/channels` renders directory sections and
`/channels/:slug` renders a channel profile with follow CTA, lead badges,
publisher, pinned post and feed backed by the local mock adapter.

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Must use public-api/contracts/events for cross-domain communication (`PX-ARCH-003`)
- Must not import `@server/*` from frontend runtime (`PX-ARCH-001`)
