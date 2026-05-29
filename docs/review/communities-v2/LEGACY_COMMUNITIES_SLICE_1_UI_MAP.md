# Legacy Communities — Slice 1 UI Map (clean-room inventory)

**Źródło:** `C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities/`

**Cel:** mapa pod clean-room re-implementację. Tylko struktura/copy-cues — runtime legacy (tRPC, wouter, supabase, sonner toasts, base64 upload, fileToBase64, DraggableImage) NIE przechodzi.

## A. Trasy / ekrany (przeanalizowane pliki)

| Legacy plik | Rola w Slice 1 |
|---|---|
| `pages/Communities.tsx` | Główny ekran spisu (categories + list mode) |
| `pages/CommunitiesCards.tsx` | `CommunityCard`, `MyCommunities`, typy `Category`, `CommunityItem` |
| `pages/CommunitiesComponents.tsx` | dodatkowe komponenty cards + helpers (re-eksport) |
| `pages/CommunitiesListView.tsx` | Widok listy przy wybranej kategorii (poza Slice 1) |
| `pages/CommunitiesSearchPanel.tsx` | Panel wyszukiwarki + filtry (location mode, category) |
| `components/CommunityWizard.tsx` | Orchestrator 4-step kreatora |
| `components/CommunityWizardShared.tsx` | `STEPS`, `COVER_GRADIENTS`, `WizardData`, `DraggableImage` (odrzucamy crop/upload) |
| `components/CommunityWizard.CategoryStep.tsx` | Step 2 — wybór kategorii + subcategory + topic |
| `components/CommunityWizard.LocationStep.tsx` | Step 3 — locationMode (online/stationary/hybrid) + city/hq |
| `components/CommunityWizard.SummaryStep.tsx` | Step 4 — podsumowanie + cover gradient preview |

