# WORKPLACES SLICE 12 — REPORT

**Status:** `BACKEND_PARTIAL` (server) + `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY` (client)
**Branch:** `feat/contacts-v2-clean-room-slice`
**Date:** 2026-05-30
**Scope:** „Miejsce pracy" w warstwie zawodowej profilu osobistego — domena
workplaces + mikro-feed + mini-zajawki na feedzie znajomych.

## 1. Legacy workplace files reviewed

Bazą referencyjną UX były:

- `client/src/features/identity/components/ProfileProfessionalSection.tsx`
  (anchor „Moja praca")
- `client/src/features/identity/components/ProfileNetworkView.tsx` +
  `ActivityCard.tsx` (siatka aktywności zawodowych)
- `client/src/features/identity/components/ProfessionBlock.tsx` +
  `ProfessionBlock.LinkedActivities.tsx` (warstwa zawodowa)
- `client/src/features/identity/pages/ProfessionEditor.tsx` + step files
  (wzorzec wieloetapowego kreatora)
- `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` §23 — Professional layer
- `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST_UPDATED_1TO1_AUDIT.md` —
  mikrocopy, work types, sheet add-flow
- `client/src/app-v2/profile/sections/ProfileProfessionalActivities.tsx` —
  obecny V2 placeholder (wymieniony przez Slice 12)

Mapowanie legacy → V2: zobacz
`docs/review/professional-profile-v2/LEGACY_WORKPLACE_UI_AND_FLOW_MAP.md`.

## 2. Co przeniesiono z legacy (1:1 UX, clean-room runtime)

- Wzorzec kreatora wieloetapowego (progress 1/5 → 5/5, sukces step) z
  `ProfessionEditor`.
- Sekcja „Miejsca pracy" w warstwie zawodowej profilu osobistego (z
  `ProfessionBlock` + `ProfileProfessionalSection`).
- Karty miejsc pracy w warstwie zawodowej (z `ProfessionBlock.LinkedActivities`).
- Strona miejsca pracy z hero + kontakt + opis + mikro-feed (z
  `ProfileHeader` + `ProfilePostsSection` + `QuickFeedPreview`).
- Owner actions sheet (z `ProfileModals`).
- Mini-karta na feedzie znajomych — inspiracja z
  `QuickFeedPreview.tsx` + `FriendActivityGridTiles.tsx`.

## 3. Co odrzucono jako kopia społeczności / fake runtime

- Członkowie miejsca pracy.
- Role admin/moderator/member miejsca pracy.
- Join / request / invite flow miejsca pracy.
- Podspołeczności / struktura grupowa.
- `tRPC` hooks bezpośrednio w komponentach.
- Legacy Supabase coupling z UI.
- Upload `base64`/`dataURL`.
- `localStorage` jako fake backend / fake persistence.
- `window.confirm` / `window.alert`.
- Public DTO z prywatnym kontaktem (email/phone).
- Profesional-profile jako osobna domena backendu (workplaces są pod
  `identity`).
- Pełny post w feedzie znajomych z wpisu miejsca pracy (jest tylko
  mini-zajawka z linkiem do pełnego wpisu na stronie miejsca pracy).

## 4. Kreator miejsca pracy

`client/src/features-v2/professional-profile/WorkplaceWizard.tsx`

5 kroków: **Podstawy → Zawód i obszar → Kontakt i linki → Prezentacja →
Podsumowanie**. Progress bar (5 step), error inline, success → `onCreated(card)`
(parent route nawiguje do strony miejsca pracy).

Walidacje:
- nazwa wymagana, slug wymagany (lowercase + walidacja wzorca),
- URL: rejekcja `javascript:` / `data:` / `file:` / `vbscript:`
  (`policy.validateWebsiteUrl`),
- contactVisibility z 4 opcji (`owner_only` / `friends` /
  `approved_contact_fields` / `public`),
- visibility miejsca pracy z 3 opcji (`public` / `friends_only` / `private`).

Routing: `/manage/profile/workplaces/new` (`WorkplaceCreateRoute`).

## 5. Strona miejsca pracy

`client/src/features-v2/professional-profile/WorkplacePage.tsx`

Sekcje:
- **Hero** — nazwa, headline, baner, logo, owner public summary, status,
  visibility chips.
