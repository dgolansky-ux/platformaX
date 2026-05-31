# SLICE 20C — UI: karty, composer, sidebar, mobile nav

## 1. Karty (20)

Wszystkie variantowe karty postów żyją w `client/src/features-v2/content-display/variants/PostCardVariants.tsx` i kompozytują wspólne komponenty `PostDisplayKit.tsx` + `PostActionBar.tsx`. Klasy wariantowe są tylko CSS-owe (`ContentDisplay.module.css`). To **dobrze** dla DRY, ale "wizualna różnica między feedami" jest *kosmetyczna*.

| Karta | Ścieżka | Visual /10 | Spacing | Hierarchy | Mobile | Actions | Empty/Loading/Error | Display Kit | Fake actions | Notatka |
|---|---|---|---|---|---|---|---|---|---|---|
| FriendFeedPostCard | `variants/PostCardVariants.tsx:69` | 7 | OK | OK | OK | reagowanie, komentowanie, share | states OK | YES | NO | `StandardCard` z accentem `variantFriend` |
| CommunityFeedPostCard | `:73` | 7 | OK | OK | OK | full action bar | YES | YES | NO | accent `variantCommunity` |
| StaffFeedPostCard | `:77` | 7 | OK | OK | OK | full action bar | YES | YES | NO | accent `variantStaff` — różnica TYLKO kolor akcentu |
| RelationalFeedPostCard | `:81` | 7 | OK | OK | OK | full action bar | YES | YES | NO | jak wyżej |
| ChannelPostCard | `:85` | 7 | OK | OK | OK | full action bar | YES | YES | NO | accent `variantChannel` |
| WorkplacePostCard | `:89` | 7 | OK | OK | OK | full action bar | YES | YES | NO | accent `variantWorkplace` |
| WorkplaceTeaserCard | `:97` | 8 | OK | OK | OK | **tylko share + open** (rule 10) | YES | YES | NO | poprawnie redukuje action bar, no react/comment |
| ImportantEventCard | `:117` | 7 | OK | OK | OK | "Szczegóły" link + share | brak sekcji na profilu | YES | NO | data badge + opis; brak realnego route'a `/profile/me/important-events` |
| ProfilePresentationCard | `:143` | 7 | OK | OK | OK | "Otwórz sekcję" link | brak sekcji | YES | NO | brak realnego route'a `/profile/me/presentation` |
| CompactPostPreviewCard | `:169` | 6 | OK | OK | OK | tylko "Otwórz" link | YES | YES | NO | skrócony preview |
| NotificationCard | `features-v2/notifications-v2/NotificationCard.tsx` | 7 | OK | OK | OK | mark read, navigate | YES | n/d | NO | używany w `NotificationsPage` |
| ModerationReportCard | `features-v2/moderation/*` | 6 | OK | OK | OK | accept/reject | YES | n/d | NO | proste, funkcjonalne |
| ModuleCard | `features-v2/modules/ModulesManageView.tsx` | 6 | OK | OK | OK | toggle | YES | n/d | NO | OK dla manage |
| PublicHubModuleSlot | `features-v2/public-hub/slots/*` | 6 | OK | OK | OK | view-only | YES | n/d | NO | 4 slots — Topics/Events/Integrations/NewsletterChat |
| CommunityCategoryCard | `communities-v2/cards/CommunityCategoryCard.tsx` | 7 | OK | OK | OK | navigate | YES | n/d | NO | Slice 20B polish |
| CreateCommunityCard | `cards/CreateCommunityCard.tsx` | 7 | OK | OK | OK | open wizard | n/d | n/d | NO | CTA-only |
| MyCommunityCard | `cards/MyCommunityCard.tsx` | 7 | OK | OK | OK | navigate | YES | n/d | NO | |
| RecommendedCommunityCard | `cards/RecommendedCommunityCard.tsx` | 7 | OK | OK | OK | join/request | YES | n/d | NO | |
| ChannelCard | `features-v2/channels/Channels.module.css` (variant) | 6 | OK | OK | OK | follow CTA | YES | n/d | NO | |
| WorkplaceCard | `professional-profile/WorkplacePage.tsx` (header) | 7 | OK | OK | OK | open workplace | YES | n/d | NO | |
| ManageSectionCard (tile) | `manage/ManageDashboard.tsx:54` | 7 | OK | OK | OK | navigate / disabled | n/d | n/d | NO | 3 disabled tiles oznaczone `"W przygotowaniu"` |

