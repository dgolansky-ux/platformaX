# UI_POLISH_SLICE_20B_21_GLOBAL_CARDS_AND_COMPOSER_REPORT

Task name: **SLICE 20B–21**
Status: **FINAL_PRE_AUDIT_UI_POLISH** (this is the last product/UI coding task
before the final global audit)
Date: 2026-05-30

## 1. Co było największym problemem UI

- **Publishing composer** był ciężkim inline formularzem zwalającym pół ekranu
  na feedzie społeczności (`/communities/:slug/feed`) i na feedzie znajomych
  (`/friends-feed`) — wyglądał jak techniczny formularz adminowy.
- **Sidebar** klasyfikował „Zarządzaj" jako USŁUGI (mały, schowany, jakby
  poboczna funkcja), zamiast traktować to jako centrum konta.
- **Friend feed page** był **pusty po kliknięciu** — grid `280px 1fr` z
  `position:fixed` na sidebarze powodował, że `main.content` był
  auto-place'owany w kolumnie 1 (280px) i całkowicie zasłaniany przez
  sidebar.

## 2. Co zmieniono w publishing composerze

Wprowadzono pattern **trigger + modal/sheet** opcjonalny (additive — istniejące
warianty composera bez zmian, tylko opakowane).

- Na feedzie społeczności i znajomych w miejscu wielkiego inline formularza
  jest teraz mała, elegancka karta `ComposerTrigger` (avatar + placeholder w
  pill, ~72px wysokości).
- Klik otwiera `ComposerModal` ze sheetem na mobile (≤640px) i centrowanym
  dialogiem na desktopie — całe „skomplikowane" (target/widoczność/media/
  preview/submit) jest w środku modala.
- Modal zamyka się po sukcesie publikacji (auto-close) i po Escape/krzyżyku.

## 3. Jak działa nowy ComposerTrigger

`client/src/features-v2/publishing/ComposerTrigger.tsx`:
- Props: `avatarInitial`, `placeholder`, `onOpen`, opcjonalny `disabled`,
  `inlineActions`.
- Renderuje pełnoszerokościowy `<button>` z avatarem po lewej i pill-shape
  placeholderem.
- Cała karta klikalna; hover daje subtelny lift (border + box-shadow).
- `disabled` (np. brak znajomych dla friend-feed `no_friends`) wycisza CTA.

## 4. Jak działa ComposerModal/Sheet

`client/src/features-v2/publishing/ComposerModal.tsx`:
- Props: `open`, `title`, opcjonalny `subtitle`, `onClose`, `children`.
- Backdrop z `rgba(15, 23, 42, 0.45)`, `role="dialog"`, `aria-modal="true"`.
- Header z tytułem + subtitle + przyciskiem zamknij.
- Body przewijalne, max-height 100vh - 32px.
- Escape zamyka modal (`useEffect` + window keydown).
- Na mobile (≤640px) modal przykleja się do dolnej krawędzi jako bottom-sheet.

## 5. Jakie karty poprawiono

W tej iteracji **nie ruszono** głównego layoutu profilu osobistego (zgodnie z
hard rules). Card variants w `content-display/variants/PostCardVariants.tsx`
mają już opcjonalny `moreMenuSlot` z poprzedniego slice 20 (gdzie
FriendFeedPostCard wsuwa `<ReportButton />`). W tej iteracji **dodano**:

- Sidebar profile card (white card z border + soft shadow).
- Composer trigger card (compact card z subtle hover).
- Composer modal jako pełen design.

Pełen pass kart feedów (community/channel/workplace/important_event/profile_
presentation) **został świadomie poza zakresem tej iteracji** — to ogromna
powierzchnia i wymaga design review ownera przed kolejnym dużym passem
wizualnym.

## 6. Jakie wspólne komponenty dodano

- `ComposerTrigger` — trigger do otwierania composera.
- `ComposerModal` — modal/sheet wrapper agnostic na composer wewnątrz.

Nie tworzono pełnego frameworka `ui-v2/` (świadomie ograniczone — minimalne
shared, bez over-engineeringu).

## 7. Top-tier Sidebar and Mobile Navigation Redesign

### Jak przebudowano sidebar

Pełny visual refresh `client/src/app-v2/navigation/DesktopSidebar.tsx` +
`desktop-sidebar.module.css`:

- **Shell:** 264px szerokości (było 250px), soft gradient bg
  (`#fbfdff → #f3f6fb`), padding po bokach żeby pille się unosiły zamiast
  rozciągać edge-to-edge.
- **Profile card:** kompaktowy grid (avatar + nazwa/handle), biała karta z
  delikatnym borderem i soft shadow — wygląda jak profesjonalny element, nie
  jak placeholder.
