# application-v2/use-cases/manage

**Slice 21 — Manage Dashboard orchestrator.**

Thin composition layer that produces a single, owner-only Manage Dashboard
view by reading public-api surfaces of the underlying domains:

- identity (account, profile, contact fields)
- social (friends, blocks)
- notifications-v2 (categories, unread totals)
- media (avatar, banner, media count, upload status)
- professional-profile (categories, professions)
- channels (lead/follow counts)
- communities-v2 (role counts)
- public-hub / modules (enabled modules summary)

## Owner-only access

Every call checks `currentUserId === targetUserId`. Otherwise:

- `UNAUTHENTICATED` — no current user
- `OWNER_MISMATCH` — trying to read another user's dashboard

## DTO

See `@shared/contracts/manage-dashboard` for the `ManageDashboardDTO` shape.

## Status

- **BACKEND_PARTIAL** — the orchestrator is wired against a `ManageDashboardPort`
  interface. The default mock port lives in
  `client/src/features-v2/manage/mock-adapter.ts` (frontend), and the future
  HTTP transport will provide a concrete server-side port reading from the
  underlying domain services.
- **UI_SHELL_ONLY** — Slice 21 ships the dashboard view, owner-only access
  guard and section cards. Per-section editors keep the existing routes
  (`/manage/profil-osobisty`, `/manage/sekcja-zawodowa`) and add new shells
  for `/manage/{account,privacy,contact,friends,notifications,media,
  workplaces,modules,channels,communities,security}`. Each shell is a
  truthful "Wkrótce / PARTIAL" surface until the underlying domain edit
  flow lands.
