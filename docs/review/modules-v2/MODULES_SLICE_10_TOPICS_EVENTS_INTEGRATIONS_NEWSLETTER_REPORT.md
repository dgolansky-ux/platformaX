# Modules Slice 10 — Public Hub + Tematy / Wydarzenia / Integracje / Newsletter chatowy

**Branch:** feat/contacts-v2-clean-room-slice
**Base commit:** 396e2d5
**Date:** 2026-05-30
**Status:** READY_FOR_PRODUCT_REVIEW (FOUNDATION_READY for module domains; UI is UI_SHELL_ONLY + MOCK_LOCAL_ONLY)

## Scope

Make modules a first-class, owner-typed product surface and ship foundations
for the four module domains the brief calls out: **Tematy**, **Wydarzenia**,
**Integracje**, **Newsletter chatowy**. Module enablement now drives the
Public Hub for both `profile` and `community` owner types, with the Public
Hub composition use-case wiring per-module slot data through the four new
domains' public-api surfaces (no cross-domain internals).

## Legacy files reviewed

The repository is a clean-room V2 working copy — there is no legacy runtime
tree in `client/`, `server/`, `shared/`. The legacy UI map at
`docs/review/modules-v2/LEGACY_MODULES_UI_MAP.md` records, from the product
brief, what UX intent was carried over and what was deliberately rejected
(payments, OAuth, embed iframes, email delivery, "fake private chat" framing).

## What was built

### Backend (server/domains-v2)

| Path                                      | Status          | Notes |
|-------------------------------------------|-----------------|-------|
| `modules/`                                | BACKEND_PARTIAL | Extended: visibilitySupport, defaultEnabled, category/icon on definitions; visibility/order/createdAt on enablement; visibility setter; `listAllForOwner` for management views. |
| `topics-v2/`                              | FOUNDATION_READY | dto, contracts, policy, mapper, store, service, public-api, README, 9 unit tests. ownerType profile + community. |
| `events-v2/`                              | FOUNDATION_READY | dto, contracts, policy, mapper, store, service, public-api, README, 9 unit tests. Date/location validation; no payments/sync. |
| `integrations-v2/`                        | FOUNDATION_READY | dto, contracts, policy, mapper, store, service, public-api, README, 8 unit tests. URL safety (rejects javascript:/data:/file:/vbscript:); no OAuth/secrets. |
| `newsletter-chat-v2/`                     | FOUNDATION_READY · NO_EMAIL_DELIVERY | dto, contracts, policy, mapper, store (chat + message + subscriber), service + service-helpers, public-api, README, 9 unit tests. Broadcast-only; subscriber counts public, identities private. |
| `public-hub/`                             | unchanged       | Existing composition domain — used by the new application-v2 rich hub view. |
| `domain-registry.ts` + `DOMAIN_STATUS_REGISTRY.yml` | updated | 4 new domains registered. |

### Application layer (server/application-v2/use-cases/public-hub)

- `types.ts` (new) — `OwnerHubViewDTO`, `HubModuleSlotDTO`, `ModuleSlotData`,
  `RichHubResult`.
- `service.ts` (extended) — adds `getPersonalProfileHubView(ownerId)` and
  `getCommunityHubViewWithSlots(ownerId)`. Composes:
  - owner summary via identity / communities-v2 (existing resolvers),
  - enabled module keys via modules.listEnabledForOwner,
  - per-slot data via topics-v2 / events-v2 / integrations-v2 /
    newsletter-chat-v2 public-api (each is optional in `Deps` so existing
    callers continue to compile).
- `public-api.ts` (extended) — re-exports new types.
- `__tests__/rich-hub.test.ts` — 5 composition tests
  (topics+events for profile, integrations+newsletter for community,
  NOT_FOUND, disabled modules hidden, channel_entry never on profile).

### Frontend (client/src/features-v2)

| Path                                | Status           | Notes |
|-------------------------------------|------------------|-------|
| `modules/`                          | UI_SHELL_ONLY + MOCK_LOCAL_ONLY | `ModulesManageView` is owner-agnostic. `modulesMockAdapter` enforces allowedOwnerTypes + canManage, mirroring server policy. Profile owner + community manager + community viewer fixtures included. |
| `public-hub/`                       | UI_SHELL_ONLY + MOCK_LOCAL_ONLY | `PublicHubView` is owner-agnostic. `publicHubMockAdapter` reads enablement from the modules adapter and seeds per-owner slot data so toggling a module visibly updates the hub. |
| `public-hub/slots/`                 | UI_SHELL_ONLY | TopicsSlot / EventsSlot / IntegrationsSlot / NewsletterChatSlot. Each renders an empty state when the slot is empty. |

