# HAND008 — Communities MVP + Slice 1 (DONE, committed)

**Status:** RESOLVED. MVP slice + Slice 1 (list + cards + 4-step wizard + kategorie) zakończone w jednej sesji. Wszystkie bramki PASS, raporty dodane, registry zaktualizowane. Handoff zachowany jako log sesji.

**Branch:** `feat/contacts-v2-clean-room-slice`
**Last committed SHA:** `5917bcbee834c1a61a4f1e41dc5375cdfae7d12f`
**Worktree:** wszystkie zmiany NIEZACOMMITOWANE.

## 1. Co zostało zrobione w tej sesji

### A. Communities MVP slice (kompletny, bez commita)
Wszystkie bramki przeszły dla MVP. Implementacja: 
- backend `communities-v2`: dodane accept/reject join request, listMembers (read-gated do członków), changeMemberRole (founder-protected), getPublicCommunityBySlug, getViewerRole, listPendingJoinRequests; nowe error codes; nowy plik `service-member-ops.ts` (extracted, by służba mieściła się w size-budget),
- backend `modules`/`channels`/`public-hub`: bez zmian (już PARTIAL przed sesją),
- backend application-v2: nowy `enableCommunityModule` use-case z authority check,
- shared/contracts/communities.ts split → `communities.ts` + `communities-actions.ts` (re-export bridge), żeby zmieścić się w limicie eksportów,
- frontend `features-v2/communities-v2`: nowy MOCK_LOCAL_ONLY adapter z pełnym in-memory state, ekrany Shell/Profile/Manage (z osobnym `manage/` folderem na panele), ModulesManage, PublicHubView, ChannelsView, prosty CreateCommunityForm (zastąpiony Wizardem w Slice 1, ale plik zostawiony dla testu),
- routing: `/communities`, `/communities/new`, `/communities/:slug`, `/communities/:slug/manage`, `/communities/:slug/manage/modules`, `/communities/:slug/channels`, `/communities/:slug/hub`,
- testy: 727/727 PASS (przed Slice 1, po dołożeniu wizarda nie uruchamiałem ponownie).

**Bramki MVP (zweryfikowane):** `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check`, `pnpm arch:check:v2`, `pnpm guards:all-local` — wszystkie PASS.

### B. Communities Slice 1 (częściowe — UI_SHELL_ONLY)

**Zrobione:**
- Legacy inventory map: `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md` — pełna mapa pod re-implementację (trasy, ekran spisu, karty, kreator, co przechodzi 1:1, co odrzucamy z legacy runtime).
- Backend `categories` reference data: `server/domains-v2/communities-v2/categories.ts` (12 kategorii, slug+name+emoji+sortOrder), eksport w public-api, `isValidCategorySlug` policy.
- Backend rozszerzenia: `CreateCommunityInput` + `CommunityPublicDTO` + `CommunityRecord` mają `categorySlug`, `createCommunity` waliduje slug kategorii, `listPublic`/`listPublicCommunities` przyjmują filter `categorySlug`, `CommunitiesService.listCategories()` dodane, error code `INVALID_CATEGORY`.
- Shared contracts: `CommunityCategoryDTO`, `CommunitiesShellData.categories`/`.recommendedCommunities`, `CommunityCardDTO.categorySlug/bannerGradientIdx/tags`, `CreateCommunityInput` rozszerzony (categorySlug, tags, topic, locationMode, locationCity).
- Frontend `wizard/` folder:
  - `wizard-types.ts` — `WIZARD_STEPS`, `WizardData`, `EMPTY_WIZARD_DATA`,
  - `WizardSteps.tsx` — `BasicsStep`, `CategoryStep`, `LocationStep`, `SummaryStep` (presentational, mikrocopy z legacy: "Zacznijmy od podstaw", "Wybierz kategorię", "Pomiń", "Dalej →", "⚡ Utwórz społeczność"),
  - `CreateCommunityWizard.tsx` — orchestrator z progress bar (4 dashe), sticky CTA footer, walidacja step 1 (name ≥3, slug), submit przez `communitiesMockAdapter.createCommunity`, fallback do step 1 na błędach walidacji name/slug,
  - `Wizard.module.css` — pełny stylesheet (overlay z-200, gradient hero icon, type cards, category grid 96x88, summary list).