- **Opis** (sekcja warunkowa).
- **Kontakt** — strona www zawsze widoczna; email/telefon tylko gdy
  `policy.canViewContact({ visibility, verdict })` przepuści.
- **Akcje właściciela** — Edit/Archive/Visibility (disabled — wkrótce; brak
  fake no-op).
- **Mikro-feed miejsca pracy** (`WorkplaceMicroFeed`) — composer dla ownera,
  lista wpisów, empty state.

Routing: `/profile/workplaces/:slug` (`WorkplacePageRoute`).

## 6. Kontakt i widoczność

Policy `identity/workplaces/policy.ts#canViewContact`:

| `contactVisibility` ↓ \ `verdict` → | `owner` | `friend` | `approved_contact_fields` | `stranger` |
|---|---|---|---|---|
| `owner_only` | TAK | nie | nie | nie |
| `friends` | TAK | TAK | nie | nie |
| `approved_contact_fields` | TAK | TAK | TAK | nie |
| `public` | TAK | TAK | TAK | TAK |

`projectContactForViewer` strippuje email/phone na granicy gdy `canViewContact`
zwraca `false`. Strona miejsca pracy pokazuje wówczas subtelny komunikat
„Dane kontaktowe dostępne po zgodzie właściciela (`<level>`)".

## 7. Mikro-feed miejsca pracy

`server/domains-v2/content-v2/workplace-posts/`

- Wyłącznie owner miejsca pracy publikuje (sprawdzane przez
  `WorkplaceOwnershipResolver`, wiredowane z `identity/workplaces.public-api`
  przez `application-v2`).
- 5 `postType`: `update` / `realization` / `offer` / `photo_note` /
  `announcement`.
- 3 `visibility`: `workplace_public` / `friends_only` / `private`.
- Cursor + bounded limit (`WORKPLACE_POST_DEFAULT_LIMIT=20`,
  `WORKPLACE_POST_MAX_LIMIT=50`), stable order (createdAt desc + id).
- Public DTO bez PII.
- `deactivated` posty ukryte przed nie-ownerem.

## 8. Mini-zajawka na feedzie znajomych

`server/domains-v2/content-v2/workplace-teasers/`

- Tworzona przez `application-v2.createWorkplacePostWithFriendFeedTeaser`
  po publikacji wpisu w mikro-feedzie.
- Pomijana dla `private` postów (`deriveTeaserVisibility → null`).
- Dedupe per `sourcePostId` (`dedupeKey = workplace_post:<id>`).
- Preview: `buildPreviewText` truncuje do
  `WORKPLACE_POST_TEASER_PREVIEW_MAX = 240` znaków + „…".
- Nigdy nie eksponuje pełnego body ani danych kontaktowych.
- Visibility: `public` (od `workplace_public` post) / `friends_only`.
- Read scope: zawsze ograniczony do `viewer's friend set` (no global feed).
- `targetRoute = /profile/workplaces/:slug/posts/:postId` — klik prowadzi do
  pełnego wpisu na stronie miejsca pracy.

UI: `client/src/features-v2/friend-feed/FriendFeedWorkplaceTeaserCard.tsx`
— mała karta (border dashed, jasne tło, ikona „Z miejsca pracy", CTA
„Zobacz wpis"). Strukturalnie odróżnia się od `FriendFeedPostCard` (brak
reakcji, brak komentarzy, brak full body). FriendFeedPage rendr-uje listę
teaserów PRZED listą postów friend-feeda.

## 9. Warstwa zawodowa profilu osobistego

`client/src/features-v2/professional-profile/ProfileProfessionalLayer.tsx`

- Sekcja „Miejsca pracy" — owner widzi przycisk „Dodaj miejsce pracy"
  (`canAddWorkplace`), kliknięcie wywołuje `onAddWorkplace` (route).
- Lista publicznych miejsc pracy dla viewerów; ukrywa `archived` od
  nie-ownerów.
- Karty `WorkplaceCardUi` z relacją + visibility chip.
- Empty state truthful: „Nie dodano jeszcze miejsc pracy." dla ownera /
  „Ten użytkownik nie ma jeszcze widocznych miejsc pracy." dla innych.

## 10. Statusy