Inne legacy strony społeczności (poza zakresem Slice 1, do późniejszych slice'ów): `CommunityDetail*`, `CommunityMembersPage`, `CommunityModulesPage`, `CommunitySettingsPage`, `ManageCommunities`, `ManageStructure*`, `SubCommunityWizard*`, `CommunityWizardSubcommunity*`.

## B. Ekran spisu (`Communities.tsx`)

Layout (top→bottom):
1. **Header row:** `H1: "Społeczności"` + przycisk `Utwórz` (ikona `Plus`, primary jeśli `isPublicProfile`, w przeciwnym razie disabled + tooltip „Aktywuj Profil Publiczny aby tworzyć Społeczności").
2. **Search panel** (component `CommunitiesSearchPanel`):
   - przycisk rozwijający wyszukiwarkę,
   - input query (debounce 350ms),
   - chipy filtra: location mode (`online | stationary | hybrid`) + category select.
3. **Tryb wyszukiwania** (`isSearchMode`): grid wyników (`auto-fill, minmax(300px,1fr)`); empty state = ikona 🔍 + tekst „Brak wyników"; loading = `PageLoader variant="list"`.
4. **Moje społeczności** (gdy nie searchMode + zalogowany + `myCommunities.length > 0`): nagłówek `H2: "Moje społeczności"` + chip „Pokaż wszystkie ({n})/Zwiń" (Chevron). Lista zwinięta domyślnie do połowy (`Math.ceil(len/2)`); „+N więcej społeczności" w stopce.
5. **Polecane dla Ciebie** (recommended): horyzontalna lista (`overflow-x-auto`), pierwsze 6 kart 140×~120, gradient header, mała pigułka „Dołącz" jeśli viewer nie jest członkiem.
6. **Odkryj społeczności** — `H2` + subtitle „Wybierz kategorię, aby przeglądać publiczne społeczności"; siatka kategorii 76×76 (emoji + nazwa), maks 3 rzędy po 4 (`slice(0,4)`, `slice(4,8)`, `slice(8)`); empty/loading state = ikona 🏙 + „Ładowanie kategorii…".

Animacje: `animate-fadeInUp` + `animationDelay` (20ms/40ms/idx*30ms). Pulse-green dot przy `memberCount`.

## C. Karty (warianty 1:1)

### `CommunityCard` (`CommunitiesCards.tsx`)
- Layout: avatar (52×52 okrągły gradient primary→#7C3AED, fallback ikona `Hash`) + body (`H2` tytuł, ikony `Crown` jeśli owner, `Globe` jeśli publiczna; opis line-clamp-2; meta = pulsujący zielony kropek + „N czł." + do 2 tagów; przycisk `Dołącz` (secondary) jeśli `!isMember`.
- Hover/focus: `card-hover-px` (rounded, shadow-lift), animacja fadeInUp z opóźnieniem `(idx%10)*40ms`.

### `MyCommunities` row
- Rounded-[18px], border 1.5px, shadow `0 1px 6px rgba(0,0,0,0.06)`.
- Avatar 52×52 + orbit ring SVG (kropkowane stroke, `animate-[orbit-spin_8s_linear_infinite]`).
- Nazwa max 20 znaków + Crown jeśli owner.
- ChevronRight po prawej.

### Recommended (inline, brak własnego pliku — zdefiniowany w `Communities.tsx`)
- Kafelek 140×~120, gradient header z emoji kategorii, name (font-semibold xs), member-count + ikona `Users`, opcjonalny „Dołącz" przycisk (pełny background primary, white text, text-[10px]).

### Category chip (inline w `Communities.tsx`)
- Box 76×76, border-2, rounded-2xl, emoji 26px + nazwa 10px center.
- Hover: border primary + bg primary-light.

### Empty/loading patterns
- Loading: `PageLoader variant="list"` (legacy component, w V2 wystarczy spinner/skeleton).
- Empty: `card-px` + duża ikona emoji (🔍/🏙/🎯) + tekst muted.

## D. Kreator (`CommunityWizard.tsx`)

### `STEPS` (4 kroki)
| # | id | title | ikona |
|---|----|-------|-------|
| 1 | basics | Podstawy | Sparkles |
| 2 | category | Kategoria | Search |
| 3 | location | Lokalizacja | MapPin |
| 4 | summary | Utwórz | Check |

### `WizardData` (kontrakt)
```
name, description, type ("public"|"private"), tags (csv string),
categoryId, subcategoryId, topic,
locationMode ("online"|"stationary"|"hybrid"|null),
locationCity, locationHq,
operatingMode ("in_person"|"online"|"hybrid"),
location, locationAddress
```

### Layout
- Fixed full-screen overlay (`z-[200]`), header z back-arrow (`ArrowLeft`) gdy step>1 + tytuł „Nowa społeczność" + krok „Krok N z 4 — {title}"; close `X` w prawym górnym.
- **Progress bar:** 4 paski (`flex-1 h-1.5 rounded-full`), aktywne = `var(--px-primary)`, nieaktywne = `var(--px-border)`.
- **Sticky CTA footer:** „Dalej →" (primary) + opcjonalny „Pomiń" (secondary) gdy step>1; krok 4: full-width „Utwórz społeczność" (`Zap` ikona) lub spinner „Tworzenie…".

### Step 1 — Podstawy
- Ikona-header: 56×56 gradient `linear-gradient(135deg, #1E4FD8, #7C3AED)` + `Sparkles` 24×24 white.
- `H2: "Zacznijmy od podstaw"`, subtitle „Nadaj nazwę i opisz swoją społeczność".
- Pola:
  - **Nazwa społeczności** *required, maxLength 100, placeholder „np. Programiści React"*, counter `N/100`.
  - **Opis (opcjonalny)** textarea 3 rows, maxLength 500, placeholder „Opisz czym jest ta społeczność…", counter `N/500`.
  - **Typ społeczności** — grid 2 kolumn, karty z `Globe`/`Lock` ikoną + tytuł („Publiczna"/„Prywatna") + opis („Każdy może dołączyć"/„Tylko po zaproszeniu"). Wybór: border + background primary-light.
- `canProceed` = `name.trim().length >= 3`.

### Step 2 — Kategoria
- Lista kategorii (grid 2-3 kol), wybór + opcjonalna subcategory (drugi widok po wybraniu kategorii), pole `topic` (free text) opcjonalne.

### Step 3 — Lokalizacja
- 3 chipy `locationMode` (`online`/`stationary`/`hybrid`) z ikonami `Wifi`/`MapPin`/dual; pola city + HQ w zależności od trybu.

### Step 4 — Summary
- Cover preview z gradientem (`COVER_GRADIENTS[name.length % 6]`).
- Lista: nazwa, kategoria, lokalizacja, typ, opis.
- Submit przez `createMutation` (toast „Społeczność utworzona!").

## E. Co przechodzi 1:1 (visual/copy)

- Hierarchia ekranu (`Społeczności` H1 + Utwórz CTA + search + sekcje moje/polecane/kategorie).
- Struktura kart `CommunityCard` / `MyCommunities` (orbit ring, pulse-green, Crown).
- 4-step layout kreatora: header, progress bar, sticky footer, „Pomiń", „Dalej →", `Zap`+„Utwórz społeczność".
- Mikrocopy: „Zacznijmy od podstaw", „Nadaj nazwę i opisz…", „Każdy może dołączyć"/„Tylko po zaproszeniu", „Krok N z 4", „Polecane dla Ciebie", „Odkryj społeczności", „Wybierz kategorię…", „Pokaż wszystkie", „+N więcej społeczności", „Brak wyników".

## F. Co odrzucamy z legacy (runtime spaghetti)

| Element | Powód odrzucenia |
|---|---|
| `trpc.communities.*.useQuery/useMutation` | Brak HTTP transportu V2 — używamy MOCK_LOCAL_ONLY adapter. |
| `wouter useLocation` | V2 używa `react-router-dom`. |
| `sonner toast` | Brak zależności w V2 — pokażemy inline error/success. |
| `fileToBase64`, `DraggableImage` | base64 upload zakazany w V2 (media domain ma typed upload-intent). |
| `RULE_EXCEPTION(id=1)` `any` casts | V2 ma `no-any`/`no-as-any` rule. |
| `useAuth` z `_core/hooks` | V2 ma `identity` feature z własnym kontekstem. |
| `_shared/components/DesktopLayout` | V2 ma własny `DesktopSidebar` per route. |
| `PageLoader variant="list"` | V2 używa lokalnych empty/loading states modułu. |
| localStorage/sessionStorage jako fake backend | Zakazane (adapter trzyma in-memory state przez czas SPA). |
| Subcommunity wizard (`SubCommunityWizard*.tsx`) | Poza zakresem Slice 1. |
| Wszystkie ekrany `CommunityDetail*` | Poza zakresem Slice 1 (profile zostawiamy minimalny placeholder). |

## G. Co świadomie pomijamy w Slice 1

- pełny profil społeczności (CommunityDetail/header/tabs/modules sheet/broadcast),
- members management (`CommunityMembersPanel`, `CommunityMembersPage`),
- moduły (`CommunityModulesPage`, `CommunityModulesOnboarding`),
- settings (`CommunitySettingsPage`, `FeedSettingsPanel`),
- moderation (`CommunityModerationPage`, `ModerationTab`),
- subcommunity wizard,
- StripeConnectPanel, AdminDelegationPanel, StaffDrawer,
- struktura/circle tree,
- chat / events / broadcast,
- RingPost runtime,
- pełny algorytm discovery / recommendations.

## H. Plan implementacji V2

1. Backend (już PARTIAL): `communities-v2` ma create/list/visibility. Dodać **categories** jako reference data w `communities-v2` (definitions + DTO + ref. listing), pole `categorySlug` w community + filtering po kategorii w `listPublicCommunities`.
2. Shared contracts: `CommunityCategoryDTO`, rozszerzyć `CommunityCardDTO` o `categorySlug` + `bannerGradientIdx`.
3. Frontend:
   - przerobić `CommunitiesShell` zgodnie z legacy layoutem (header + search + my + recommended + categories grid),
   - dodać komponenty `CommunitiesSearch`, `CommunityCategoryCard`, `MyCommunityCard`, `RecommendedCommunityCard`, `CreateCommunityCard`,
   - przerobić `CreateCommunityForm` → `CreateCommunityWizard` (4 kroki: basics/category/location/summary) + osobny `CreateCommunityProgress`,
   - reset: jeden modal/sheet route (`/communities/new`) zachowuje się jak overlay,
   - empty/loading/error states 1:1 (ikony emoji, mikrocopy).
4. Testy frontend + backend categories.
5. Raport.
