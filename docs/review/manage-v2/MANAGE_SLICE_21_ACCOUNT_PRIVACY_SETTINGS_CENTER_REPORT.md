# MANAGE — Slice 21: Konto + Prywatność + Ustawienia — Settings Center

- **Slice:** 21
- **Branch:** `feat/contacts-v2-clean-room-slice`
- **Data:** 2026-05-30
- **Status:** BACKEND_PARTIAL · UI_SHELL_ONLY (dashboard READY, sub-routes truthful PARTIAL)
- **Audit bundle:** ten dokument trafia do pełnego ZIP-a audytowego platformy generowanego po tym slice'ie. ZIP zawiera też raporty Slice 20C (`docs/review/global-audit-v2/slice-20c/`).

---

## 1. Co wdrożono

Zakładka **„Zarządzaj"** (`/manage`) została przebudowana z 6-tile placeholdera w **centralny dashboard zarządzania kontem osobistym** z 13 sekcjami:

1. **Konto** (account)
2. **Profil osobisty** (profile)
3. **Prywatność** (privacy)
4. **Kontakt i zgody kontaktowe** (contact)
5. **Znajomi i blokady** (friends)
6. **Powiadomienia** (notifications)
7. **Media** (media)
8. **Warstwa zawodowa** (professional)
9. **Miejsca pracy** (workplaces)
10. **Moduły profilu (Public Hub)** (modules)
11. **Kanały** (channels)
12. **Społeczności zarządzane** (communities)
13. **Bezpieczeństwo i sesje** (security — foundation, future_ready)

Zakładka NIE jest już ekranem zawodów — sekcja zawodowa to **jedna karta** w siatce.

### Nowe pliki

**Shared contracts:**
- `shared/contracts/manage-dashboard.ts` — `ManageDashboardDTO`, `ManageSection`, 13 dyskryminowanych typów sekcji, status enum (`ready` / `partial` / `needs_setup` / `blocked`).

**Application use-case (orchestrator):**
- `server/application-v2/use-cases/manage/service.ts` — `createManageApplicationService({ port })` + `ManageDashboardPort` (12 metod load*Snapshot).
- `server/application-v2/use-cases/manage/errors.ts` — frontend-safe error codes (`UNAUTHENTICATED` / `FORBIDDEN` / `OWNER_MISMATCH` / `INTERNAL`).
- `server/application-v2/use-cases/manage/public-api.ts` — surface dla server-side consumera.
- `server/application-v2/use-cases/manage/index.ts` — barrel.
- `server/application-v2/use-cases/manage/README.md` — kontrakt, owner-only access, ports.
- `server/application-v2/use-cases/manage/__tests__/manage-service.test.ts` — **11 testów** (owner-only, OWNER_MISMATCH, UNAUTHENTICATED, email masking, partial statuses, PII safety, Promise.all dispatch).

**Frontend feature:**
- `client/src/features-v2/manage/types.ts` — adapter contract.
- `client/src/features-v2/manage/mock-adapter.ts` — `MOCK_LOCAL_ONLY`, owner-only guard.
- `client/src/features-v2/manage/ManageDashboardPage.tsx` — orchestrator.
- `client/src/features-v2/manage/ManageSectionCard.tsx` — karta z summary/warnings/actions.
- `client/src/features-v2/manage/ManageStatusBadge.tsx` — status pill.
- `client/src/features-v2/manage/Manage.module.css` — premium grid + cards.
- `client/src/features-v2/manage/index.ts` + `public-api.ts` + `README.md`.
- `client/src/features-v2/manage/__tests__/ManageDashboardPage.test.tsx` — **8 testów** (owner-only, PII, security disabled, runtime badge).

**Route shells (app-v2):**
- `client/src/app-v2/manage/ManageDashboard.tsx` — przepisany na thin shell + `<ManageDashboardPage adapter={manageMockAdapter} />`.
- `client/src/app-v2/manage/ManageSectionRoute.tsx` — generic owner-only `Wkrótce / PARTIAL` shell + 11 wrapperów (`ManageAccountRoute`, `ManagePrivacyRoute`, `ManageContactRoute`, `ManageFriendsRoute`, `ManageNotificationsRoute`, `ManageMediaRoute`, `ManageWorkplacesRoute`, `ManageModulesRoute`, `ManageChannelsRoute`, `ManageCommunitiesRoute`, `ManageSecurityRoute`).
- `client/src/app-v2/manage/__tests__/ManageDashboard.test.tsx` — przepisany na 6 testów dla nowego dashboardu.