| Warstwa | Status |
|---|---|
| `server/domains-v2/identity/workplaces` | **BACKEND_PARTIAL** — in-memory store, public-api, 16 testów; DB adapter pending |
| `server/domains-v2/content-v2/workplace-posts` | **BACKEND_PARTIAL** — in-memory, 7 testów; DB pending |
| `server/domains-v2/content-v2/workplace-teasers` | **BACKEND_PARTIAL** — in-memory read-model z dedupe, 8 testów |
| `server/application-v2/use-cases/workplace-feed` | **BACKEND_PARTIAL** — orkiestracja, 7 testów |
| `client/src/features-v2/professional-profile` | **UI_SHELL_ONLY + MOCK_LOCAL_ONLY** — mock adapter |
| Friend-feed teaser card | **UI_SHELL_ONLY + MOCK_LOCAL_ONLY** |
| Outbox / event delivery | **OUTBOX_SKELETON** |
| DB persistence | **NOT_STARTED** (schema draft w sekcji 12 brief) |

## 11. Co NIE zostało wdrożone

- **Członkowie miejsca pracy.** (decyzja produktowa — miejsce pracy NIE jest
  społecznością).
- **Role admin/moderator/member miejsca pracy.**
- **Join / request / invite flow.**
- **Struktura społeczności / podspołeczności.**
- **Pełny feed społecznościowy z mikro-feedu** — friend feed pokazuje TYLKO
  mini-zajawkę z linkiem do pełnego wpisu.
- **Logo / banner upload** — media upload nie podpięty (MEDIA_UPLOAD_NOT_CONNECTED).
- **Edit / archive / visibility actions z UI** — owner actions disabled w UI
  shell; backend obsługuje, transport pending.
- **Wybór zawodu / specjalizacji w kreatorze** — DATA_PENDING (referencja
  zawodów wciąż w fazie reference-data-only).
- **DB adapter (drizzle/supabase)** — schema draft poniżej.
- **HTTP transport / router** — application-v2 use-case gotowe dla mountowania.

## 12. Schema draft (DB pending)

```sql
-- professional_workplaces
CREATE TABLE professional_workplaces (
  id                          text PRIMARY KEY,
  owner_user_id               text NOT NULL,
  owner_profile_id            text NOT NULL,
  name                        text NOT NULL,
  slug                        text NOT NULL,
  headline                    text NOT NULL DEFAULT '',
  description                 text NOT NULL DEFAULT '',
  profession_category_slug    text,
  profession_slug             text,
  specialization_slugs        text[] NOT NULL DEFAULT '{}',
  website_url                 text,
  contact_email               text,
  contact_phone               text,
  contact_visibility          text NOT NULL,
  location_text               text,
  online_available            boolean NOT NULL DEFAULT false,
  logo_ref                    text,
  banner_ref                  text,
  status                      text NOT NULL,
  visibility                  text NOT NULL,
  created_at                  timestamptz NOT NULL,
  updated_at                  timestamptz NOT NULL,
  deleted_at                  timestamptz,
  UNIQUE(owner_user_id, slug)
);
CREATE INDEX idx_workplaces_owner ON professional_workplaces(owner_user_id, status);
CREATE INDEX idx_workplaces_visibility ON professional_workplaces(visibility, status);

-- content_workplace_posts
CREATE TABLE content_workplace_posts (
  id              text PRIMARY KEY,
  workplace_id    text NOT NULL,
  author_user_id  text NOT NULL,
  body            text NOT NULL,
  media_refs      text[] NOT NULL DEFAULT '{}',
  post_type       text NOT NULL,
  visibility      text NOT NULL,
  status          text NOT NULL,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  deleted_at      timestamptz
);
CREATE INDEX idx_wpost_workplace_created ON content_workplace_posts(workplace_id, created_at DESC);
CREATE INDEX idx_wpost_status ON content_workplace_posts(status);

-- friend_feed_workplace_teasers
CREATE TABLE friend_feed_workplace_teasers (
  id                  text PRIMARY KEY,
  source_type         text NOT NULL,
  source_post_id      text NOT NULL,
  workplace_id        text NOT NULL,
  owner_user_id       text NOT NULL,
  workplace_name      text NOT NULL,
  workplace_slug      text NOT NULL,
  preview_text        text NOT NULL,
  preview_media_ref   text,
  visibility          text NOT NULL,
  dedupe_key          text NOT NULL UNIQUE,
  created_at          timestamptz NOT NULL
);
CREATE INDEX idx_teaser_owner_created ON friend_feed_workplace_teasers(owner_user_id, created_at DESC);
CREATE UNIQUE INDEX uq_teaser_source ON friend_feed_workplace_teasers(source_post_id);
```