**Suma kart ocenionych: 21.** Średnia ~6.7/10 — bezpiecznie nad "wysyłkowym" progiem, ale daleko od premium-feel (10/10 wymaga prawdziwych zdjęć/awatarów, animacji, mikrointerakcji).

### Co poprawia jakość kart (Slice 20B polish faktycznie zrobiony):
- Wspólny `PostStatsRow` z formatowaniem (`1.2k`, `4 razy`).
- Wspólny `PostActionBar` z `showReact/showComment/showShare/showOpen` flagami.
- Wspólny header z avatarem + visibility chip + timestamp.
- `WorkplaceTeaserCard` poprawnie redukuje action bar — nie udaje pełnego postu.

### Czego brakuje (P2/P3):
- Realne zdjęcia/avatary (większość fake initials).
- Hover micro-interactions na desktop.
- Inline media lightbox (kliknięcie zdjęcia tylko `PostRouteLink`).
- Wyraźniejsze różnice między 6 wariantami `StandardCard` (obecnie tylko accent kolor).

---

## 2. Composer (publishing)

| Element | Status | Plik |
|---|---|---|
| Inline ciężki composer na feedach | **NIE — usunięty** | brak (zastąpiony przez trigger) |
| `ComposerTrigger` (FB-style avatar + pill + action chips) | TAK | `publishing/ComposerTrigger.tsx` |
| `ComposerModal` (escape close, no outside-close) | TAK | `publishing/ComposerModal.tsx` |
| Variant: FriendFeedComposer | TAK | `composers/FriendFeedComposer.tsx` (też re-export jako shell `friend-feed/FriendFeedPage` linijka 23) |
| Variant: CommunityFeedComposer | TAK | `composers/CommunityFeedComposer.tsx` + wrapper `communities-v2/feeds/CommunityFeedComposer.tsx` |
| Variant: Staff (re-used) | TAK | `CommunityFeedComposer` z `feedType==="staff_only"` |
| Variant: Relational (re-used) | TAK | `CommunityFeedComposer` z `feedType==="relational"` |
| Variant: ChannelComposer | TAK | `composers/ChannelComposer.tsx` |
| Variant: WorkplaceComposer | TAK | `composers/WorkplaceComposer.tsx` |
| Variant: ImportantEventComposer | TAK | `composers/ImportantEventComposer.tsx` (zwraca `partial`) |
| Variant: ProfilePresentationComposer | TAK | `composers/ProfilePresentationComposer.tsx` (zwraca `partial`) |
| Target selector | TAK | `PublishingTargetSelector.tsx` |
| Visibility selector | TAK | `PublishingVisibilitySelector.tsx` |
| Media picker | TAK | `PublishingMediaPicker.tsx` |
| Submit fake? | **NIE** | `mock-adapter.ts:111-117` — realny idempotency + state mutation. Partial dla backend_not_ready celów. |
| Stary composer nadal w użyciu? | NIE | grep nie znajduje innych composerów na route'ach |

### Realne wpięcie composerów (route → composer):
- `/friends-feed` — `FriendFeedPage` ma `ComposerTrigger` + `ComposerModal` + `FriendFeedComposer` (`FriendFeedPage.tsx:111-133`).
- `/communities/:slug/feed` — `CommunityFeedsShell` ma `ComposerTrigger` + `ComposerModal` + `CommunityFeedComposer` (`CommunityFeedsShell.tsx:152-174`).
- `/profile/workplaces/:slug` — `WorkplaceMicroFeed` ma composer w mikrofeed.
- `/channels/:slug` — `ChannelPostComposer` używa `channel-publishing-adapter`.

### CO BRAKUJE:
- **Mobile FAB w `FloatingNav` NIE otwiera composera** (`FloatingNav.tsx:94`: `onClick={() => setComingSoon("Composer otworzy się z poziomu feedu lub społeczności.")}` — to literalnie atrapa). **P1.**
- Brak globalnego entry-point composera z centrum/dashboardu — composer dostępny tylko po wejściu na konkretny feed.

### `/communities/product-builders/feed` (UX check):
- Inline ciężki formularz **nie istnieje**. Jest trigger + modal.
- Status: **OK** — nie BROKEN.

---

## 3. Sidebar (`DesktopSidebar.tsx`)

