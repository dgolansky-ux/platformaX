# features-v2/manage

**Slice 21 — Manage Dashboard (UI side).**

Owner-only dashboard that composes 13 section cards (account, profile,
privacy, contact, friends, notifications, media, professional, workplaces,
modules, channels, communities, security) from a `ManageDashboardAdapter`.

The DTO contract lives in `@shared/contracts/manage-dashboard` — never
import from `@server/*` here. The default mock adapter
(`mock-adapter.ts`) is MOCK_LOCAL_ONLY: no localStorage, no fake save,
realistic statuses and warnings.

## Public surface

- `ManageDashboardPage` — main UI component, takes viewer/owner ids and an adapter.
- `ManageSectionCard` — single tile.
- `ManageStatusBadge` — status pill.
- `manageMockAdapter`, `createManageMockAdapter()` — default mock.

## Owner-only guard

`getManageDashboardView(viewerUserId, ownerUserId)`:

- empty viewer → `UNAUTHENTICATED`
- viewer ≠ owner → `OWNER_MISMATCH`
- otherwise → the dashboard DTO

## Status

- UI: ready.
- Transport: MOCK_LOCAL_ONLY (per-section edit routes are truthful PARTIAL shells).
