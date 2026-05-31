# SLICE 20C — Architecture & Boundaries

## 1. Domeny

`server/domains-v2/` zawiera 18 domen (wszystkie z `public-api.ts` + `__tests__/`):
audit, channels, chat, communities-v2, content-v2, events, events-v2, identity, integrations-v2, media, moderation, modules, newsletter-chat-v2, notifications, notifications-v2, public-hub, search, social, system, topics-v2.

`domain-registry.ts` (`server/domains-v2/domain-registry.ts`) jest źródłem prawdy. Guard `check-domain-registry.mjs` PASS.

## 2. Application layer

`server/application-v2/use-cases/` zawiera 18 grup use-case (z README per-grupa):
channel-content, channel-interactions, channels, communities, community-feeds, community-interactions, contacts, feed, friend-feed, media, moderation, notifications, personal-profile-view, profile, public-hub, publishing, social, workplace-feed.

`server/application-v2/{app-shell,onboarding,publisher}/` — pomocnicze. `publisher` ma `service.ts`, `registry.ts`, `targets/*` — orchestruje publikację cross-domain.

## 3. Boundaries — wyniki guardów

| Guard | Wynik |
|---|---|
| `audit-domain-boundaries.mjs` | PASS |
| `check-no-legacy-imports.mjs` | PASS |
| `check-removed-product-areas.mjs` | PASS |
| `check-architecture-import-graph.mjs` | PASS |
| `check-domain-registry.mjs` | PASS |
| `check-domain-scaffold.mjs` | PASS |
| `check-feature-registry.mjs` | PASS |
| `check-domain-status-registry.mjs` | PASS |
| `check-runtime-readiness-status.mjs` | PASS |
| `check-public-dto-pii.mjs` | PASS |
| `check-dto-privacy-classification.mjs` | PASS |
| `check-media-base64.mjs` | PASS |
| `check-pagination.mjs` | PASS |
| `check-migration-safety.mjs` | PASS |
| `check-dependency-discipline.mjs` | PASS |
| `check-dependency-change-policy.mjs` | PASS |
| `check-ai-agent-permissions.mjs` | PASS |
| `arch:check:v2` (umbrella, 9 sub-guardów) | PASS |

## 4. Cross-domain / `/internal/` audit

- Grep `client/src` po `@server/*` → tylko *komentarze* "no `@server/*` imports" w mock-adapterach. **Brak realnych importów cross-layer.**
- Grep `server` po `@client/*` → 0 hits.
- Grep `/internal/` w client → 0 hits.
- Grep `/internal/` w server → wszystkie hits to same-domain (np. `domains-v2/identity/*` ⇒ `domains-v2/identity/internal/*`). **Brak cross-domain internal access**.

Przykład poprawnej dyscypliny:
- `server/domains-v2/identity/internal/private-profile-dto.ts` — owner-only PII DTO.
- `server/domains-v2/identity/public-api.ts` exportuje TYLKO publiczne fragmenty.
- `server/domains-v2/identity/private-dto.ts` re-eksportuje typ z `/internal/` jako `PrivateProfileDTO` (z dokumentacją, że `public-api.ts` NIE może tego eksportować).

## 5. `as any` / `@ts-ignore` audit

Grep w `**/*.{ts,tsx}` całego repo:
| Plik | Klasyfikacja |
|---|---|
| `server/domains-v2/notifications-v2/__tests__/notifications-v2-settings.test.ts` | test fixture |
| `server/domains-v2/identity/__tests__/contact-access-service.test.ts` | test fixture |
| `tests/architecture/fixtures/bad-unused-export.ts` | celowo zły fixture (do red-case'ów) |
| `tests/architecture/fixtures/bad-cross-domain-internal.ts` | jak wyżej |
| `tests/architecture/fixtures/bad-client-to-server.tsx` | jak wyżej |
| `tests/architecture/fixtures/bad-circular-a.ts` | jak wyżej |
| `tests/architecture/fixtures/bad-circular-b.ts` | jak wyżej |

**Brak `as any` / `@ts-ignore` / `@ts-nocheck` w produkcyjnym kodzie.** Guard `check-no-any-types.mjs` jest częścią `guards:all-local`, PASS.

## 6. Storage / I/O audit

Grep w `client/src` po `localStorage|sessionStorage|readAsDataURL|FileReader`:
- Tylko **komentarze**: "no `localStorage`/`sessionStorage`" (w mock-adapter nagłówkach).
- I tylko **testy guard**: `no-storage.test.ts` w `media/` i `identity/profile/`, `ProfileRuntime.test.tsx`, `ProfilePage.test.tsx` (testy, że runtime NIE używa).
- Guard `check-media-base64.mjs` PASS (zakaz base64/readAsDataURL).
- Guard `check-logging-pii-security.mjs` PASS.

**Brak runtime localStorage / sessionStorage / readAsDataURL.**

## 7. `alert()` / `confirm()` / `prompt()` audit

- Tylko 1 hit: `professional-profile/__tests__/WorkplaceWizard.test.tsx:60` — XSS guard test (`value: "javascript:alert(1)"`).
- **Brak runtime browser dialogs.**

## 8. Dependency-cruiser

`pnpm depcruise:check` → **0 errors, 44 warnings**:
- 44× `warn no-orphans` na pustych `index.ts` w scaffold dirs (`features-v2/audit`, `system`, `shared-ui`, `search`, `notifications`, `feature-registry.ts`, `events`, `content-v2`, `chat`, `application-v2/index.ts`, `app-shell/index.ts`, `test-setup.ts` itp.).
- To są scaffoldy do nadchodzących slice'ów, **niczego nie naruszają**.

## 9. Knip (martwe eksporty/pliki) — nie uruchomione w tym audycie

`knip:check` jest w `tooling:weekly`, nie został odpalony — zalecam uruchomić niezależnie i wpisać do P2 jeśli pojawi się długa lista.

## 10. Content ownership

| Domena | Co posiada |
|---|---|
| `content-v2` | posts, comments, reactions, feeds (friend/community/channel/workplace), publisher |
| `social` | znajomi, kontakty, blokowanie |
| `media-v2` (jako `media`) | upload, validation, URL signing |
| `notifications-v2` | events, settings, mapper, registry |
| `modules` vs module data (`topics-v2`, `events-v2`, `integrations-v2`, `newsletter-chat-v2`) | rozdzielone — `modules/` jest meta-rejestrem (definitions, allowedOwnerTypes), per-typ ma własną domenę |
| `public-hub` | KOMPOZYCJA (slots), NIE źródło prawdy |
| `workplaces` (w `professional-profile` + `content-v2/workplace-posts` + `content-v2/workplace-teasers`) | osobny, NIE community-copy |
| `channels` | osobny, NIE community membership |
| `friend-feed` | osobny, NIE global feed |

**Wszystkie ownership respektowane.** Guard `check-removed-product-areas.mjs` PASS (zakaz powrotu „Usług", legacy global feed, community-copy workplaces).

## 11. Verdykt architektoniczny

**STATUS: PASS** — żadnych naruszeń granic, czyste public-api, brak cross-domain internal access, zero `as any` w produkcji, zero PII leakage. Bramki w 100 %.

Jedyne uwagi:
- 44 orphans w pustych scaffoldach (akceptowalne — to przygotowanie pod kolejne slice'y).
- Bundle 724 KB — nie architektura, ale podział kodu (manualChunks). P2.