| Kryterium | Wynik |
|---|---|
| "Usługi" usunięte | YES |
| "Zarządzaj" w głównej nawigacji | YES — w sekcji "Twoje konto" (osobny `navGroup`) |
| Top-tier (280 px, mark + brand + user card + grupy + active strip) | YES |
| Active state czytelny | YES — `aria-current="page"`, `navItemActive` class, kolorowy accent |
| Badge powiadomień | YES — `useNotificationsUnreadCount` → `data-testid="notifications-unread-badge"`, format `99+` |
| User card kompaktowy | YES — avatar + name + handle + chevron, kliknięcie → `/profile` |
| "Aktywni teraz" nie dominuje | YES — krótka strip 4 avatary + `+7` na dole |
| Disabled "Wiadomości"/"Znajdź ludzi" | YES — `disabled` + chip "Wkrótce" |
| Brak fake-active linków | YES — disabled buttony nie nawigują |
| **Ocena** | **9/10** — premium-feel, top-tier |

---

## 4. Mobile nav (`FloatingNav.tsx`)

| Kryterium | Wynik |
|---|---|
| Istnieje | YES — 5 tabów + central FAB |
| Nie jest desktop sidebar wciśnięty | YES — własny komponent, scroll-hide, reduced-motion respect |
| No horizontal overflow | YES — flexbox `inner` |
| Linki fake? | NIE — wszystkie aktywne, **WYJĄTEK: FAB pokazuje "Wkrótce" modal** |
| Active state | YES — `aria-current` + `navIconActive`/`navLabelActive` |
| Badge powiadomień | YES — `useNotificationsUnreadCount("u-viewer")` (hardcoded viewer id) |
| Ikony spójne z desktop | **NIE** — mobile używa emoji 🏠 👥 ＋ 🔔 👤; desktop ma SVG. Niespójność stylistyczna |
| Composer FAB realnie publikuje | **NIE — atrapa** |
| **Ocena** | **5/10** — funkcjonalnie navigation tak, composer/ikonografia nie |

### Navigation clarity ogólnie: **8/10**
- Routes: jasne, czytelne polskie nazwy.
- Onboarding: `/onboarding` istnieje (`OnboardingFlow.tsx`).
- Brak landing → onboarding flow guard na froncie (ale `LoginRoute`/`RegisterRoute` istnieją, są podpięte).

---

## 5. Naruszenia / dziwactwa znalezione

1. **AppShell.tsx** (`app-v2/navigation/AppShell.tsx`) — istnieje, untracked, **nieużywany przez żaden route**. Każdy route shell (`FriendFeedPageRoute`, `PersonalProfileRoute`, `ManageDashboard`, `ContactsPage` itd.) ręcznie składa `DesktopSidebar` + `FloatingNav`. Duplikacja na ~10 plikach. P2.
2. **DEMO_VIEWER_ID = "u-viewer"** w `FriendFeedPageRoute.tsx`, `PersonalProfileRoute.tsx`, `FloatingNav.tsx`, `useFriendFeedPostCardState.ts`, `ModerationAdminPage.tsx` — wiele miejsc hardcoduje "u-viewer". Powinno być wyciągnięte do `useDemoViewer()` / `useAuthViewer()`. P2.
3. **Sidebar `displayName="Demo użytkownik"`, `handle="demo"`** hardcoded w każdym route. Powinno przyjść z auth context. P2.
4. **FloatingNav: hardcoded "u-viewer"** w `useNotificationsUnreadCount("u-viewer")` — badge na mobile może się rozjechać z desktop, jeśli kiedyś będzie inny viewer. P2.
5. **Brak skeleton states** w `NotificationsPage`, `ChannelsShell`, `WorkplacePage` — proste `aria-busy="true"` divy. P3.

---

## 6. Werdykt sekcji UI

- **Desktop**: 8/10 (premium feel, top-tier sidebar, composer trigger w 2 głównych feedach, karty z Display Kit).
- **Mobile**: 5/10 (FAB atrapa, ikony emoji vs SVG desktop, brak composera na mobile).
- **Karty**: 6.7/10 średnia — bezpiecznie nad progiem, daleko od premium.

**Najpilniejszy fix przed ZIP-em Slice 21**: mobile FAB → `ComposerModal` z friend-feed targetem (`FloatingNav.tsx:94-95`).