Frontend tests: 4 ModulesManageView tests + 8 PublicHubView tests (profile
hero, empty state, topics slot, newsletter broadcast label, community
hero, events location label, integrations safe-URL audit, missing
community error).

## Architecture facts

- `modules` does NOT store business data — it only owns definitions +
  enablement state.
- `public-hub` does NOT duplicate source-of-truth data — the domain composes
  module-key lists; the application use-case bolts on slot data through each
  module domain's public-api.
- Each module domain (`topics-v2`, `events-v2`, `integrations-v2`,
  `newsletter-chat-v2`) is fully isolated:
  - owns its own DTOs / repository / policy / service,
  - depends on cross-domain ports (`*OwnershipResolver`,
    `*ModuleEnablementResolver`) that the application layer implements,
  - never imports identity / communities-v2 / modules / other module
    domains' internals.
- ownerType naming: kept as `"profile" | "community"` (matching existing
  modules / public-hub surfaces). The slice brief writes `personal_profile`
  for emphasis; the short alias is semantically equivalent and avoids a
  breaking rename across already-shipped slices (communities, channels,
  channel_entry). Recorded for future renames.

## Per-module allowedOwnerTypes decisions

| Module               | profile | community | Rationale |
|----------------------|:-------:|:---------:|-----------|
| topics               | ✓       | ✓         | Both already shipped. |
| events               | ✓       | ✓         | Broadened from community-only per Slice 10 brief. Personal events fit the profile surface (live streams, AMA, talks). |
| integrations         | ✓       | ✓         | Broadened from previous (mixed). Same shape works for both. |
| newsletter_chat      | ✓       | ✓         | Broadened from community-only per Slice 10 brief. Personal newsletter is a core creator use-case. |
| channel_entry        | ✗       | ✓         | Channels remain a community construct; profile owners don't have channels. |

Future recommendation: if telemetry shows personal newsletter / personal
events are not used, narrow allowedOwnerTypes — enforcement is policy-only,
no migration required.

## Modules domain extensions

`ModuleDefinitionDTO`:
- Added `category` (`content` | `social` | `events` | `integrations` | `broadcast`).
- Added `icon` (string slug — UI maps to graphics).
- Added `defaultEnabled` (currently `false` for all — explicit opt-in).
- Added `visibilitySupport` (`public`, `members_only`, `private`,
  `owner_only`).

`ModuleEnablementDTO`:
- Added `visibility` (`public` / `members_only` / `private` / `owner_only`).
- Added `order` (sort hint for management UIs).
- Added `createdAt`.

`ModulesService`:
- `setVisibility(...)` — change visibility without flipping enabled.
- `listAllForOwner(...)` — return both enabled and disabled rows (used by
  management views). FIXED_CAP — bounded by `MODULE_DEFINITIONS.length`.

Existing API (`enableForOwner`, `disableForOwner`, `listEnabledForOwner`)
remains source-compatible.

## DTO / PII / security guarantees

- Every module public DTO drops `createdByUserId` (verified by tests).
- `integrations-v2` URL validator rejects every scheme except `http`,
  `https`, `mailto`. javascript:/data:/file:/vbscript: are tested.
- `newsletter-chat-v2` public DTO never exposes subscriber identities — only
  `subscriberCount`.
- Public Hub composition surfaces never include `email` or `phone`
  (verified by `rich-hub.test.ts`).
- Frontend integration cards render `target="_blank" rel="noopener noreferrer"`;
  test verifies `href` never starts with `javascript:` or `data:` in fixture
  data.

## Persistence draft

No migrations were written this slice (per "NIE rób db push" rule). The
intended schema is captured per-domain in the README files; the in-memory
stores enforce all the same uniqueness/order constraints that DB indexes
would (`(ownerType, ownerId, slug)` for topics, `(ownerType, ownerId,
moduleKey)` for module enablement, `(newsletterChatId, subscriberUserId)`
for newsletter subscribers).

## Tests

Total project: **1004 tests across 131 files — all green**.

