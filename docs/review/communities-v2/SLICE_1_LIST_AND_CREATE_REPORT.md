# Communities Slice 1 — Lista + Karty + Kreator (clean-room V2)

**Branch:** `feat/contacts-v2-clean-room-slice`
**Status:** READY_FOR_PRODUCT_REVIEW. Wszystkie bramki PASS.

## 1. Legacy pliki przeanalizowane

`docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_1_UI_MAP.md` zawiera pełną mapę. Źródło: `C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities/`. Przeanalizowano `pages/Communities.tsx`, `pages/CommunitiesCards.tsx`, `pages/CommunitiesSearchPanel.tsx`, `pages/CommunitiesComponents.tsx`, `pages/CommunitiesListView.tsx`, `components/CommunityWizard.tsx`, `components/CommunityWizardShared.tsx`, `components/CommunityWizard.CategoryStep.tsx`, `components/CommunityWizard.LocationStep.tsx`, `components/CommunityWizard.SummaryStep.tsx`. Pozostałe ekrany (CommunityDetail*, Members, Modules, Settings, ManageStructure*, SubCommunityWizard*) świadomie poza zakresem Slice 1.

## 2. Co przeniesiono 1:1 wizualnie

- Hierarchia ekranu: `H1` „Społeczności" + CTA „Utwórz społeczność" + search panel + sekcje „Moje społeczności" / „Polecane dla Ciebie" / „Odkryj społeczności" (grid kategorii).
- Struktura kart: `MyCommunityCard` z avatar 52×52, orbit-ring SVG (kropkowane stroke), pulse-green dot, Crown przy founderze, ChevronRight tail. `RecommendedCommunityCard` 140×~120 z gradient headerem, emoji kategorii, inline „Dołącz" CTA. `CommunityCategoryCard` jako 76×76 chip z emoji + nazwą.
- 4-step kreator: full-screen overlay (z-200), header z back-arrow + krok N z 4, progress bar (4 dashe), sticky CTA footer („Pomiń" + „Dalej →" lub „⚡ Utwórz społeczność").
- Mikrocopy z legacy: „Zacznijmy od podstaw", „Nadaj nazwę i opisz...", „Każdy może dołączyć"/„Tylko po zaproszeniu", „Krok N z 4", „Polecane dla Ciebie", „Odkryj społeczności", „Wybierz kategorię, aby przeglądać publiczne społeczności", „Pokaż wszystkie", „+N więcej społeczności", „Brak wyników", „Tworzenie…", „Anuluj".

## 3. Co odrzucono z legacy runtime

| Element | Powód |
|---|---|
| tRPC (`trpc.communities.*`) | Brak HTTP transportu V2 — adapter MOCK_LOCAL_ONLY. |
| `wouter` `useLocation` | V2 używa `react-router-dom`. |
| `sonner` toast | Brak zależności — inline error/success. |
| `fileToBase64` + `DraggableImage` | base64 upload zakazany (media domain ma typed upload-intent). |
| `RULE_EXCEPTION(id=1)` `any` casts | V2 ma `no-any`/`no-as-any` rule. |
| `useAuth` z `_core/hooks` | V2 ma `identity` feature. |
| `_shared/components/DesktopLayout` | V2 ma `DesktopSidebar` per route. |
| `PageLoader variant="list"` | V2 używa lokalnych loading/empty/error stanów. |
| localStorage/sessionStorage jako fake backend | Zakazane. |
| Subcommunity wizard, CommunityDetail*, Members/Settings/Modules pages | Poza zakresem Slice 1. |

## 4. Jak działa `/communities`

`CommunitiesShell` ładuje przez `communitiesMockAdapter.listCommunitiesShell()` zwracający `{ myCommunities, discoverCommunities, recommendedCommunities, categories }`. Renderuje:

1. Header: H1 + button „＋ Utwórz społeczność" → `/communities/new`.
2. `CommunitiesSearch`: collapsible panel; po rozwinięciu `<input type="search">` z debounce 350ms + chipy „Tryb działania" (Online/Stacjonarna/Hybrydowa) + chipy kategorii. „Wyczyść filtry" gdy aktywne.
3. **Tryb non-search:**
   - `MyCommunitiesSection` — half-list + toggle „Pokaż wszystkie (N)" / „Zwiń"; empty-state to `CreateCommunityCard` CTA.
   - `RecommendedSection` — horizontal-scroll row z `RecommendedCommunityCard`; emoji per categorySlug.
   - `CategoriesSection` — grid `auto-fill, minmax(76px, 1fr)` z `CommunityCategoryCard`. Aktywny chip = filtruje search.
4. **Tryb search:** grid `auto-fill, minmax(280px, 1fr)` z `CommunityCard` per result albo empty 🔍 „Brak wyników".

## 5. Jak wyglądają karty

- **`CommunityCard`** (pełny widok w search results / discover) — avatar gradient + tytuł + opis + meta (members + visibility) + Link CTA z `relationLabel` (Dołącz / Otwórz / Poproś o dołączenie / Zarządzaj).
- **`MyCommunityCard`** — kompaktowy row z orbit-ring SVG, pulse-green dot, ChevronRight.
- **`RecommendedCommunityCard`** — 140-wide pionowy kafelek z gradient headerem (6 wariantów `bannerGradientIdx`), inline „Dołącz" CTA gdy viewer to nie-członek.
- **`CommunityCategoryCard`** — 76×76 chip emoji + nazwa, `aria-pressed`.
- **`CreateCommunityCard`** — dashed border CTA tile, prowadzi do `/communities/new`.

## 6. Jak działa kreator tworzenia społeczności

`CreateCommunityWizard` renderuje 4 kroki w full-screen overlay:

1. **Podstawy** (`BasicsStep`): Nazwa (required, ≥3 znaki, max 100, counter), Opis (opcjonalny, max 500), Typ (Publiczna/Prywatna jako karty z ikonami 🌐/🔒). Auto-derive `slug` z nazwy przez `slugify` (z mapowaniem polskich znaków).
2. **Kategoria** (`CategoryStep`): grid kategorii (12 chipów z emoji + nazwą), wybór aktywny → border primary. Opcjonalne pole „Główny temat".
3. **Lokalizacja** (`LocationStep`): 3 karty trybu (Online 📶 / Stacjonarna 📍 / Hybrydowa 🔁). Pole „Miasto / region" widoczne dla Stacjonarna + Hybrydowa.
4. **Utwórz** (`SummaryStep`): cover preview (gradient 🚀) + lista `<dl>` z Nazwa, Slug, Typ, Kategoria, Lokalizacja, Opis.

Submit przez `communitiesMockAdapter.createCommunity` — żaden fake save: adapter trzyma in-memory state z founder membership, kategoriami, tagami i location data. Po sukcesie callback `onCreated(profile)` w `CreateCommunityPage` woła `navigate(\`/communities/${slug}\`)`.

## 7. Co jest realnie podpięte do backendu

- **Walidacja sluga / kategorii / duplikatu** — `communities-v2` service: `INVALID_SLUG`, `SLUG_TAKEN`, `INVALID_CATEGORY`.
- **Founder membership** — atomicznie razem z community.
- **Lista kategorii** — `communities-v2/categories.ts` (12 ref kategorii) + `service.listCategories()` posortowane.
- **Filter publicznych** — `listPublicCommunities(cursor, limit, categorySlug)` w repository.
- **Brak HTTP transportu** — adapter frontendowy trzyma in-memory state z własnym katalogiem kategorii (sync z backend). To jest jawne TRANSPORT_PARTIAL + MOCK_LOCAL_ONLY.

## 8. Co jest UI_SHELL_ONLY / TRANSPORT_PARTIAL

- `features-v2/communities-v2`: status **UI_SHELL_ONLY + MOCK_LOCAL_ONLY**. Wszystkie operacje przez `communitiesMockAdapter` (in-memory).
- `server/index.ts` to wciąż health stub — brak HTTP routera dla communities. TRANSPORT_PARTIAL.

## 9. Co świadomie NIE jest wdrażane w Slice 1

- Modules (CommunityModulesPage, CommunityModulesOnboarding) — zakres Slice 3+.
- Feeds (3 feedy społeczności z legacy).
- Subcommunities (SubCommunityWizard).
- Pełny profil społeczności (CommunityDetail/header/tabs/broadcast/info) — Slice 2.
- Members/settings (Members page, Settings page, AdminDelegationPanel, FeedSettingsPanel) — Slice 2+.
- Chat / events / RingPost / Stripe Connect.
- Algorytm discovery — recommendedCommunities to bounded slice z discover, nie ranking.

## 10. Test evidence

- `server/domains-v2/communities-v2/__tests__/communities-service.test.ts` — 17 testów (createCommunity, slug rules, public DTO no PII, founder protection, join lifecycle, role changes, categories, filtering).
- `server/application-v2/use-cases/communities/__tests__/service.test.ts` — 6 testów (createWithDefaults, enableCommunityModule authority).
- `client/src/features-v2/communities-v2/__tests__/CommunitiesShell.test.tsx` — 5 testów (header, CTA navigation, search filtering, category chips, error state).
- `client/src/features-v2/communities-v2/__tests__/CreateCommunityWizard.test.tsx` — 4 testy (step 1 disabled until name ≥3, full 4-step submit, back button, cancel).
- `__tests__/CreateCommunityForm.test.tsx`, `CommunityProfileShell.test.tsx`, `CommunityManageShell.test.tsx`, `CommunityModulesManage.test.tsx`, `CommunityChannelsView.test.tsx`, `CommunityPublicHubView.test.tsx` — 23 testy MVP.

**Razem: 733/733 PASS.**

## 11. Guard evidence

| Bramka | Status |
|---|---|
| `pnpm check` (tsc --noEmit) | PASS |
| `pnpm lint` (eslint, --max-warnings=0) | PASS |
| `pnpm test` (vitest, 106 files) | PASS (733/733) |
| `pnpm build` (vite) | PASS (237 modules, ~437 kB JS) |
| `pnpm rules:check` | PASS |
| `pnpm arch:check:v2` | PASS |
| `pnpm guards:all-local` | PASS (24/25, [EXT] = branch protection) |

## 12. P0/P1/P2

- **P0:** brak.
- **P1:** brak.
- **P2:**
  - HTTP transport nadal nieobecny (TRANSPORT_PARTIAL).
  - Adapter mockowy duplikuje katalog kategorii z backendowym (do zsynchronizowania w shared/ później).
  - Persistence in-memory (BACKEND_PARTIAL) — DB adapter docelowo.
  - Wizard step 3 nie ma pola `locationHq` (legacy ma) — drobny wizualny gap; opisany w UI_MAP.

## 13. Tabela końcowa

| Element | Status |
|---|---|
| Legacy UI inventory | PASS |
| Communities list UI 1:1 | PASS (full layout) |
| Community cards 1:1 | PASS (My/Recommended/Category/CreateCard + base CommunityCard) |
| Create community wizard 1:1 | PASS (4 steps + progress + sticky CTA + walidacja) |
| Backend create/list | PASS (categorySlug filter, listCategories) |
| Application-v2 use-cases | PASS |
| Routing | PASS |
| Frontend boundaries | PASS (no `@server/*`) |
| Architecture boundaries | PASS |
| DTO/PII/security | PASS |
| Tests | PASS (733/733) |
| Guards | PASS |
| Readiness | **READY** |

## 14. Następny krok

**Community Slice 2 — profil społeczności + join/request flow 1:1** (rozbudowa istniejącego `CommunityProfileShell` o pełny layout z legacy CommunityDetail header + tabs + info section; flow „Poproś o dołączenie" → zarządzający otrzymuje request → akcept; member badges; visibility-aware controls).