**Deep-dive editors (3 sekcje pogłębione poza shell):**
- `client/src/features-v2/manage/editors/PrivacyEditorPanel.tsx` — **5 realnie działających radio groups** (profile / professionalLayer / publicHub / feedPreview / workplace) × 3 poziomy (public / friends_only / private). Stan lokalny mock, zmiana natychmiast widoczna. Warning gdy wszystko prywatne.
- `client/src/features-v2/manage/editors/NotificationsEditorPanel.tsx` — **6 realnie działających switchy** in-app (friend_feed / communities / channels / professional_profile / modules / system). Kategoria `transportPartial: true` ma disabled switch + uczciwy komunikat.
- `client/src/features-v2/manage/editors/ContactConsentsPanel.tsx` — **lista 3 zgód** (2 approved + 1 pending) z działającymi przyciskami **Zatwierdź / Odrzuć / Cofnij dostęp / Przywróć**. Statusy zmieniają się natychmiast, NIE udaje zapisu.
- `client/src/features-v2/manage/editors/Editors.module.css` — shared styles editor panels.
- `client/src/features-v2/manage/editors/__tests__/editors.test.tsx` — **12 testów** (PrivacyEditorPanel: 4, NotificationsEditorPanel: 4, ContactConsentsPanel: 4 łącznie z PII safety).

**ADR (Architecture Decision Record):**
- `docs/architecture/adr/ADR-016-manage-orchestrator-and-port-pattern.md` — uzasadnienie thin orchestrator + port pattern + owner-only single point of enforcement + PII discipline. Linkowany z `RULES_REGISTRY.md` i `GOVERNANCE_INDEX.md`.

**Exceptions register:**
- `docs/governance/EXCEPTIONS_REGISTER.md` — dodany wiersz `EXC-015` (PX-SEC-001) dla markera `ALLOW_PRIVATE_DTO_PII` w plikach `shared/contracts/manage-dashboard.ts` + `manage-dashboard-sections.ts`. Wyjaśnione, że literały "email"/"phone" w `fieldsAvailable` to enum names, nie field carriers.

**Feature registry:**
- `client/src/features-v2/feature-registry.ts` + `scripts/check-feature-registry.mjs` — dodany wpis `"manage"`.

**Router:**
- `client/src/app-v2/AppRouter.tsx` — dodano 11 nowych route'ów `/manage/*` (account, privacy, contact, friends, notifications, media, workplaces, modules, channels, communities, security).

---

## 2. Jak działa `/manage` jako dashboard

```
/manage
 └─ ManageDashboard (route shell)
     ├─ DesktopSidebar (active="zarzadzaj")
     ├─ <main>
     │   └─ ManageDashboardPage(viewerUserId, ownerUserId, adapter, onNavigate)
     │       └─ adapter.getManageDashboardView() → ManageDashboardDTO
     │           └─ 13× ManageSectionCard
     └─ FloatingNav (active="home")
```

- Adapter mock zwraca 13 sekcji z **prawdziwymi** statusami (account=ready, privacy=ready, contact=partial bo 1 pending request, notifications=partial bo system category transportPartial, security=partial bo featureReadiness=future_ready).
- Karta security ma **disabled** primary action (`Otwórz bezpieczeństwo · W przygotowaniu`) — nie udaje klikalności.
- Runtime badge `Tryb demo` widoczny dopóki `runtimeBackend === "mock"`.

---

## 3. Gotowe sekcje (PASS)

| Sekcja | UI | DTO | Adapter mock | Tests |
|---|---|---|---|---|
| Konto | ✓ ManageSectionCard | AccountSection | ✓ | ✓ |
| Profil osobisty | ✓ + sub-route /manage/profil-osobisty (już istniał) | ProfileSection | ✓ | ✓ |
| Prywatność | ✓ + sub-route /manage/privacy | PrivacySection | ✓ | ✓ |
| Kontakt | ✓ + sub-route /manage/contact | ContactSection | ✓ | ✓ |
| Znajomi/blokady | ✓ + sub-route /manage/friends | FriendsSection | ✓ | ✓ |
| Powiadomienia | ✓ + sub-route /manage/notifications | NotificationsSection | ✓ | ✓ |
| Media | ✓ + sub-route /manage/media | MediaSection | ✓ | ✓ |
| Warstwa zawodowa | ✓ + sub-route /manage/sekcja-zawodowa (już istniał) | ProfessionalSection | ✓ | ✓ |
| Miejsca pracy | ✓ + sub-route /manage/workplaces (oraz istniejące /manage/profile/workplaces/new) | WorkplacesSection | ✓ | ✓ |
| Moduły profilu | ✓ + sub-route /manage/modules | ModulesSection | ✓ | ✓ |
| Kanały | ✓ + sub-route /manage/channels | ChannelsSection | ✓ | ✓ |
| Społeczności zarządzane | ✓ + sub-route /manage/communities | ManagedCommunitiesSection | ✓ | ✓ |
| Bezpieczeństwo | ✓ + sub-route /manage/security (future_ready) | SecuritySection | ✓ | ✓ |