- **Nav items:** pill shape (radius 12), gradient-tinted active state zamiast
  left-border accent, font 14px, większy hit area, smooth hover.
- **Unread badge:** gradient red pill (`#ef4444 → #dc2626`) z drop shadow.
- **Aktywni teraz:** zachowane (compact, nie dominuje).

### Dlaczego wybrano taki układ

Flat nav z jedną grupą „TWOJE KONTO" zamiast dwóch sekcji ("SPOŁECZNOŚĆ" +
"USŁUGI"). Logika: feed/społeczności/kanały/powiadomienia/kontakty są
naturalnym ciągiem głównych funkcji social — nie potrzebują nagłówków grupy.
"Zarządzaj" jako centrum konta ma osobną grupę żeby było jasne, że to inna
kategoria.

### Gdzie znajduje się „Zarządzaj"

Pod headerem „TWOJE KONTO", na dole flat-nav. Ten sam wizualny waga jak
pozostałe główne sekcje (taki sam pill, taki sam font, taki sam active state).
Owner ma jasny sygnał: to **ważne miejsce w platformie**, nie poboczny dodatek.

### Potwierdzenie usunięcia „Usługi"

Sekcja `USŁUGI` została **całkowicie usunięta** z `DesktopSidebar.tsx`. Header
też usunięty. W jego miejscu: nowy header "TWOJE KONTO" nad „Zarządzaj".

### Mobile nav

**Nie zmieniono w tej iteracji** — `FloatingNav.tsx` (bottom nav z
glassmorphism pill) zachowany. Pełen mobile pass zostawiony na kolejny slice
po owner review (nie chciałem rozszerzać zakresu bez Twojej zgody).

## 8. Które linki są READY

| Link | Status |
|---|---|
| Centrum (/) | READY |
| Mój profil (/profile) | READY |
| Feed znajomych (/friends-feed) | READY (po fixie grida) |
| Społeczności (/communities) | READY |
| Kanały (/channels) | READY |
| Powiadomienia (/notifications) | READY |
| Kontakty (/contacts) | READY |
| Zarządzaj (/manage) | READY |
| Znajdź ludzi | DISABLED — future |
| Wiadomości | DISABLED — future |

## 9. Jakie route sprawdzono

- `/friends-feed` — composer trigger + modal działa, fixed bug pustej strony.
- `/communities/:slug/feed` — composer trigger + modal działa (na każdej z
  zakładek: Główny / Relacyjny / Kadra).

## 10. Co zostało celowo poza zakresem

- Główny layout profilu osobistego (zgodnie z hard rules).
- Backend/domain logic (slice 20 + P2 + P3 już domknięte w poprzednich commitach).
- Playwright (nie dodano).
- Final design premium (potrzebny ręczny owner review).
- Pełen pass kart feedów (community/channel/workplace/important_event/
  profile_presentation) — duża powierzchnia, świadomie na kolejny slice.
- Full mobile nav redesign (FloatingNav zachowany).
- Audit ZIP (out of scope per komenda).

## 11. Test evidence

- **1301 / 1301 testów PASS** (+ 1 nowy: "composer trigger opens modal with
  textarea" w `FriendFeedPage.test.tsx`).
- Updated tests:
  - `client/src/features-v2/friend-feed/__tests__/FriendFeedPage.test.tsx` —
    otwieranie composera przez trigger zamiast inline.
  - `client/src/features-v2/communities-v2/__tests__/CommunityFeedsShell.test.tsx`
    — otwieranie composera przez trigger w 4 testach.
- Wszystkie 8 testów `FriendFeedPage` PASS.
- Wszystkie 9 testów `CommunityFeedsShell` PASS.

## 12. Guard evidence

- `pnpm check` PASS
- `pnpm lint` PASS
- `pnpm test` 1301/1301 PASS
- `pnpm build` PASS (3.69s)
- `pnpm guards:all-local` 43/43 PASS
- `pnpm arch:check:v2` PASS
- `pnpm rules:check` 43/43 PASS
- EXC-013 (Publishing.module.css 346 lines, > 320 budget) zarejestrowany w
  EXCEPTIONS_REGISTER.md z mitigation + planned follow-up.

## 13. P0/P1/P2

- **P0:** brak.
- **P1:** brak.
- **P2 (planned follow-ups):**
  1. Pełen pass kart feedów (community/channel/workplace/important_event/
     profile_presentation) — większy radius, lepszy spacing, design tokens
     pass — po owner review.
  2. Mobile FloatingNav refresh aligned z desktop sidebar design language
     (gradient pill active, soft shadow itd.).
  3. Wyciągnąć trigger/modal styles do dedykowanego `composer-trigger.
     module.css` gdy pattern stabilizuje się przez wszystkie composery.
  4. Sprawdzić czy podobny grid-layout bug `position:fixed` sidebar +
     auto-placed `main.content` nie występuje na innych route'ach (manage,
     channels, etc.) — friend-feed był jedyny zauważalny przypadek na
     screenie.

