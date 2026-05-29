# MVP Core Runtime Foundation — report

Status: `ACTIVE` · Branch: `feat/contacts-v2-clean-room-slice`

## 1. What this round delivered

The **product correction for "Zarządzaj"**: it is now a management **dashboard
(hub)**, not the professions screen.

- New root `/manage` → `ManageDashboard` with tiles:
  - **Zarządzaj profilem osobistym** → `/profile` (enabled, real screen).
  - **Zarządzaj zawodem** → `/manage/sekcja-zawodowa` (the existing professions
    section, now a CHILD route — not the hub root).
  - **Zarządzaj kontaktami** → `/contacts` (enabled, real screen).
  - **Prywatność i widoczność**, **Media profilu**, **Ustawienia konta** —
    explicitly disabled tiles ("W przygotowaniu"), no no-op buttons.
- Sidebar "Zarządzaj" now navigates to `/manage` (the hub), not directly to the
  professions screen.
- The professions section is unchanged: still renders the 30 categories and
  DATA_PENDING for professions/specializations, no fake save.

## 2. Manage dashboard structure (final)

```
/manage                     → ManageDashboard (hub: tiles)
/manage/sekcja-zawodowa      → ProfessionalSectionRoute (child: 30 categories,
                               step flow DATA_PENDING, "Moje zawody" disabled
                               save, local-draft proposal)
```

Enabled tiles route to real screens; future tiles are disabled with an honest
"W przygotowaniu" status.

## 3. What is STILL partial (honest status)

The backend **runtime + transport + persistence** work described in the task
(sections B–F: new HTTP endpoints, DB repository adapters, SQL migrations) was
**NOT implemented this round**. It remains as already shipped:

- identity/profile, media, social, contacts: real domain logic + policy +
  mapper + **in-memory repositories** + tests. **No live DB, no HTTP transport,
  no new migrations were added** this round.
- professions: categories REFERENCE_DATA_READY; professions/specializations
  DATA_PENDING; import DRY_RUN_ONLY.

This is deliberately deferred to a dedicated **S1 — Transport + persistence**
command (see `docs/roadmap/PLATFORMAX_V2_NEXT_BUILD_PLAN.md`). Nothing here is
claimed as IMPLEMENTED/PRODUCTION_READY.

## 4. Status truth

| Area | Status |
|---|---|
| Manage dashboard correction | DONE (hub + child professions route) |
| Identity/profile runtime | BACKEND_PARTIAL (in-memory) |
| Media avatar/banner | BACKEND_PARTIAL (in-memory) |
| Contacts V2 | BACKEND_PARTIAL + MOCK_LOCAL_ONLY |
| Social base | BACKEND_PARTIAL |
| Professions categories | REFERENCE_DATA_READY |
| Professions/specializations data | DATA_PENDING |
| Import | IMPORT_CONTRACT_READY / DRY_RUN_ONLY |
| Persistence / migrations / HTTP transport | NOT ADDED this round (next: S1) |

## 5. Tests added

`client/src/app-v2/manage/__tests__/ManageDashboard.test.tsx` (4):
- root `/manage` renders the hub heading + profile/professional tiles;
- root does NOT render the professions category grid (no listbox, no
  "Technologia i IT");
- a future tile is disabled, not a button;
- clicking "Zarządzaj zawodem" navigates to the professions section (30
  categories rendered, DATA_PENDING).

## 6. Not implemented (out of scope this round)

communities, chat, events, modules, channels, Public Hub, feed, posts,
comments, reactions, production DB writes, storage, deploy, new HTTP/DB
transport + migrations.

## 7. How to run

`pnpm test` (full), or targeted: `npx vitest run client/src/app-v2/manage`.

## 8. Next 3 steps

1. **DEEP — S1 Transport + persistence**: DB repository adapters behind the
   existing ports + SQL migrations (draft, no db push) + HTTP transport, for
   identity/media/social/contacts. This is the real "runtime" the task names.
2. **STANDARD — S2 Professions data import** (owner dataset → dry-run → import).
3. **STANDARD — S3 Profile product** (public/manage profile + embed
   `ProfileContactCard`).
