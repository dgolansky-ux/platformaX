# ADR-016 — Manage Dashboard: thin orchestrator + port pattern + owner-only guard

- **Status:** Accepted
- **Date:** 2026-05-30
- **Slice:** 21
- **Depends on:** ADR-003 (cross-domain integration boundaries), ADR-010 (application-v2 use-cases boundary), ADR-011 (single read-model owner), ADR-014 (policy pure functions).
- **Governance:** [`docs/governance/RULES_REGISTRY.md`](../../governance/RULES_REGISTRY.md), [`docs/governance/GOVERNANCE_INDEX.md`](../../governance/GOVERNANCE_INDEX.md). Normative statements below ("musi", "NIE", "wymagane") are bound by these registries.

## Context

Zakładka „Zarządzaj" (`/manage`) miała być przed Slice 21 ekranem zawodów — błędna decyzja produktowa: jeden dashboard reprezentuje **13 niezależnych obszarów** (Konto, Profil, Prywatność, Kontakt, Znajomi, Powiadomienia, Media, Warstwa zawodowa, Miejsca pracy, Moduły, Kanały, Społeczności zarządzane, Bezpieczeństwo). Każdy obszar ma własną domenę (czasem swój własny `domains-v2/*`), własne policy i własne DTOs.

Rozważano trzy podejścia:

1. **God-service** — jeden duży `ManageService` w którejś z domen, importujący wszystko bezpośrednio.
2. **Fan-out frontend** — 13 osobnych zapytań do osobnych adapterów, frontend skleja.
3. **Thin orchestrator + port** — application-v2 use-case zna interfejs (`ManageDashboardPort`) i woła go równolegle (`Promise.all`).

## Decision

Wybrano **#3 — Thin orchestrator + port + owner-only guard**:

- `server/application-v2/use-cases/manage/service.ts` jest **cienką** warstwą kompozycji. NIE posiada encji, NIE mutuje stanu domeny, NIE robi logiki biznesowej — wywołuje zdefiniowane operacje `ManageDashboardPort`.
- `ManageDashboardPort` (w `snapshots.ts`) deklaruje **12 metod load*Snapshot** zwracających płaskie, owner-only snapshoty (`ManageOwnerSummary`, `ManagePrivacySnapshot`, `ManageContactSnapshot`, …, `ManageSecuritySnapshot`).
- 13 per-sekcja builderów (`section-builders.ts`) bierze 1 snapshot i produkuje 1 DTO sekcji. Każdy builder jest **czystą funkcją** — testowalny w izolacji.
- `getManageDashboardView(currentUserId, targetUserId)`:
  - sprawdza `currentUserId` non-empty → `UNAUTHENTICATED`
  - sprawdza `currentUserId === targetUserId` → `OWNER_MISMATCH`
  - waliduje że owner istnieje → `INTERNAL` jeśli nie
  - dispatcher `Promise.all([…11 snapshotów…])`
  - kompozycja 13 sekcji + `sectionStatuses`
- `ManageDashboardDTO` żyje w `shared/contracts/manage-dashboard.ts` + per-sekcja typy w `shared/contracts/manage-dashboard-sections.ts` (split aby zmieścić się w `check-code-quality-structure.mjs` limit 15 eksportów/plik).
- Frontend (`client/src/features-v2/manage/`) konsumuje **wyłącznie** DTO z `@shared/contracts/manage-dashboard*` przez własny `ManageDashboardAdapter`. Mock `manageMockAdapter` implementuje ten interfejs in-memory. Przyszły HTTP adapter jest drop-in.

### Owner-only access — jeden punkt egzekucji

Owner-only guard żyje **w jednym miejscu**: `getManageDashboardView`. Per-sekcja builders NIE wiedzą o tożsamości — dostają już zwalidowane snapshoty. To ogranicza powierzchnię błędu i czyni audyt trywialnym (jeden test `OWNER_MISMATCH` chroni cały dashboard).

### PII discipline

- `accountEmailMasked` (a NIE `email`) w `AccountSection`.
- Brak `phone` jako wartości — `fieldsAvailable: readonly ("email" | "phone")[]` w `ContactSection` to ENUM nazw pól (nie wartość), z markerem `ALLOW_PRIVATE_DTO_PII` w nagłówku pliku.
- Wszystkie snapshoty są agregatami (counts, statusy), nigdy raw record.
- Test `manage-service.test.ts` → `does not leak PII (phone/raw email)` skanuje `JSON.stringify(DTO)` przeciwko regex'om.

## Consequences

### Pozytywne
- Każda sekcja DTO ma **jedno źródło prawdy** (ADR-011 respected) — owner identity domain dla account/profile, social dla friends/contact, media-v2 dla media itd.
- Owner-only guard w jednym miejscu — łatwy audyt, jeden test.
- Buildery są małe (≤ 80 linii każdy) i pure → łatwe do testowania i refaktoryzacji.
- Frontend nie musi znać 13 osobnych adapterów; jeden `ManageDashboardAdapter` wystarcza.
- Port pattern umożliwia 1:1 podmianę mock → HTTP bez zmian w `service.ts`.

### Negatywne / koszty
- `getManageDashboardView` jest tłustsze niż pojedynczy use-case (12× `await` w `Promise.all`). Akceptowalne — wszystkie snapshoty są niezależne, równoległy fetch jest dokładnie tym czego potrzebujemy.
- `ManageDashboardPort` powiększa surface mockowania w testach (12 metod). Mitigated przez fabrykę `makePort()` w teście, która domyślnie wszystkie metody implementuje.
- Per-sekcja DTO mogą się rozrosnąć (nowe pola, np. `account.lastLogin`). To zaakceptowane — limit 15 eksportów per plik wymusza split, ale split jest tani.

### Alternatywy odrzucone
- **God-service**: łamie ADR-003 (cross-domain). 13 importów z domen w jednej klasie = 13 punktów couplingu. Audyt cross-domain by się sypał.
- **Fan-out frontend**: każde wejście na `/manage` to 13 niezależnych żądań HTTP. Owner-only guard byłby rozproszony po 13 endpointach.

## Implementation references

- `server/application-v2/use-cases/manage/service.ts` — orchestrator.
- `server/application-v2/use-cases/manage/snapshots.ts` — port type + 12 snapshot interfaces.
- `server/application-v2/use-cases/manage/section-builders.ts` — 13 pure builders.
- `server/application-v2/use-cases/manage/__tests__/manage-service.test.ts` — owner-only, PII, status, dispatch.
- `shared/contracts/manage-dashboard.ts` + `manage-dashboard-sections.ts` — DTO.
- `client/src/features-v2/manage/` — UI dashboard + deep-dive editors.
- `client/src/app-v2/manage/` — route shells `/manage` + `/manage/*`.
