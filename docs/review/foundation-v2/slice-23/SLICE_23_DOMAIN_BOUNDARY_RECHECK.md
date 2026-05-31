# SLICE 23 — Domain boundary recheck

> **Date:** 2026-05-30
> **Inputs:** `pnpm arch:check:v2`, grep-based static review, manual
> inspection of imports under `client/src/**`, `server/domains-v2/**`,
> `server/application-v2/**`, `shared/contracts/**`.
> **Result:** **PASS** — no cross-domain internal coupling introduced or
> remaining from the Slice 22A consolidation.

## 1. Guard results

| Guard | Result |
| --- | --- |
| `audit-domain-boundaries.mjs` | PASS |
| `check-no-legacy-imports.mjs` | PASS |
| `check-removed-product-areas.mjs` | PASS |
| `check-public-dto-pii.mjs` | PASS |
| `check-media-base64.mjs` | PASS |
| `check-pagination.mjs` | PASS |
| `check-domain-registry.mjs` | PASS |
| `check-domain-scaffold.mjs` | PASS |
| `check-feature-registry.mjs` | PASS |
| `check-architecture-import-graph.mjs` (from `rules:check`) | PASS |
| `check-dependency-discipline.mjs` (from `guards:all-local`) | PASS |
| `check-public-dto-pii.mjs` | PASS (no PII fields in public DTOs) |
| `check-status-truth-consistency.mjs` | PASS |
| `depcruise:check` | 0 errors (44 `no-orphans` warnings classified in §1.2 of the orphan register) |

## 2. Manually re-verified invariants

- **No domain imports another domain's internal files.** Grep for
  `from\s+["'][^"']*/internal/` confined to in-domain imports
  (e.g. `media/internal/validation.ts` used only inside the `media`
  domain). No cross-domain `internal/` leak found.
- **Public-api / contracts / events used correctly.** All
  `server/application-v2/use-cases/**` import contracts from
  `shared/contracts/**`, and domain types from `server/domains-v2/<domain>/public-api`
  or `server/domains-v2/<domain>/index` barrels. No direct
  `repository.ts` / `service.ts` import from another domain's
  consumer.
- **`application-v2` orchestrates 2+ domain flows.** Use-cases under
  `server/application-v2/use-cases/{manage,publishing,community-interactions,channel-interactions,profile,personal-profile-view,friend-feed,public-hub,community-feeds,channels,channel-content,moderation,workplace-feed,feed,communities,contacts,social,media,notifications}/` compose multiple domains.
- **Frontend never imports `@server/*`.** Verified by grep on
  `client/src/**`: `from\s+["']@server/` returns **0 matches**. The
  Slice 22A `ProfileRuntime.test.tsx` also asserts this for the
  `client/src/app-v2/profile/**` subtree.
- **No raw DB records leak through public DTOs.** Public DTOs under
  `shared/contracts/**` carry only display-safe fields. Identity
  contact fields (`email`, `phone`) appear as enum-literal *labels* in
  `manage-dashboard-sections.ts` (`fieldsAvailable: readonly
  ("email" | "phone")[]`), never as field carriers — the
  `ALLOW_PRIVATE_DTO_PII` marker documents this.
- **No god-service publisher.** `application-v2/publisher/` is an
  empty barrel; actual publish flows live under per-surface use-cases
  (`publishing`, `community-interactions`, `channel-content`, etc.).
- **Public Hub is not source of truth.** `features-v2/public-hub` and
  `server/application-v2/use-cases/public-hub/` *compose* views from
  `identity`, `content-v2`, `media`, `topics-v2`, `events-v2`,
  `newsletter-chat-v2`, `integrations-v2`. No data origin.
- **Modules does not own module data.** `server/domains-v2/modules` and
  `features-v2/modules` carry only definitions/enablement; module
  content lives in the respective domain (e.g. topics in
  `topics-v2`, events in `events-v2`, etc.).
- **Workplaces are not communities.** Backend workplaces live under
  `server/domains-v2/identity/workplaces/*` (part of `identity`).
  The `professional-profile` feature folder is UI only.
  `existsSync(server/domains-v2/professional-profile)` returns false
  (Slice 22A test in `ProfilePage.test.tsx` line 204 asserts this).
- **Channels are not community membership.** `server/domains-v2/channels`
  exposes a `viewer.canFollow` / lead role surface; community
  membership stays in `server/domains-v2/communities-v2`.
- **RingPost is treated as legacy source material only.** No runtime
  import of any `RingPost` symbol — `check-no-legacy-imports.mjs`
  enforces this.
- **friendship ≠ contact access.** Contact consents live in
  `server/domains-v2/social/social-contacts-service` + tests assert
  the separation. Friend removal does not revoke contact consent.
- **No frontend → @server imports.** Already verified above.
- **No `localStorage`/`sessionStorage` as backend.** Guarded by
  `client/src/features-v2/{identity/profile,media}/__tests__/no-storage.test.ts`
  and the profile-runtime test.
- **No base64 / readAsDataURL upload runtime.** Guarded by
  `check-media-base64.mjs` (PASS) and the media adapter test.

## 3. Areas re-inspected during Slice 23 edits

| Area | Risk introduced by Slice 23? | Verdict |
| --- | --- | --- |
| `ProfilePage` → `AppShell` migration | Could have leaked navigation imports into profile sections. | None. Profile sections continue to import only their own modules + `features-v2/media` (allowed). |
| `ProfileTokensProvider` (CSS-only wrapper, no JS) | Could have moved styling into `features-v2`. | None. Token cascade stays inside `app-v2/profile/styles/profile-layout.module.css`. |
| New `client/src/features-v2/publishing/useComposerOpenEvent.ts` (Slice 22A) | Could couple a feature with navigation. | Verified one-way: navigation **dispatches**, feature **subscribes**. No reverse import. |
| Deleted `CommunitiesList.tsx` | Could have removed a public-API consumer. | Verified zero imports across the repo. |
| Playwright config (`playwright.config.ts`, `tests/visual-v2/*.spec.ts`) | Could import server code. | Verified: only imports `@playwright/test` + `node:path`. |
| New `scripts/audit/create-slice-22-full-source-audit-zip.mjs` (Slice 22A) and the upcoming Slice 23 variant | Could violate script-safety. | `check-script-safety.mjs` PASS. |

## 4. Gaps / next-slice work

- No domain has been fully wired to a real Supabase transport. Once any
  slice does so, the boundary recheck must also confirm:
  - SQL adapter is implemented in the domain's `internal/` only.
  - `application-v2` use-case continues to depend on the public-api
    barrel, not the new SQL implementation file.
- `server/domains-v2/{audit,chat,events,notifications,search,system}`
  remain SCAFFOLD_ONLY. When wired, their public-api barrels must
  continue to be the only consumer surface.

## 5. Result

**Domain boundaries are clean.** Slice 23 introduced no cross-domain
internal coupling, no legacy-runtime imports, and no frontend→server
leaks. The clean-room V2 architecture invariants from `CLAUDE.md`-style
project rules are intact.

— End of Slice 23 domain boundary recheck.