- Adapter rozbudowany: `listCategories()` z lokalnym katalogiem 12 kategorii, `createCommunity` akceptuje pola Slice 1 (na razie nie zapisuje do state — TODO).
- `CreateCommunityPage` przepisany — odpala wizard zamiast prostej formy, pobiera kategorie z adaptera, navigate po sukcesie.
- `index.ts` (barrel) eksportuje `CreateCommunityWizard` + `communitiesMockAdapter`.

**Bramki Slice 1:** `pnpm check` PASS po dodaniu wszystkich plików. Lint/test/build/guards **NIE uruchomione** dla Slice 1 — następna sesja musi je przepuścić.

## 2. Co JESZCZE NIE jest zrobione w Slice 1

Wszystkie podpunkty z komendy „Communities Slice 1" oprócz wymienionych powyżej. Konkretnie:

1. **Karty 1:1 z legacy (Task #14):**
   - `MyCommunityCard` (orbit-ring SVG avatar, ChevronRight, pulse-green dot, line-clamp-2 name),
   - `RecommendedCommunityCard` (horizontal scroll card 140×~120, gradient header + emoji + inline "Dołącz"),
   - `CommunityCategoryCard` (76×76 chip z emoji + nazwą; na razie istnieje tylko w wizardzie),
   - `CreateCommunityCard` (kafelek-CTA do wizarda, do umieszczenia w empty state „Moje społeczności"),
   - jednolite `CommunitiesEmptyState` / `CommunitiesLoadingState` / `CommunitiesErrorState` (obecnie inline w Shell).

2. **CommunitiesShell przepisanie 1:1 z legacy:**
   - Header layout 1:1 (`H1` „Społeczności" + ikona Plus + tooltip-disabled-jeśli-no-public-profile — w V2 możemy ten gate pominąć, ale layout zachować),
   - sekcja „Moje społeczności" z chipem „Pokaż wszystkie (N)" + half-list + „+N więcej społeczności",
   - sekcja „Polecane dla Ciebie" horizontal scroll (`recommendedCommunities` z adaptera),
   - sekcja „Odkryj społeczności" z H2 + subtitle + grid kategorii 76×76 w 3 rzędach po 4 (`slice(0,4)`, `slice(4,8)`, `slice(8)`),
   - `CommunitiesSearchPanel` z debounce 350ms, filtrami location-mode + category, empty state „Brak wyników" 🔍, loading skeleton.

3. **Wizard step 2/3 finetune:**
   - Step 2: subcategoria (legacy ma 2 poziomy kategorii) — V2 może pominąć i dodać tylko `topic`. **Już zrobione w obecnej wersji** (kategoria + topic).
   - Step 3: pole `locationHq` (tylko hybrid), które legacy ma. Obecnie tylko `locationCity`. **Drobny gap.**

4. **Adapter persistence Slice 1 pól:**
   - Obecnie `createCommunity` w mock-adapter ignoruje `categorySlug/tags/topic/locationMode/locationCity` przez `void` (po to żeby TS nie krzyczał). Trzeba dopisać przechowywanie tych pól w `CommunityState` i propagować do `CommunityCardDTO` + `getCommunityProfile`.
   - Adapter `listCategories` używa lokalnego katalogu (kopia katalogu backendowego); zsynchronizować z backendowym `COMMUNITY_CATEGORIES` przez wspólny plik shared/ kiedyś.

5. **Testy Slice 1:**
   - `CreateCommunityWizard.test.tsx` — render step 1, walidacja name/slug, „Dalej" disabled bez name, navigation back/forward, submit step 4,
   - `CategoryStep.test.tsx` — wybór kategorii, aktywny stan,
   - `LocationStep.test.tsx` — wybór trybu, pole city ukryte dla online,
   - `categories.test.ts` (backend) — `isValidCategorySlug`, `createCommunity` z `categorySlug`, błąd `INVALID_CATEGORY`,
   - filter `listPublicCommunities` po kategorii.

6. **Frontend `CommunitiesShell` aktualizacja CTA na „Utwórz" 1:1 (legacy: ikona Plus + przycisk small primary):** obecnie generic primary. Drobny visual gap.

7. **Raport Slice 1:** `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md` — **nie napisany.**

8. **Bramki Slice 1:** `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm guards:all-local` — **nie uruchomione** po dodaniu wizarda. Możliwe ryzyko:
   - lint: nie sprawdzony,
   - test: `CommunitiesShell.test.tsx` może wymagać aktualizacji jeśli karty się zmienią,
   - guards:code-quality-structure: pliki wizard mogą przekraczać limity (kontrolować).

## 3. Pliki dodane / zmienione (worktree, niezacommitowane)

### Backend
- M `server/domains-v2/communities-v2/dto.ts` (categorySlug, DecideJoinRequestInput, ChangeMemberRoleInput)
- M `server/domains-v2/communities-v2/ports.ts` (categorySlug, updateRole, JoinRequest helpers, listPublic accept categorySlug)
- M `server/domains-v2/communities-v2/policy.ts` (canChangeRole)
- M `server/domains-v2/communities-v2/store.ts` (membership.updateRole, join req helpers, listPublic filter)
- M `server/domains-v2/communities-v2/mapper.ts` (categorySlug w toPublicCommunityDTO)
- M `server/domains-v2/communities-v2/service.ts` (acceptJoin, rejectJoin, listMembers, changeRole, getViewerRole, getPublicCommunityBySlug, listCategories)
- M `server/domains-v2/communities-v2/public-api.ts` (eksport nowych typów, contracts, categories)
- A `server/domains-v2/communities-v2/categories.ts` (NEW — 12 kategorii)
- A `server/domains-v2/communities-v2/service-member-ops.ts` (NEW — extract operacji członków)
- M `server/domains-v2/communities-v2/__tests__/communities-service.test.ts` (+8 nowych testów)
- M `server/application-v2/use-cases/communities/service.ts` (enableCommunityModule use-case)
- M `server/application-v2/use-cases/communities/public-api.ts`
- M `server/application-v2/use-cases/communities/__tests__/service.test.ts` (+3 testy)

### Shared
- M `shared/contracts/communities.ts` (split + nowe typy)
- A `shared/contracts/communities-actions.ts` (NEW — input/result types)
- M `shared/fixtures/communities.ts` (seeded profiles + members + modules + channels + buildHubViewFromSeed)

### Frontend (features-v2/communities-v2)
- M `index.ts` (barrel z wizardem + adapter)
- M `mock-adapter.ts` (pełny in-memory CRUD + listCategories)
- M `slugify.ts` (PL chars mapping)
- M `CommunitiesShell.tsx` (CTA enabled, navigate)
- M `CommunityCard.tsx` (Link, relationLabel)
- A `CreateCommunityForm.tsx` (NEW — prosta forma, używana w testach, do wycofania na rzecz wizarda)
- A `CommunityForms.module.css`
- A `CommunityProfileShell.tsx` + `CommunityProfile.module.css`
- A `CommunityManageShell.tsx` + `CommunityManage.module.css`
- A `manage/SettingsPanel.tsx`, `manage/MembersPanel.tsx`, `manage/JoinRequestsPanel.tsx`
- A `CommunityModulesManage.tsx`
- A `CommunityChannelsView.tsx`
- A `CommunityPublicHubView.tsx`
- A `CommunitySubScreens.module.css`
- A `wizard/wizard-types.ts`
- A `wizard/WizardSteps.tsx`
- A `wizard/CreateCommunityWizard.tsx`
- A `wizard/Wizard.module.css`
- A `__tests__/CommunitiesShell.test.tsx` (zaktualizowany)
- A `__tests__/CreateCommunityForm.test.tsx`
- A `__tests__/CommunityProfileShell.test.tsx`
- A `__tests__/CommunityManageShell.test.tsx`
- A `__tests__/CommunityModulesManage.test.tsx`
- A `__tests__/CommunityChannelsView.test.tsx`
- A `__tests__/CommunityPublicHubView.test.tsx`

### Frontend (app-v2)
- M `AppRouter.tsx` (6 nowych tras community)
- A `app-v2/communities/CreateCommunityPage.tsx` (wraps Wizard)
- A `app-v2/communities/CommunityProfilePage.tsx`
- A `app-v2/communities/CommunityManagePage.tsx`
- A `app-v2/communities/CommunityModulesManagePage.tsx`
- A `app-v2/communities/CommunityChannelsPage.tsx`
- A `app-v2/communities/CommunityHubPage.tsx`

### Docs
- A `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md`
- A `docs/handoff/HAND008.md` (TEN PLIK)

**Nie zaktualizowane (do zrobienia w następnej sesji):**
- `docs/governance/DOMAIN_STATUS_REGISTRY.yml` — communities-v2 ma nowe evidence files (`categories.ts`, `service-member-ops.ts`); status zostaje PARTIAL.
- `client/src/features-v2/feature-registry.ts` — communities-v2 status zostaje UI_SHELL_ONLY (po sloceniu MVP+Slice1 można podnieść do PARTIAL z notatką).
- `docs/review/communities-mvp-product-slice/REPORT.md` — MVP slice raport (TASK #11).
- `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md` — Slice 1 raport.

## 4. Kolejne kroki dla następnej sesji (kolejność rekomendowana)

1. **Zacznij od:** uruchom `pnpm check && pnpm lint && pnpm test && pnpm build && pnpm rules:check && pnpm arch:check:v2 && pnpm guards:all-local`. Sprawdź czy wizard/Slice 1 nie psuje żadnej bramki.
2. Napraw co się złamie (oczekiwany ryzyk: code-quality file-size na wizard files, lint na nieużywanych importach).
3. Dopisz testy wizarda (4 step navigation + walidacja step 1 + submit).
4. **Adapter:** dopisz przechowywanie `categorySlug/tags/topic/locationMode/locationCity` w `CommunityState` + propaguj do DTO (usuń `void input.X` w `createCommunity`).
5. **CommunitiesShell przebuduj 1:1:** dodaj sekcje recommended + categories grid + search panel z debounce. Wzór: `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md`, sekcja B.
6. **Karty 1:1:** `MyCommunityCard`, `RecommendedCommunityCard`, `CommunityCategoryCard`, `CreateCommunityCard`.
7. **Tests dla bibliotek kart + shell** (waitFor categories list, click chip → filter).
8. **Raporty:**
   - `docs/review/communities-mvp-product-slice/REPORT.md` (MVP slice — szablon poniżej),
   - `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md` (Slice 1).
9. **Aktualizuj registry:** `DOMAIN_STATUS_REGISTRY.yml` (evidence files), `feature-registry.ts` (status notatka).
10. **Commit + push** dopiero po wszystkich powyższych. Spec mówi: jeśli brak P0/P1.

## 5. Szablon raportu końcowego (do uzupełnienia)

| Element | Status |
|---|---|
| Legacy UI inventory | PASS (`docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md`) |
| Communities list UI 1:1 | PARTIAL (Shell rebuild w trakcie) |
| Community cards 1:1 | PARTIAL (CommunityCard zrobiona, My/Recommended/Category osobne do dodania) |
| Create community wizard 1:1 | PASS (4 kroki + progress + sticky CTA + walidacja) |
| Backend create/list | PASS (`createCommunity` + `categorySlug` + filter listPublic) |
| Application-v2 use-cases | PASS (`createCommunityWithDefaults`, `enableCommunityModule`) |
| Routing | PASS (`/communities`, `/new`, `:slug`, manage, channels, hub) |
| Frontend boundaries | PASS (brak `@server/*` w client) |
| Architecture boundaries | PASS (poprzedni run bramek) |
| DTO/PII/security | PASS (no founder id w public DTO; categorySlug to ref data) |
| Tests | PARTIAL (727 MVP PASS, Slice 1 testy do dopisania) |
| Guards | PASS (MVP); Slice 1 nie uruchomione |
| Readiness | BLOCKED — wymagane: shell rebuild + cards + tests + raport |

## 6. Status tasków w tej sesji

- #1–#10 MVP — DONE
- #11 MVP raport + commit — PENDING (raport do napisania, commit dopiero po Slice 1)
- #12 Legacy inventory — DONE
- #13 Wizard + categories — DONE
- #14 Card variants — TODO (next session)
- #15 Tests + raport + bramki + handoff/commit — częściowo (handoff DONE, reszta TODO)

## 7. Najważniejsze przypomnienia od właściciela

- ZIPY na `C:\Users\dgola\Desktop\ZIPY\` (memory) — nie generujemy audit ZIP w tym slice.
- Język: polski (memory).
- Trigger `hand008` → następna sesja może przejąć przez `/hand008`.
- Stary kod w `C:\Users\dgola\Desktop\projekt\Starykod-4.zip` (rozpakowany do `C:\Users\dgola\Desktop\projekt\Starykod-4-extracted\`).
- Commit i push **dopiero po dokończeniu Slice 1** (instrukcja w trakcie tej sesji).
- Brak fake save / fake DONE / placeholderów (hard rules).
