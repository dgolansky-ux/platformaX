# HAND007 — PRODUCT_BACKEND_FOUNDATIONS (feed / communities / channels / public-hub / modules)

> **Trigger:** user wpisze `hand007`. Działaj autonomicznie, po polsku.
> **Branch:** `feat/contacts-v2-clean-room-slice` (PR #33). Pracuj na nim dalej.
> **Status:** IN_PROGRESS — 3 z ~6 części zrobione i wypchnięte. Reszta poniżej.

## Co JUŻ zrobione (committed + pushed, do `c5ebe3d`)

- **communities-v2** → `BACKEND_PARTIAL`. Pełny in-memory runtime:
  `dto/contracts/ports/policy/store/service/mapper/public-api` + tests.
  createCommunity tworzy founder membership; founder nieusuwalny; slug
  unique/valid; updateSettings founder/admin; requestJoin dedup; listPublic
  cursor; **CommunityAuthorityResolver** w public-api (dla channels/public-hub).
- **modules** → `BACKEND_PARTIAL`. `definitions` (5 whitelisted: topics, events,
  integrations, newsletter_chat, channel_entry) + `policy/store/service` +
  tests. enable/disable, owner-type validation, no business data.
- **channels** → `BACKEND_PARTIAL`. channel owned by community; follow ≠
  membership; authority robi APP use-case (nie domena). `dto/ports/policy/
  store/service/mapper/public-api` + tests.
- Status truth zaktualizowany w: `domain-registry.ts`,
  `DOMAIN_STATUS_REGISTRY.yml`, `DOMAIN_OWNERSHIP_MATRIX.md`, `DOMAIN_REGISTRY.md`.

## Co ZOSTAŁO do zrobienia (kolejność)

1. **content-v2 / friend feed foundation** (`server/domains-v2/content-v2/`,
   już ma submoduły `posts/feeds/read-models`). Post entity (id, authorUserId,
   contextType, contextId, visibility private|friends|public, body, mediaRefs?,
   status, timestamps). `FriendFeedItemDTO` (postId, author public summary ref,
   body preview, mediaRefs, createdAt, visibility, context — no PII). Feed query
   z viewerId + cursor + limit + maxLimit + stable order. Read-model SKELETON z
   jednym ownerem (udokumentuj w README). **NIE**: comments/reactions runtime,
   global feed, ranking, sync fanout. Status: BACKEND_PARTIAL / READ_MODEL_SKELETON.

2. **public-hub foundation** (`server/domains-v2/public-hub/`). HubViewModel
   (ownerType profile|community, ownerId, public owner summary, enabled modules,
   visible sections — no raw records, no PII). Domena KOMPOZYCYJNA — czyta tylko
   public-api/contracts owner-domen; brak source-of-truth. Status BACKEND_PARTIAL.

3. **application-v2/use-cases** (flow 2+ domen, małe i testowalne):
   - `communities/createCommunityWithDefaults` (community + founder membership +
     opcjonalnie domyślne module enablement przez modules public-api).
   - `channels/createChannelForCommunity` (sprawdza `CommunityAuthorityResolver`
     z communities public-api → woła channels.createChannelForCommunity).
   - `public-hub/getProfileHubView` + `getCommunityHubView` (identity/community
     public summary + modules enabled list).
   - `feed/getFriendFeedFoundation` (social relationship + content feed query).
   Wszystko TYLKO przez public-api/contracts — zero internals.

4. **Frontend communities shell** (`client/src/features-v2/communities/` +
   `client/src/app-v2/communities/`, route `/communities`). „Społeczności":
   Moje społeczności / Odkrywaj / empty / loading / error; community card
   (nazwa/opis/widoczność/memberCount); CTA Otwórz + „Utwórz społeczność"
   (disabled/truthful jeśli brak transportu). MOCK_LOCAL_ONLY adapter (czyta
   shared/fixtures, NIE @server/*). Sidebar/nav entry jeśli pasuje. Tests RTL.

5. **Dokumentacja**: `docs/review/product-backend-foundations/REPORT.md`
   (zakres, co wdrożono/nie, statusy domen, use-cases, testy, guardy, P0/P1/P2,
   next 3 kroki). Zaktualizuj README + DOMAIN_STATUS_REGISTRY dla content-v2/
   public-hub gdy zmienią status.

## WAŻNE wzorce / pułapki (z tej sesji)

- **NIE** nazywaj pliku in-memory `repository.ts` — `audit-domain-boundaries`
  blokuje re-export z „repository" w public-api. Używaj `store.ts` + `ports.ts`.
- Factory service ≤80 linii (guard) — wynoś metody do funkcji modułowych
  (wzór: communities/channels service.ts).
- Paginacja: `check-scalability-hot-paths` chce słowa `order|sort` w bloku
  funkcji; `check-scalability-patterns` chce widocznego cap przy `Promise.all`
  (`.slice(`/`MAX_`/`limit`). Markery: `// SCALABILITY_HOT_PATH_EXCEPTION:` i
  `// SCALABILITY_EXCEPTION:` (z uzasadnieniem) gdy realnie bounded read-path.
- Public DTO bez PII; `dto.ts` musi mieć komentarz `privacy classification:
  Public DTO` (guard check-dto-privacy-classification).
- Po graduacji domeny zaktualizuj `__tests__/domain-contract.test.ts` (asercja
  „SCAFFOLD_ONLY no surface" → „exposes factory") ORAZ 4 status-source'y.
- Bramki: `pnpm check`, `lint`, `rules:check` (43), `arch:check:v2`,
  `guards:all-local`, `depcruise:check`. Pełny `pnpm test` bywa flaky pod
  obciążeniem (timeouty na auth/jsdom) — to BLOCKED_BY_ENVIRONMENT, weryfikuj
  celowanymi `vitest run <path>`. NIE generuj audit ZIP (chyba że owner poprosi).
- Commit scope-enum: użyj `v2` (np. `feat(v2): ...`); `communities/channels`
  itp. NIE są dozwolone w commitlint.
- **NIE ruszaj konta demo** (profile owner-gating jest celowy + chroniony testem
  regresji). Frontend bez `@server/*`.

## Pełna komenda źródłowa
Patrz prompt „TASK: DEEP — PlatformaX V2 Product Backend Foundations" w historii
PR/sesji (feed/communities/channels/public-hub/modules + application-v2 + frontend).