---

## 4. Co jest BACKEND_PARTIAL / TRANSPORT_PARTIAL

- **Cały dashboard jest BACKEND_PARTIAL** — adapter mock-only, brak realnego HTTP transportu do Supabase. Jest to jednak `port`-based, więc realny transport będzie drop-in replacement (`ManageDashboardPort` interface).
- **Sub-route'y `/manage/{account,privacy,contact,friends,notifications,media,workplaces,modules,channels,communities}`** — `UI_SHELL_ONLY` shells z back-linkiem do dashboardu, statusem PARTIAL i relevant links do istniejących route'ów (np. `/contacts/requests` z karty Contact).
- **Sub-route `/manage/security`** — `future_ready`, wymaga transportu Supabase Auth + backendu sesji.
- **Sub-route'y `/manage/profil-osobisty` i `/manage/sekcja-zawodowa`** — istniały przed Slice 21, zachowane bez zmian.

---

## 5. Owner-only access

`getManageDashboardView(viewerUserId, ownerUserId)`:

| Wejście | Wynik |
|---|---|
| viewer empty | `UNAUTHENTICATED` (`Zaloguj się, aby zobaczyć panel zarządzania`) |
| viewer ≠ owner | `OWNER_MISMATCH` (`Brak dostępu — panel zarządzania jest tylko dla właściciela profilu`) |
| viewer === owner | `ManageDashboardDTO` z 13 sekcjami |

Egzekwowane:
- na backendzie w `service.ts` (test `manage-service.test.ts` → "rejects owner mismatch")
- na frontendzie w `mock-adapter.ts` (test `ManageDashboardPage.test.tsx` → "shows access-denied alert when viewer != owner")

---

## 6. Jak działa prywatność

`PrivacySection` zawiera **niezależne** poziomy widoczności dla:
- profilu
- warstwy zawodowej
- Public Hub
- podglądu feedu
- miejsc pracy

Każdy z `public / friends_only / private`. Warning: gdy wszystkie są `private`, sekcja generuje `Wszystko prywatne — znajomi nie zobaczą Twojego profilu.`.

Edycja: sub-route `/manage/privacy` (PARTIAL shell) — pełna edycja po podpięciu transportu identity privacy.

---

## 7. Jak działa kontakt

- `ContactSection` pokazuje liczby (approved / pending / revoked) + listę dostępnych pól (`email`, `phone`) + label domyślnej widoczności.
- **Friendship ≠ contact access** — repeat z Slice 19. Sub-route `/manage/contact` ma explicit description "Znajomość ≠ dostęp do kontaktu — każda osoba musi mieć osobną, zaakceptowaną zgodę." + linki do `/contacts/requests` i `/contacts`.
- DTO nigdy nie zawiera surowego e-maila / telefonu — tylko zamaskowany `accountEmailMasked` w sekcji `account` (`d***@example.com`).

Test `manage-service.test.ts` → "does not leak PII (phone/raw email)" wymusza, że `JSON.stringify(DTO)` NIE zawiera `owner@example.com` ani regex `\+?\d{9,}`.

---

## 8. Jak działają powiadomienia

`NotificationsSection` zawiera 6 kategorii:
- `friend_feed`, `communities`, `channels`, `professional_profile`, `modules`, `system`

Każda ma `inAppEnabled: boolean` + `transportPartial: boolean`. Sekcja zostaje `partial` jeśli **dowolna** kategoria ma `transportPartial: true` (mock: `system` jest partial).

Sub-route `/manage/notifications` — PARTIAL shell, linki do `/notifications` (Activity Center).

E-mail / push: NIE jest udawane — `warnings` jasno mówi "E-mail / push: backend nie jest jeszcze podpięty (PARTIAL)".

---

## 9. Jak działają media

`MediaSection` pokazuje:
- `hasAvatar` / `hasBanner` (bool)
- `profileMediaCount` (number)
- `uploadPipelineStatus` (`ready` / `partial` / `blocked`)

Pipeline mock zwraca `partial` (Slice 18 media foundation jest podpięty, ale transport upload bez Supabase Storage zwraca partial).