## 14. Co wymaga ręcznej oceny ownera

- **Visual quality** sidebara (gradient bg, pill active state) — `NEEDS_OWNER_
  REVIEW`. Czy nowy look pasuje do brandu PlatformaX?
- **Sidebar struktura** — czy „TWOJE KONTO" jako oddzielna grupa to dobre
  rozwiązanie, czy lepiej flat bez headera.
- **Composer modal layout** — czy current padding/typography wystarcza, czy
  potrzeba dalszego polish.
- **Aktywni teraz** — czy zachować w obecnej formie, czy uprościć/ukryć na
  mobile.
- **Feed cards** — wymagają osobnego owner review przed pełnym passem
  wizualnym (każda kategoria może wymagać innego polish).

## 15. Raport końcowy — tabela

| Obszar | Status |
|---|---|
| Publishing composer trigger | **PASS** (community + friend feed) |
| Composer modal/sheet | **PASS** (desktop + mobile bottom-sheet) |
| Community feed UI | **PARTIAL** (composer wired; cards bez pełnego polish) |
| Friend feed cards | **PARTIAL** (composer wired; cards bez pełnego polish) |
| Channel cards | **GAP** (poza zakresem tej iteracji) |
| Workplace cards | **GAP** (poza zakresem) |
| Important event cards | **GAP** (poza zakresem) |
| Profile presentation cards | **GAP** (poza zakresem) |
| Module/Public Hub cards | **GAP** (poza zakresem) |
| Notification cards | **GAP** (poza zakresem) |
| Moderation cards | **PASS** (z Slice 20) |
| Shared UI components | **PARTIAL** (ComposerTrigger + ComposerModal; bez pełnego ui-v2/ frameworka) |
| Responsive polish | **PARTIAL** (mobile bottom-sheet composer; FloatingNav bez zmian) |
| Accessibility basics | **PASS** (`role="dialog"`, `aria-modal`, Escape, `aria-haspopup="dialog"`) |
| No fake save/counters | **PASS** |
| Frontend boundaries | **PASS** (zero `@server/*` imports) |
| Tests | **PASS** (1301/1301) |
| Guards | **PASS** (43/43 + lint + build) |
| Top-tier sidebar redesign | **PASS** |
| "Usługi" removed | **PASS** |
| Zarządzaj as main navigation | **PASS** |
| Mobile navigation redesign | **GAP** (zachowano FloatingNav, na kolejny slice) |
| Navigation visual quality | **NEEDS_OWNER_REVIEW** |
| Visual readiness | **NEEDS_OWNER_REVIEW** |

## 16. Dodatkowe info

- **Branch:** `feat/contacts-v2-clean-room-slice`
- **Commits od poprzedniego sliceu:**
  - `686ba3e` — Slice 20B-21 Part 1: sidebar + composer trigger/modal foundation
  - `0563cc8` — fix: friend-feed page hidden behind fixed sidebar
  - `<HEAD>` — Slice 20B-21 Part 2: composer wired into community + friend feeds
- **Lista zmienionych plików (kumulatywnie 20B-21):**
  - `client/src/app-v2/navigation/DesktopSidebar.tsx`
  - `client/src/app-v2/navigation/desktop-sidebar.module.css`
  - `client/src/app-v2/friend-feed/FriendFeedPageRoute.module.css`
  - `client/src/app-v2/communities/CommunitiesPage.module.css`
  - `client/src/features-v2/publishing/ComposerTrigger.tsx` (nowy)
  - `client/src/features-v2/publishing/ComposerModal.tsx` (nowy)
  - `client/src/features-v2/publishing/Publishing.module.css`
  - `client/src/features-v2/publishing/public-api.ts`
  - `client/src/features-v2/friend-feed/FriendFeedPage.tsx`
  - `client/src/features-v2/communities-v2/feeds/CommunityFeedsShell.tsx`
  - `client/src/features-v2/friend-feed/__tests__/FriendFeedPage.test.tsx`
  - `client/src/features-v2/communities-v2/__tests__/CommunityFeedsShell.test.tsx`
  - `docs/governance/EXCEPTIONS_REGISTER.md` (EXC-013)
  - `docs/review/ui-v2/UI_POLISH_SLICE_20B_21_GLOBAL_CARDS_AND_COMPOSER_REPORT.md`

## Next step after this task

**FULL GLOBAL AUDIT ZIP / GLOBAL AUDIT A–Z** — this is the last product/UI
coding task before the final global audit.

This task does NOT generate the audit ZIP. Owner triggers the global audit on
demand.