| New test file | Tests |
|---------------|-------|
| `server/domains-v2/modules/__tests__/modules-service.test.ts` (rewritten) | 10 |
| `server/domains-v2/topics-v2/__tests__/topics-service.test.ts` | 9 |
| `server/domains-v2/events-v2/__tests__/events-service.test.ts` | 9 |
| `server/domains-v2/integrations-v2/__tests__/integrations-service.test.ts` | 8 |
| `server/domains-v2/newsletter-chat-v2/__tests__/newsletter-chat-service.test.ts` | 9 |
| `server/application-v2/use-cases/public-hub/__tests__/rich-hub.test.ts` | 5 |
| `client/src/features-v2/modules/__tests__/ModulesManageView.test.tsx` | 6 |
| `client/src/features-v2/public-hub/__tests__/PublicHubView.test.tsx` | 8 |

## Gates evidence

| Gate                | Result | Notes |
|---------------------|--------|-------|
| `pnpm check`        | PASS   | tsc --noEmit clean. |
| `pnpm lint`         | PASS   | 0 errors / 0 warnings. |
| `pnpm test`         | PASS   | 1004 / 1004 green. |
| `pnpm build`        | PASS   | Vite production build OK (single-bundle warning is pre-existing repo state). |
| `pnpm rules:check`  | PASS   | 43/43 guards. |
| `pnpm arch:check:v2`| PASS   | 9/9 guards. After registering 4 new domains in `scripts/check-domain-registry.mjs` and `DOMAIN_STATUS_REGISTRY.yml`. |
| `pnpm guards:all-local` | PASS | Including code-quality, scalability, frontend-perf, status-truth, dependency-discipline, logging-pii-security. |
| `pnpm depcruise:check` / `pnpm tooling:redcase` | NOT_RUN this turn | Not part of the slice scripted gate list. |
| `pnpm secrets:gitleaks` | NOT_RUN this turn | Requires gitleaks binary; opt-in. |

## What was NOT implemented this slice (intentional)

- Email or push delivery for newsletter chats.
- Full chat / 1:1 messaging.
- OAuth / external API sync for integrations.
- Payments / ticketing on events.
- Calendar-provider scheduler sync.
- Global module discovery / marketplace.
- DB transport / Supabase wiring (kept in-memory; persistence is in the
  README drafts).
- HTTP transport for any of the 4 module domains (BACKEND_PARTIAL).
- Wiring the new `features-v2/modules` + `features-v2/public-hub` views
  into top-level routes (the existing `CommunityModulesManage` and
  `CommunityPublicHubView` are unchanged; the new generic surfaces are
  available for app-router adoption in a follow-up).

## Status table

| Item                                 | Result    |
|--------------------------------------|-----------|
| Legacy modules inventory             | PASS (clean-room context noted) |
| Modules domain                       | PASS      |
| allowedOwnerTypes profile/community  | PASS      |
| Profile Public Hub                   | PASS      |
| Community Public Hub                 | PASS      |
| Profile modules management           | PASS (UI_SHELL_ONLY) |
| Community modules management         | PASS (existing + new owner-agnostic surface) |
| Topics module                        | PASS (FOUNDATION_READY) |
| Events module                        | PASS (FOUNDATION_READY) |
| Integrations module                  | PASS (FOUNDATION_READY) |
| Newsletter chat module               | PASS (FOUNDATION_READY, NO_EMAIL_DELIVERY) |
| Public Hub composition               | PASS      |
| Application-v2 orchestration         | PASS      |
| Frontend module slots                | PASS (UI_SHELL_ONLY) |
| DTO / PII / security                 | PASS      |
| Architecture boundaries              | PASS      |
| Tests                                | PASS (1004/1004) |
| Guards                               | PASS (rules + arch + all-local) |
| Readiness                            | READY     |

## Branch / commit / next step

- Branch: `feat/contacts-v2-clean-room-slice`
- New commit: see `git log` after this slice.
- Next recommended slice: per the user's Slice 11 brief — Friend Feed
  (content-v2 friend-posts submodule + personal profile preview tool,
  modelled on legacy UI 1:1).

## P0 / P1 / P2

- **P0:** none.
- **P1:** none.
- **P2:** none from this slice. (Pre-existing single-bundle vite warning
  is unrelated and predates Slice 10.)