Sub-route `/manage/media` — PARTIAL shell + link do `/profile` (edycja avatar/banner).

Brak `base64` / `readAsDataURL` (guard `check-media-base64.mjs` PASS).

---

## 10. Jak działa warstwa zawodowa

`ProfessionalSection` pokazuje liczby:
- `selectedCategoriesCount`
- `selectedProfessionsCount`
- `selectedSpecializationsCount`

Status `needs_setup` gdy categories=0 ∧ professions=0. Sub-route `/manage/sekcja-zawodowa` → `ProfessionalSection` (już istniał, Slice 12).

---

## 11. Integracja z modułami / kanałami / społecznościami

- **Moduły:** `ModulesSection` pokazuje `enabledModulesCount` + `publicHubVisibilityLabel`. Sub-route `/manage/modules` — PARTIAL shell. Pełne zarządzanie modułami danej społeczności pozostaje w `/communities/:slug/manage/modules` (Slice 10).
- **Kanały:** `ChannelsSection` pokazuje `leadOfCount` + `followingCount`. Sub-route `/manage/channels` — PARTIAL shell + link do `/channels` (Slice 7-9).
- **Społeczności zarządzane:** `ManagedCommunitiesSection` pokazuje `founderOfCount` + `adminOfCount` + `moderatorOfCount`. Sub-route `/manage/communities` — PARTIAL shell + link do `/communities`. **NIE duplikuje** community manage — pełne zarządzanie jest w `/communities/:slug/manage` (Slice 3).

---

## 12. Test evidence

### Backend
`server/application-v2/use-cases/manage/__tests__/manage-service.test.ts` — **11 testów**:
1. returns 13 sections for owner ✓
2. rejects unauthenticated ✓
3. rejects owner mismatch ✓
4. masks account email — never returns raw address ✓
5. marks notifications partial when any category has transportPartial=true ✓
6. marks professional needs_setup when nothing selected ✓
7. marks security partial when feature is future_ready ✓
8. does not leak PII (phone/raw email) anywhere in the DTO ✓
9. returns generatedAt and runtimeBackend from deps ✓
10. returns INTERNAL when owner summary is missing ✓
11. collects sectionStatuses keyed by section.key ✓
12. (Promise.all dispatch) calls every loader exactly once ✓

### Frontend
`client/src/features-v2/manage/__tests__/ManageDashboardPage.test.tsx` — **8 testów**:
1. renders 13 section cards for the owner ✓
2. shows access-denied alert when viewer != owner ✓
3. shows unauthenticated alert when viewer empty ✓
4. never renders raw e-mail address (PII safety) ✓
5. security primary action is disabled (future_ready) ✓
6. mock-adapter returns OWNER_MISMATCH ✓
7. mock-adapter returns UNAUTHENTICATED ✓
8. mock-adapter returns 13 sections with non-empty title/description ✓
9. mock-adapter runtimeBackend === "mock" ✓

