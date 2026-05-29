# HAND007 — PRODUCT_BACKEND_FOUNDATIONS (feed / communities / channels / public-hub / modules)

> **Trigger:** user wpisze `hand007`. Działaj autonomicznie, po polsku.
> **Branch:** `feat/contacts-v2-clean-room-slice` (PR #33). Pracuj na nim dalej.
> **Status:** BACKEND DONE — zostaje TYLKO frontend communities shell (pkt 4).
> Backend (content-v2, public-hub, wszystkie 4 use-cases) jest zrobiony,
> zielony na bramkach i wypchnięty. Frontend odłożony świadomie (decyzja ownera).

## Backend ukończony (committed, do `649cc8a`)

- **content-v2** → `PARTIAL` (BACKEND_PARTIAL / READ_MODEL_SKELETON). Posts
  (createPost + EMPTY_BODY) + friend-feed (listFriendFeed: cursor, DEFAULT 20/
  MAX 50, `canSeePost`, scoped do author set, BEZ global feed). Commit `6091065`.
- **public-hub** → `PARTIAL` (COMPOSITION). `createPublicHubService`:
  getProfileHubView/getCommunityHubView z resolver-portów (contracts), zero
  danych własnych. Commit `c4c6bf6`.
- **application-v2/use-cases** (commit `649cc8a`): `communities/
  createCommunityWithDefaults`, `channels/createChannelForCommunity`
  (authority-gated), `public-hub/getProfile+CommunityHubView` (wiring
  resolverów z identity/communities/modules), `feed/getFriendFeedFoundation`
  (social friends → content scoped feed). Każdy tylko przez public-api/contracts.
- **Raport**: `docs/review/product-backend-foundations/REPORT.md`.
- Status truth dla content-v2 + public-hub zaktualizowany w 4 źródłach.

## Co JUŻ zrobione wcześniej (committed + pushed, do `c5ebe3d`)

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

## Co ZOSTAŁO do zrobienia (TYLKO frontend)

> Punkty 1–3 i 5 są ZROBIONE (patrz „Backend ukończony" wyżej). Zostaje pkt 4.

4. **Frontend communities shell** (`client/src/features-v2/communities/` +
   `client/src/app-v2/communities/`, route `/communities`). „Społeczności":
   Moje społeczności / Odkrywaj / empty / loading / error; community card
   (nazwa/opis/widoczność/memberCount); CTA Otwórz + „Utwórz społeczność"
   (disabled/truthful jeśli brak transportu). MOCK_LOCAL_ONLY adapter (czyta
   shared/fixtures, NIE @server/*). Sidebar/nav entry jeśli pasuje. Tests RTL.

5. ~~Dokumentacja `docs/review/product-backend-foundations/REPORT.md`~~ —
   ZROBIONE (raport + status truth content-v2/public-hub w 4 źródłach).

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