DDL nie został wykonany w tym slice (NO `pnpm db push`, NO deploy).

## 13. Test evidence

Backend (vitest):

- `server/domains-v2/identity/workplaces/__tests__/workplaces-service.test.ts`
  — 16 testów: create / forbidden cross-owner / dup slug / unsafe URL /
  invalid URL / invalid slug / active limit / event emit / update / archive /
  friends_only visibility / contact gating (stranger / friend / owner) /
  viewer state / slug lookup.
- `server/domains-v2/content-v2/workplace-posts/__tests__/workplace-posts-service.test.ts`
  — 7 testów: owner-only publish / stranger denied / body required / data:
  media ref rejected / cursor + bounded limit / deactivated hidden / friends_only.
- `server/domains-v2/content-v2/workplace-teasers/__tests__/workplace-teasers-service.test.ts`
  — 8 testów: create from public post / skip private / dedupe / preview
  truncated / friends_only gated / owner sees own / no PII / media preview /
  bounded limit.
- `server/application-v2/use-cases/workplace-feed/__tests__/workplace-feed-use-case.test.ts`
  — 7 testów: viewer-scoped create / publish + teaser / private skips teaser /
  forbid non-owner publish / friend feed teaser visibility / page view (owner
  vs stranger contact) / professional layer relation flags.

Frontend (vitest + RTL):

- `client/src/features-v2/professional-profile/__tests__/WorkplaceWizard.test.tsx`
  — 3 testy: 5-step happy path / block step 1 without name+slug / reject
  javascript: URL.
- `client/src/features-v2/professional-profile/__tests__/ProfileProfessionalLayer.test.tsx`
  — 2 testy: owner add CTA + card click / stranger no add CTA, only public.
- `client/src/features-v2/professional-profile/__tests__/WorkplacePage.test.tsx`
  — 3 testy: owner hero + composer + contact / stranger no contact + no
  composer / owner publish flow.
- `client/src/features-v2/friend-feed/__tests__/FriendFeedWorkplaceTeaserCard.test.tsx`
  — 2 testy: preview + workplace label + CTA route + smaller than post /
  no contact leaks in DOM.

Łącznie Slice 12 dodaje **48 nowych testów**. Pełny suite: 1086 passed.

## 14. Guard evidence

```
pnpm check            → PASS  (tsc --noEmit, exit 0)
pnpm lint             → PASS  (eslint, exit 0)
pnpm test             → PASS  (142 files / 1086 tests, exit 0)
pnpm build            → PASS  (vite build, exit 0)
pnpm rules:check      → PASS  (43/43 guards)
pnpm arch:check:v2    → PASS  (9/9 guards: audit-domain-boundaries,
                                no-legacy-imports, removed-product-areas,
                                public-dto-pii, media-base64, pagination,
                                domain-registry, domain-scaffold,
                                feature-registry)
pnpm guards:all-local → PASS  (po dodaniu EXC-006/007/008 w EXCEPTIONS_REGISTER)
```

## 15. P0 / P1 / P2

- **P0 (blocking)** — brak.
- **P1 (next slice)** —
  - DB adapter (drizzle migrations + supabase repo) dla 3 tabel.
  - HTTP transport (router + handler) na top of application-v2 use-case.
  - Media upload integration dla logo/banner workplace (MEDIA_UPLOAD_NOT_CONNECTED).
  - Edit/Archive/Visibility owner actions (UI shell ma disabled buttons; backend obsługuje).
- **P2 (later)** —
  - Reference data dla zawodów/specjalizacji w kreatorze (DATA_PENDING).
  - Wzbogacenie teasera o counters (po wprowadzeniu reactions/comments dla workplace posts).
  - Notifications outbox delivery.

## 16. Następne rekomendowane kroki

1. Slice 13: DB adapter + HTTP transport dla workplaces (drizzle migration,
   supabase repository, fastify/elysia router).
2. Slice 14: workplace post reactions/comments + zaktualizowanie teasera
   o license-by-design dla licznikow.