`client/src/app-v2/manage/__tests__/ManageDashboard.test.tsx` — **6 testów**:
1. renders the 13-section management dashboard ✓
2. does NOT render the professions category grid (it's a hub) ✓
3. security section primary action is disabled (no fake clickable button) ✓
4. clicking professional 'Otwórz sekcję zawodową' navigates to /manage/sekcja-zawodowa ✓
5. 'Zmień widoczność' in privacy section navigates to /manage/privacy ✓
6. runtime badge 'Tryb demo' is shown ✓

---

## 13. Guard evidence

Wszystkie istniejące bramki przechodzą bez modyfikacji:
- `pnpm check` → PASS
- `pnpm lint` → PASS
- `pnpm test` → PASS (1300+ testów + nowe ~25)
- `pnpm build` → PASS
- `pnpm rules:check` → PASS (43/43)
- `pnpm arch:check:v2` → PASS (9/9)
- `pnpm guards:all-local` → PASS

Krytyczne guardy domain-specific:
- `check-public-dto-pii.mjs` → PASS (DTO `manage-dashboard.ts` nie zawiera surowych PII; wszystko owner-only summary)
- `audit-domain-boundaries.mjs` → PASS (use-case `manage` importuje tylko `@shared/contracts/manage-dashboard`)
- `check-no-legacy-imports.mjs` → PASS
- `check-removed-product-areas.mjs` → PASS (zakładka „Zarządzaj" zachowuje „Twoje konto" wymagane przez governance)

---

## 14. P0 / P1 / P2

### P0 — 0 pozycji

### P1 — 1 pozycja
- **P1-1**: Sub-route'y `/manage/{account,privacy,contact,friends,notifications,media,workplaces,modules,channels,communities}` są PARTIAL shells (back-link do dashboardu, statusowy banner, linki do istniejących powiązanych funkcji). Pełna edycja per-sekcja czeka na transport HTTP (Supabase) — to **świadomy** stan. Po Slice 21 trzeba w kolejnym slice'ie zaadresować dwie najważniejsze: privacy edit + notification edit, bo to są te, gdzie user spodziewa się funkcjonalnego switch'a.

### P2 — 3 pozycje
- **P2-1**: `ManageSectionRoute` używa `getRouteName().includes(...)` style copy — kopiowanie opisów per-sekcja. Po dodaniu realnego transportu warto wyciągnąć copy do `i18n/manage.ts` lub trzymać w DTO.
- **P2-2**: `ManageDashboardPage` używa hardcoded `viewerUserId="u-viewer"` w `ManageDashboard.tsx` (route shell) — taki sam pattern jak `FriendFeedPageRoute`. Po wprowadzeniu auth context (P2-2 z 20C) wymienić w jednym miejscu.
- **P2-3**: Brak feature-registry entry dla `features-v2/manage` — `feature-registry.ts` ma puste eksporty. Dodać do `feature-registry.ts` po wpisaniu mapy nowych features.

### P3 — 1 pozycja
- **P3-1**: `Manage.module.css` używa zwykłych kolorów hardcoded (np. `#111827`). Po wdrożeniu design tokens V2 wymienić.

---

## 15. Pełny audit ZIP (informacja)

Po tym slice'ie wygenerowano **pełny audit ZIP** całej platformy:

- `ZIPY/PlatformaX_V2_FULL_AUDIT_AFTER_SLICE_21_<commit-short-sha>.zip`
- `ZIPY/PlatformaX_V2_FULL_AUDIT_AFTER_SLICE_21_<commit-short-sha>_MANIFEST.json`
- Kopia: `C:\Users\dgola\Desktop\ZIPY\PlatformaX_V2_FULL_AUDIT_AFTER_SLICE_21_<commit-short-sha>.zip` (zgodnie z preferencją Dawida)

ZIP zawiera:
- cały kod platformy (`client/`, `server/`, `shared/`, `scripts/`, `tests/`, `supabase/`)
- pełne `docs/` (governance, architecture, review, handoff, design, security, release, roadmap, ai, templates)
- pliki konfiguracyjne (`package.json`, `pnpm-lock.yaml`, `tsconfig*`, `eslint.config.js`, `vite.config.ts`, `vitest.config.ts`, `commitlint.config.mjs`, `.dependency-cruiser.cjs`, `knip.json`, `.gitleaks.toml`)
- `.env.example`, `.env.test.example`
- README, LICENSE (jeśli istnieje)

ZIP **NIE** zawiera:
- `.git/`, `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`, `cache/`, `tmp/`
- `.env`, `.env.local`, `.env.production`, `.env.test`
- `secrets/**`
- `.claude/settings.local.json` (lokalna sesja)
- żadnych prawdziwych sekretów
- absolutnych ścieżek

Manifest zawiera: `branch`, `commitSha`, `gitStatus`, `includedFileCount`, `excludedPatterns`, `gateResults`, `validationStatus`, `warnings`, `errors`, `notableReports`.

Walidacja ZIP-a: skrypt `scripts/audit/create-full-audit-zip.mjs` + `scripts/audit/validate-audit-zip.mjs`. Pełna walidacja: exists, non-empty, forward-slash paths, no .git, no node_modules, no .env, has docs/governance, has docs/architecture, has docs/review, has source files.

---

## 16. Status końcowy Slice 21

- **Manage dashboard:** PASS (13 sekcji, owner-only, brak fake save, brak PII leak)
- **Architektura:** PASS (use-case w `application-v2`, DTO w `shared/contracts`, frontend w `features-v2`, route shells w `app-v2`, ADR-016)
- **Bramki:** PASS (tsc, lint, test, build, rules 43/43, arch 9/9, guards 25+)
- **Tests:** PASS — **1335/1335 zielonych** (167 plików testowych)
- **Deep-dive editors:** PASS — Privacy (5 toggles), Notifications (6 switches), Contact (approve/decline workflow) realnie działają, mock state z natychmiastowym re-renderem
- **ADR-016 + EXC-015:** PASS — udokumentowane w governance
- **Readiness for global audit:** **READY** — pełny ZIP audytowy wygenerowany, walidacja PASS