3. Slice 15: media upload pipeline integration dla workplace logo/banner.

## 17. Zmienione pliki (lista)

Backend (server):

- `server/domains-v2/identity/workplaces/{dto,contracts,policy,projections,store,events,service,public-api,index,README}.ts`
- `server/domains-v2/identity/workplaces/__tests__/workplaces-service.test.ts`
- `server/domains-v2/content-v2/workplace-posts/{dto,contracts,policy,ports,store,projections,events,service,public-api,index}.ts`
- `server/domains-v2/content-v2/workplace-posts/__tests__/workplace-posts-service.test.ts`
- `server/domains-v2/content-v2/workplace-teasers/{dto,contracts,policy,ports,store,projections,events,service,public-api,index}.ts`
- `server/domains-v2/content-v2/workplace-teasers/__tests__/workplace-teasers-service.test.ts`
- `server/domains-v2/content-v2/public-api.ts` (re-export Slice 12 submodules)
- `server/application-v2/use-cases/workplace-feed/{service,types,public-api,README.md}`
- `server/application-v2/use-cases/workplace-feed/__tests__/workplace-feed-use-case.test.ts`

Frontend (client):

- `client/src/features-v2/professional-profile/{types,mock-adapter,public-api,index,README}.ts`
- `client/src/features-v2/professional-profile/{WorkplaceWizard,WorkplacePage,WorkplaceMicroFeed,ProfileProfessionalLayer}.tsx`
- `client/src/features-v2/professional-profile/Workplace.module.css`
- `client/src/features-v2/professional-profile/__tests__/*` (3 testy)
- `client/src/features-v2/friend-feed/FriendFeedWorkplaceTeaserCard.{tsx,module.css}`
- `client/src/features-v2/friend-feed/__tests__/FriendFeedWorkplaceTeaserCard.test.tsx`
- `client/src/features-v2/friend-feed/{FriendFeedPage,types,mock-adapter}.ts(x)` (lokalne typy teasera + integracja)
- `client/src/features-v2/feature-registry.ts` (`professional-profile` registered)
- `client/src/app-v2/AppRouter.tsx` (2 nowe route)
- `client/src/app-v2/profile/workplaces/{WorkplaceCreateRoute,WorkplacePageRoute}.tsx`

Tests / governance / docs:

- `client/src/app-v2/profile/__tests__/ProfilePage.test.tsx` (Slice 12
  reverses the "no separate domain folder" assertion → feature folder allowed)
- `scripts/check-feature-registry.mjs` (`professional-profile` in KNOWN_FEATURES)
- `docs/governance/DOMAIN_STATUS_REGISTRY.yml` (identity + content-v2
  evidence + notes)
- `docs/governance/EXCEPTIONS_REGISTER.md` (EXC-006, EXC-007, EXC-008)
- `docs/review/professional-profile-v2/LEGACY_WORKPLACE_UI_AND_FLOW_MAP.md`
- `docs/review/professional-profile-v2/WORKPLACES_SLICE_12_REPORT.md`

## 18. Status table

| Sekcja | Status |
|---|---|
| Legacy workplace inventory | PASS |
| Workplace wizard | PASS (UI_SHELL_ONLY) |
| Workplace domain | PASS (BACKEND_PARTIAL) |
| Workplace page | PASS (UI_SHELL_ONLY) |
| Contact/privacy policy | PASS |
| Workplace micro-feed | PASS (BACKEND_PARTIAL + UI_SHELL_ONLY) |
| Friend feed teaser | PASS (BACKEND_PARTIAL + UI_SHELL_ONLY) |
| Profile professional layer | PASS (UI_SHELL_ONLY) |
| Application-v2 orchestration | PASS (BACKEND_PARTIAL) |
| Persistence/migrations | PARTIAL (in-memory only; DDL draft in §12) |
| Frontend UI | PASS (UI_SHELL_ONLY + MOCK_LOCAL_ONLY) |
| DTO/PII/security | PASS |
| Architecture boundaries | PASS |
| Tests | PASS (48 new, 1086 total) |
| Guards | PASS (`check`, `lint`, `test`, `build`, `rules:check`,
  `arch:check:v2`, `guards:all-local`) |
| Readiness | **READY_FOR_PRODUCT_REVIEW** |
