# PlatformaX V2 — PROFILE_BLUEPRINT_MOBILE_FIRST

**Status dokumentu:** `PROFILE_BLUEPRINT_ONLY / ANALYSIS_ONLY / NO_CODE`  
**Źródło legacy:** `Starykod-4.zip` → `PlatformaX/client/src/features/identity`, `PlatformaX/client/src/features/social`, `PlatformaX/client/src/features/_shared`, `PlatformaX/client/src/index.css`, `PlatformaX/client/src/desktop-premium.css`  
**Priorytet:** mobile-first. Desktop jest adaptacją mobile, nie odwrotnie.  
**Cel:** przygotować precyzyjny blueprint do przeniesienia profilu osobistego i zawodowego do V2 bez kopiowania runtime legacy.

---

## 0. Werdykt główny

Profil w legacy nie jest jednym prostym ekranem. To złożony system:

1. **Profil osobisty** jako główny widok użytkownika.
2. **Profil zawodowy** jako druga warstwa tego samego profilu, przełączana trybem `Osobisty / Zawodowy`.
3. **Publiczny / właściciel / znajomy / nieznajomy preview** jako różne stany widoczności.
4. **Mobile-first UX** z dużą liczbą mikrointerakcji: swipe hint, dropdown preview, status pill, status photo, bio typewriter, animated cards, carousel, quick feed, bottom sheets.
5. **Desktop** jest poszerzeniem/adaptacją mobile przez `desktop-premium.css`; nie może zmienić logiki układu mobile.

**Najważniejsza decyzja dla V2:** nie tworzyć osobnej domeny `professional-profile`. Profil zawodowy to **warstwa profilu w domenie `identity`**, plus dane zawodów/specjalizacji jako część identity/reference data.

---

## 1. Twarde zasady przeniesienia do V2

### 1.1 Co przenosimy 1:1 wizualnie

- Układ mobile profilu osobistego.
- Układ mobile profilu zawodowego.
- Przełącznik `Osobisty / Zawodowy`.
- Header profilu: imię, avatar, relacja, separator, bio, status, banner.
- Puste stany, disabled states, modale, sheety.
- Karty portali: Społeczności, Kanały, Feed znajomych.
- Kontakty / znajomi carousel.
- Quick feed preview pod kontaktami.
- Prezentacja profilu.
- Ważne wydarzenia.
- Professional layer: zawód, specjalizacje, aktywności zawodowe, specjaliści, klasyczny/sieć.
- Public preview: widok znajomego / nieznajomego.
- Kolory, spacing, radiusy, cienie, animacje, mikrocopy.

### 1.2 Czego NIE przenosimy

- `trpc` hooks.
- Stare Supabase coupling.
- Legacy runtime mutacji.
- Base64/dataURL upload runtime.
- `localStorage` jako stan/fake backend.
- `window.confirm` / `window.alert`.
- Stary backend profili/postów/społeczności.
- Stare domeny typu `passions` jako aktywny produkt.
- Deep importy między domenami.

### 1.3 Status implementacji profilu na początku

Dopóki nie ma runtime:

```txt
PROFILE_UI_SHELL_ONLY
PROFILE_MOCK_LOCAL_ONLY
IDENTITY_PROFILE_RUNTIME_NOT_CONNECTED
MEDIA_RUNTIME_NOT_CONNECTED
SOCIAL_RUNTIME_NOT_CONNECTED
CONTENT_RUNTIME_NOT_CONNECTED
```

Nie wolno oznaczać jako `DONE`, `BACKEND_DONE`, `VISUAL_DONE` bez screenów/manual evidence.

---

## 2. Mapa plików legacy — źródła prawdy profilu

### 2.1 Główny ekran profilu

| Obszar | Plik legacy | Znaczenie dla V2 |
|---|---|---|
| Orkiestrator profilu | `client/src/features/identity/pages/ProfileView.tsx` | Główna kolejność sekcji, mode switch, preview state, modale. |
| Typy/hooki/mutacje | `ProfileView.types.ts`, `ProfileView.hooks.ts`, `ProfileView.queries.ts`, `ProfileView.mutations.ts` | Tylko do zrozumienia flow; nie kopiować runtime. |
| Modale profilu | `ProfileModals.tsx` | Lista sheetów/modalów do odtworzenia jako UI shell. |
| Banners preview | `ProfileView.PreviewBanners.tsx` | Widok znajomego / nieznajomego. |
| Preview menu | `ProfilePreviewMenu.tsx` | Dropdown wyboru preview. |

### 2.2 Header profilu

| Obszar | Plik legacy |
|---|---|
| Header całościowy | `ProfileHeader.tsx` |
| Avatar | `ProfileHeaderAvatar.tsx` |
| Banner | `ProfileHeaderBannerSection.tsx`, `ProfileHeaderBanner.tsx` |
| Social links | `ProfileHeaderSocialLinks.tsx` |
| Status bar | `ProfileHeaderStatusBar.tsx` |
| Bio editor | `ProfileBioEditor.tsx` |
| Relacja | `RelationshipStatus.tsx`, `RelationshipStatusPicker.tsx` |

### 2.3 Sekcje profilu

| Obszar | Plik legacy |
|---|---|
| Portal cards | `ProfileTopRow.tsx`, `ProfileTopRowCards.tsx` |
| Kontakty carousel | `FriendsSection.tsx`, `FriendsSection.FriendCard.tsx`, `FriendsSection.FadeOverlays.tsx`, `FriendsSection.useCarouselEngine.tsx` |
| Quick feed preview | `QuickFeedPreview.tsx`, `quickFeedUtils.ts` |
| Prezentacja profilu | `ProfilePostsSection.tsx`, `ProfilePostCard.tsx` |
| Ważne wydarzenia | `ProfileTimeline.tsx`, `MilestonePostCard.tsx` |
| Społeczności placeholder | `ProfileCommunities.tsx` |
| Specjaliści | `ProfileSpecialists.tsx` |
| Professional section | `ProfileProfessionalSection.tsx`, `ProfileNetworkView.tsx`, `ActivityCard.tsx` |

### 2.4 Zawody i specjalizacje

| Obszar | Plik legacy |
|---|---|
| Edytor zawodów | `ProfessionEditor.tsx` |
| Krok zawód | `ProfessionZawodStep.tsx`, `ProfessionZawodStep.MyProfessions.tsx`, `ProfessionZawodStep.ProposeForm.tsx` |
| Krok specjalizacje | `ProfessionSpecializationsStep.tsx` |
| Progress | `ProfessionProgressBar.tsx` |
| Sukces | `ProfessionSuccessStep.tsx` |
| Final | `ProfessionFinalStep.tsx` |
| Blok na profilu | `ProfessionBlock.tsx`, `ProfessionBlock.Switcher.tsx`, `ProfessionBlock.LinkedActivities.tsx` |

### 2.5 Public profile / profile innych osób

| Obszar | Plik legacy |
|---|---|
| PublicProfile | `PublicProfile.tsx` |
| Public hero | `PublicProfileHero.tsx` |
| Public tabs | `PublicProfileTabs.tsx` |
| Public CTA | `PublicProfileActionButtons.tsx` |
| Public sections | `PublicProfileSections.tsx` |
| Request modal | `PublicProfileRequestModal.tsx` |

### 2.6 Feed znajomych, bo jest częścią profilu według dokumentów

| Obszar | Plik legacy |
|---|---|
| Feed screen | `client/src/features/social/pages/FriendsFeed.tsx` |
| Composer | `FriendsFeedCompose.tsx` |
| Filter bar | `FriendsFeedFilterBar.tsx` |
| Feed card | `FriendsFeedPostCard.tsx` |
| Empty state | `FriendsFeedEmptyState.tsx` |
| Avatars row | `FriendsFeedAvatarsRow.tsx` |
| Activity grid preview | `client/src/features/social/components/FriendActivityGrid.tsx`, `FriendActivityGridTiles.tsx` |

### 2.7 Obrazki, crop, upload UI

| Obszar | Plik legacy | Uwaga V2 |
|---|---|---|
| Image edit overlay | `ImageEditOverlay.tsx` | Przenieść UX, nie base64 runtime. |
| Bottom sheet menu | `ImageEditActionMenu.tsx` | Przenieść UI. |
| Crop editor | `ImageCropEditor.tsx`, `CropAreaCanvas.tsx`, `ImageCropShared.tsx` | Przenieść UX proporcji i gestów; runtime przez media domain później. |

---

## 3. Globalny styl profilu — kolory, typografia, system

### 3.1 Brand tokens legacy

```css
--px-primary:        #1E4FD8;
--px-primary-dark:   #1338A0;
--px-primary-light:  #EEF2FF;
--px-accent:         #F97316;
--px-accent-light:   #FFF4ED;
--px-dark:           #111827;
--px-dark-secondary: #374151;
--px-muted:          #9CA3AF;
--px-surface:        #FFFFFF;
--px-background:     #F8FAFC;
--px-border:         #E5E7EB;
--px-border-strong:  #D1D5DB;
--px-success:        #16A34A;
--px-warning:        #D97706;
--px-error:          #DC2626;
```

### 3.2 Typografia

- Nagłówki: `Sora`.
- Tekst UI/body: `DM Sans`.
- Body: `font-family: 'DM Sans', system-ui, sans-serif`.
- Antyaliasing: `-webkit-font-smoothing: antialiased`.

Klasy legacy:

```css
.text-display: Sora, 28px, 700, line-height 1.2
.text-h1:      Sora, 22px, 600, line-height 1.3
.text-h2:      Sora, 18px, 600, line-height 1.3
.text-h3:      Sora, 15px, 600, line-height 1.4
.text-body:    DM Sans, 15px, 400, line-height 1.6
.text-small:   DM Sans, 13px, 400, line-height 1.5
.text-label:   DM Sans, 12px, 500, uppercase, letter-spacing 0.05em
```

### 3.3 Mobile base

- `body` background: `var(--px-background)` / `#F8FAFC`.
- `page-with-bottom-nav` padding bottom: `calc(64px + 8px + env(safe-area-inset-bottom, 0px))`.
- Profile content uses a lot of `px-5`, cards `rounded-2xl`, white surfaces, subtle borders.
- Most mobile typography is intentionally small: 9–16px. Nie powiększać agresywnie.

### 3.4 Desktop adaptation

Desktop CSS ma komentarz: **mobile NIE dotykamy**. Dla V2 zachować tę zasadę:

```txt
@media (min-width: 768px) only.
Desktop poprawia czytelność i szerokość, ale nie zmienia mobile flow.
```

Desktop legacy:

- body background: `#EAECF0`.
- sidebar width: `260px`.
- desktop cards: white, radius 16, shadow `0 1px 2px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)`.
- desktop card hover: translateY(-2px), stronger shadow.
- desktop sticky header: white + subtle shadow.
- desktop max content around `900px` in `.desktop-wide-container` / `.desktop-wide-inner` patterns.

---

## 4. Główna kolejność ekranu profilu mobile

Na podstawie `ProfileView.tsx` kolejność sekcji jest następująca:

1. `ProfileReminderBanner` — tylko właściciel, jeśli są przypomnienia.
2. `ProfileHeader`.
3. `RefreshingDot` — mała kontrolka/indikator odświeżania.
4. Style inline dla swipe hint.
5. `ProfileTopRow` — Społeczności / Kanały / Feed znajomych.
6. Swipe hint: `👆 Przesuń w lewo/prawo aby zmienić tryb`.
7. `ProfilePreviewMenu` — tylko właściciel po kliknięciu oka.
8. `ProfilePreviewBanner` — friend/stranger preview.
9. `ProfileActions` — tylko dla nie-właściciela.
10. Wrapper treści: `px-5 space-y-5 pt-4`.
11. Jeśli `profileMode === "professional"` i są zawody: `ProfessionBlock`.
12. Jeśli `professional` i brak zawodów: karta `Dodaj zawód`.
13. `ProfileCommunities` — obecnie null/placeholder; V2 nie robi pełnych społeczności tutaj.
14. `ProfileSpecialists` — tylko professional.
15. `ProfileProfessionalSection` — tylko professional.
16. `ProfilePostsSection` — tylko personal/public, nie stranger preview.
17. `ProfileTimeline` — tylko personal/public, nie stranger preview.
18. `PassionsPlaceholder` — legacy konflikt z V2; patrz sekcja ostrzeżeń.
19. `PreviewInfoBanner` — opis co widzi znajomy/nieznajomy.
20. `ProfileModals` — status, publish sheet, edit sheet, delete confirm, lightbox.

**V2 requirement:** zachować tę kolejność mobile, chyba że świadomie oznaczymy `VISUAL_DELTA_REQUIRED`.

---

## 5. Profil jako jeden model: osobisty + zawodowy layer

### 5.1 Tryby

Legacy używa:

```ts
profileMode: "public" | "professional"
```

Dla V2 nazewnictwo może być czystsze:

```ts
profileViewMode: "personal" | "professional"
```

Ale tekst UI ma zostać:

```txt
Osobisty
Zawodowy
```

### 5.2 Zasada własności domen

- `identity` posiada profil, bio, avatar/banner refs, visibility, zawody, specjalizacje.
- `social` posiada relacje/znajomych/contact access.
- `content-v2` posiada posty/prezentacje/milestones/feed items.
- `media` posiada uploady i asset refs.

Profil UI może komponować dane, ale nie wolno robić jednego “god component” z runtime innych domen.

---

## 6. ProfileHeader — najważniejszy blok mobile

### 6.1 Kolejność wewnątrz headera

Legacy komentarz mówi wprost:

```txt
Layout: Imię → [Avatar (lewa) | separator | Bio (prawa)] → StatusBar → Switcher → Banner
```

To jest krytyczne. Nie zamieniać kolejności.

### 6.2 Imię / nazwa użytkownika

- Wrapper: `px-3 pt-1.5 pb-2`.
- `h1`: `text-xl`, `font-bold`, `leading-[1.2]`, `Sora`, kolor `var(--px-text)` / fallback `var(--px-dark)`.
- Jedna linia, truncate.
- Brak dużego top margin — header zaczyna się blisko góry.

### 6.3 Avatar + bio row

- Row: `flex items-start`, padding boczny ok. `px-1.5`.
- Lewa kolumna: avatar + relationship status pod nim.
- Środek: pionowy separator.
- Prawa kolumna: label `O mnie` + bio editor/preview.

### 6.4 Avatar

Wymiary i styl:

```txt
w-36 h-36
rounded-full
padding white 3px
inner gradient #0F3CC9 → #6366F1
shadow: 0 8px 32px rgba(15,60,201,0.28)
```

Fallback:

- Tło: `#EFF6FF`.
- Litera: pierwsza litera imienia/nazwy.
- Font: Sora, około 42px, extra-bold.
- Kolor: `var(--px-primary)`.

Jeśli jest partner/relationship glow:

```txt
box-shadow: 12px 0 28px 6px rgba(251,191,36,0.28) + normal avatar shadow
```

### 6.5 Eye preview button na avatarze

Tylko owner.

- Pozycja: absolute bottom `-11px`, centralnie.
- Rozmiar: ok. `26x26`.
- Border: `2.5px solid #fff`.
- Background active: `var(--px-primary)`.
- Background inactive: `rgba(30,79,216,0.75)`.
- Ikona: Eye.
- Klik otwiera `ProfilePreviewMenu`.

### 6.6 Pionowy separator

- `w-px`.
- Marginesy: `ml-1 mr-2.5`.
- Gradient: transparent na górze/dole, `var(--px-primary)` w środku.
- Shadow: `rgba(30,79,216,0.25)`.
- Animacje:
  - `px-divider-drop 0.6s`.
  - `px-divider-pulse 3s`.

### 6.7 Bio label

- Tekst: `O mnie`.
- Uppercase.
- Mały font, muted.
- Nad BioEditor.

---

## 7. BioEditor — bardzo ważny detal

### 7.1 Wersja preview

- Maksymalnie 6 linii.
- Każda linia wysokość 32px.
- Gap między liniami: 4px.
- Cały blok: ok. 212px wysokości.
- Max znaków na linię: 24.
- Personal placeholder: `Dodaj opis...`.
- Professional placeholder: `Dodaj opis zawodowy...`.
- Owner empty state: italic/muted.
- Non-owner empty state: raczej ukrywać albo neutralny pusty widok, nie krzyczeć placeholderem.

### 7.2 Typewriter

Legacy bio preview ma efekt pisania:

- Start delay: ok. 300ms.
- Tempo: ok. 28ms / znak.
- Cursor animation: `px-bio-cursor`.
- Kursor ma mrugać subtelnie.

### 7.3 Edycja bio

- 6 pól/wierszy albo textarea zachowująca 6 linii.
- Border active: `1.5px var(--px-primary)`.
- Background: `#F8FAFC`.
- Radius: `rounded-lg`.
- Akcje: X + Check, ok. `28x28`.
- Note: `6 wierszy × 24 znaków`.
- Pencil edit button: top-right, ok. `26x26`, blue, pojawia się przy hover/click.

### 7.4 V2 uwaga

Nie kopiować runtime zapisu bio z legacy. Bio w V2 najpierw fixture/local state, potem identity profile persistence.

---

## 8. StatusBar osobisty

### 8.1 Kiedy widoczny

- W trybie osobistym/personal.
- Dla właściciela.
- Zawiera status pill + status photo.

### 8.2 Status pill z ustawionym statusem

Wygląd:

- flex-1, max-width ok. `260px`.
- `rounded-full`.
- Padding około `px 9px`, `py 4.5px`.
- Border 1.5px.
- Blue-ish background/border.
- Dot: gradient blue/violet, animacja `ph-dot`.
- Emoji/fluent icon.
- State text: ok. `11.3px`, bold.
- Description text: ok. `10.4px`, muted.
- Edit icon: `✏️`.
- Visibility friends icon: `👥`.

### 8.3 Status pill empty

Tekst:

```txt
Ustaw swój status...
```

Elementy:

- Sparkle `✶`.
- Animacja sparkle: `ph-sparkle`.
- Dla ownera może shake’ować co ok. 5s po 1.5s.
- Shake animation: `ph-shake`.

### 8.4 Status photo button

Rozmiar:

```txt
67x67
rounded-full
```

Jeśli jest zdjęcie:

- Border: `2.5px` violet.
- Animacja: `status-photo-glow`.

Jeśli puste:

- Gradient: violet/indigo.
- Dashed violet border.
- Ikona camera.
- Label: `foto`.
- Animacja: `status-photo-idle`.

### 8.5 Location row

- Ikona `MapPin`, ok. 13px.
- Tekst muted.
- Margin bottom ok. 2.

---

## 9. Status zawodowy / availability

W trybie zawodowym status nie jest zwykłym statusem osobistym, tylko availability.

### 9.1 Statusy

| ID | Tekst | Kolory |
|---|---|---|
| `available` | `Dostępny` | text `#059669`, bg `#ECFDF5`, border `#A7F3D0`, dot `#10B981` |
| `open` | `Otwarty na współpracę` | text `#2563EB`, bg `#EFF6FF`, border `#BFDBFE`, dot `#3B82F6` |
| `looking` | `Szukam pracy` | text `#7C3AED`, bg `#F5F3FF`, border `#DDD6FE`, dot `#8B5CF6` |
| `busy` | `Zajęty` | text `#D97706`, bg `#FFFBEB`, border `#FDE68A`, dot `#F59E0B` |
| `unavailable` | `Niedostępny` | text `#64748B`, bg `#F8FAFC`, border `#E2E8F0`, dot `#94A3B8` |

### 9.2 Dropdown

- Tylko owner.
- Portal/fixed, z-index ok. `9999`.
- Rounded-xl.
- Shadow-xl.
- Animacja `px-dropdown-in`.
- Klik poza zamyka.

---

## 10. Przełącznik Osobisty / Zawodowy

### 10.1 Lokalizacja

- W headerze nad bannerem.
- Prawa strona.
- `px-3 mt-2.5`.

### 10.2 Wygląd

Container:

```css
background: #F1F5F9;
border-radius: 28px;
padding: 3px;
gap: 2px;
box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
```

Button:

```css
padding: 8px 22px;
border-radius: 24px;
font-family: DM Sans;
font-size: 14px;
font-weight: 600;
transition: all 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

Active:

```css
background: var(--px-primary);
color: #fff;
box-shadow: 0 3px 10px rgba(30,79,216,0.3);
```

Inactive:

```css
color: var(--px-muted);
background: transparent;
```

### 10.3 Swipe hint

Tekst dokładny:

```txt
👆 Przesuń w lewo/prawo aby zmienić tryb
```

Animacje:

- `px-swipe-hint`.
- `px-hint-fade`.

**V2 requirement:** mobile swipe/gesture albo przynajmniej hint + przyciski. Jeśli gest nie jest gotowy w pierwszym PR, oznaczyć jako `GESTURE_PENDING`, nie usuwać hintu bez decyzji.

---

## 11. Banner profilu

### 11.1 Wymiary i pozycja

- Container: `relative mt-2 mx-[1%] rounded-2xl overflow-hidden`.
- Mobile aspect: w praktyce profile banner mobile ma okolice `5/2` / `20/9` w użyciu sekcji.
- Crop output dla profilu:
  - desktop: `1200x360` = `10:3`.
  - mobile: `900x360` = `5:2`.

### 11.2 Empty banner

Tło:

```css
linear-gradient(135deg, #0F3CC9 0%, #2563EB 45%, #4F46E5 100%)
```

Na tym subtelny SVG placeholder:

- mini dokumenty/karty/charts/kpi.
- opacity ok. 22%.
- nie ma wyglądać jak zwykły szary placeholder.

### 11.3 Image banner

Jeśli image i motion allowed:

- Ken Burns: `px-ken-burns`, ok. 18s infinite.
- Scale 1 → 1.04.
- Subtelny translateY do ok. -4px.
- Parallax based on scroll: translateY zależny od scroll.

### 11.4 Shimmer

- Animacja `px-shimmer`.
- Delay ok. 600ms.
- Duration ok. 0.85s.
- White gradient 40%, skew -18deg.

### 11.5 Overlay

- Radial overlay: `rgba(255,255,255,0.08)`.
- Pozycja ok. 30% 40%.

### 11.6 Share button

- Pozycja: top 3.5, right 3.5.
- Rozmiar: `36x36`.
- Background: `rgba(255,255,255,0.2)`.
- Border: white transparent/subtle.
- Ikona: `Share2`, white.
- UX: native share albo copy link.

---

## 12. Social links pod headerem

Pokazywać tylko gdy istnieje przynajmniej jeden link:

- LinkedIn.
- GitHub.
- Instagram.
- Website.

Layout:

- `flex wrap gap-2 px-3 mt-3`.
- Link square: `48x48`, `rounded-xl`.

Kolory:

- LinkedIn: `#0A66C2`, link `https://linkedin.com/in/...`.
- GitHub: `#24292E`.
- Instagram: gradient `#f09433 → #e6683c → #dc2743 → #cc2366 → #bc1888`.
- Website: slate/gray.

---

## 13. ProfileTopRow — trzy portal cards

### 13.1 Kolejność

1. `Społeczności`
2. `Kanały`
3. `Feed znajomych`

Nie zmieniać kolejności.

### 13.2 Container

```txt
flex flex-col
mt-4 mb-2 px-5 gap-3
```

### 13.3 PortalCard wspólny wygląd

- Background: white / `#FAFAFA`.
- Border: `1.5px #E2E8F0`.
- Radius: `xl`.
- Padding: `px 14`, `py 12`.
- Shadow: `0 1px 4px rgba(0,0,0,0.06)`.
- Icon box: `44x44`, radius ok. 10.
- Accent radial background.
- Press: scale ok. `0.97`.
- Animation: `ptr-slideIn 0.38s`, delays `0/80/160ms`.

### 13.4 Card 1 — Społeczności

```txt
Title: Społeczności
Subtitle: Twoje grupy i dyskusje
Route: /communities
Accent: #3B82F6
Icon bg: #1E3A5F
Icon color: #60A5FA
```

W V2: tylko CTA/profile slot, nie pełny runtime communities na tym etapie.

### 13.5 Card 2 — Kanały

```txt
Title: Kanały
Subtitle: Subskrybuj kanały twórców
Route: /ringpost
Accent: #8B5CF6
Icon: Radio
Featured: true
Badge: LIVE, jeśli hasNewRingPost
Badge color: #8B5CF6, bg #EDE9FE
```

W V2: UI slot/disabled route until channels later.

### 13.6 Card 3 — Feed znajomych

```txt
Title: Feed znajomych
Subtitle: Posty Twoich znajomych
Route: /friends-feed
Accent: #EE1D52
Icon bg: #3D0020
Notif count: cap 99
Badge if 0: 0 odkryj!
Badge if >0: {n} new
```

---

## 14. Kontakty / znajomi carousel

### 14.1 Kiedy pokazywać

- Tryb osobisty.
- Owner.
- Nie w stranger preview.

### 14.2 Header

- Tytuł: `Kontakty`.
- Ikona users w blue gradient / blue bg.
- Search pill: max width ok. `140px`, placeholder `Szukaj...`.

### 14.3 Kategorie/tabs

| Tab | Kolor |
|---|---|
| `Wszyscy` | `#2563EB` / bg `#EFF6FF` |
| `Bliscy` | `#7C3AED` / bg `#F5F3FF` |
| `Rodzina bliska` | `#EC4899` / bg `#FDF2F8` |
| `Rodzina dalsza` | `#8B5CF6` / bg `#F5F3FF` |

Każdy tab ma count pill.

### 14.4 Carousel area

- Full bleed: `w-[calc(100%+40px)] ml-[-20px]`.
- Background: `rgba(248,250,252,0.8)`.
- Border top: slate-200.
- Gap między cardami: ok. 6px.
- Item width: ok. 67px.
- Height: ok. 100px przy animated.

### 14.5 FriendCard

- Avatar: `61x61`, rounded full.
- Border: 2px white.
- Shadow subtle.
- Fallback bg: slate-100.
- Online dot: 12px, green, bottom-right.
- First name: 10px bold.
- Last name: 9px slate/muted.

### 14.6 Fade overlays

- Left/right overlay width ok. 40px.
- Gradient from `rgba(255,255,255,.9)` to transparent.

### 14.7 Behavior

- Auto-carousel jeśli nie ma search i długość >= 4.
- Touch/swipe engine.
- V2 może odtworzyć behavior, ale nie kopiować starego hooka 1:1.

---

## 15. QuickFeedPreview pod kontaktami

### 15.1 Pozycja

- Bezpośrednio pod friends carousel.
- Full bleed: `w-[calc(100%+40px)] -mx-5`.

### 15.2 Toggle button

Tekst:

```txt
Ostatnie posty
```

Wymiary/styl:

- Width: `calc(100% - 32px)`.
- `mx-4`.
- Padding: `px-3`, `py 16.56px`.
- Border top/bottom `#E2E8F0`.
- Closed bg: gradient `#F8FAFC → #F1F5F9`.
- Open bg: gradient `#EFF6FF → #E0E7FF`.

Lewa strona:

- Clock icon size 12.
- Label 13px bold.
- Stacked avatars max 3, `18x18`, overlap `ml -5`.

Prawa strona:

- Red dot `14x14`.
- Animation: `qfp-pulse 1.8s`.
- Text: `LIVE`, 13px extra-bold.
- Chevron up/down.

### 15.3 Panel

- Height animation: max-height ok. 600px.
- Duration: 380ms.
- Easing: `cubic-bezier(0.4,0,0.2,1)`.

Loading skeleton:

- `qfp-shimmer`.
- Grid: first row 2 columns, one big `h-40` row-span-2 + two smaller blocks.
- Second row: 3 blocks `h-20`.

Empty text:

```txt
Brak postów kontaktów
```

Action:

- Klik tile opens post detail sheet.
- `Zobacz wszystko` / route to `/friends-feed` behavior.

### 15.4 V2 warning

Legacy `quickFeedUtils.ts` używa `localStorage` (`qfp_last_opened`). W V2 nie kopiować tego jako fake runtime. Dla UI shell można użyć state komponentu albo fixture.

---

## 16. Preview mode właściciela

### 16.1 Otwieranie

- Eye button na avatarze.
- Menu fixed, około top 220, left 4.
- Animacja `px-dropdown-in`.

### 16.2 Menu

Header:

```txt
Podgląd profilu
```

Opcje:

```txt
Widok znajomego
Widok nieznajomego
Zamknij podgląd
```

Kolory:

- Friend: blue.
- Stranger: amber.

### 16.3 Banner preview friend

Tekst:

```txt
👥 Podgląd: widok znajomego
Znajomi widzą Twój feed, status i aktywności
```

Styl:

- Gradient blue-50 to blue-200.
- Border blue-400.
- Close: `×`.

### 16.4 Banner preview stranger

Tekst:

```txt
👤 Podgląd: widok nieznajomego
Nieznajomi widzą tylko publiczne informacje i zawody
```

Styl:

- Amber gradient/border.
- Close: `×`.

### 16.5 Info banner friend/stranger

Stranger legacy copy:

```txt
👤 Co widzą nieznajomi:
- Zdjęcie profilowe i imię
- Zawód główny i specjalizacje
- Bio i lokalizacja
- Sekcja Społeczności (liczba)
Feed pasji, posty, aktywności i pasje są ukryte dla nieznajomych.
```

Friend legacy copy:

```txt
👥 Co widzą znajomi:
- Wszystko co widzą nieznajomi
- Feed pasji z Twoimi postami
- Twoje posty w prezentacji profilu
- Ważne wydarzenia z życia
- Pasje i zainteresowania
```

**V2 decision needed:** słowo `pasje` koliduje z removed legacy product area. Rekomendacja: zamienić widoczny produktowo tekst na `zainteresowania` lub `aktywności`, ale zachować strukturę bannera. Jeśli właściciel chce dosłownie copy legacy, oznaczyć to świadomie jako wyjątek tekstowy bez aktywacji domeny `passions`.

---

## 17. Non-owner actions

Dla osoby niebędącej właścicielem, pod headerem pokazuje się `ProfileActions`.

Legacy:

- Container: `flex gap-3 mt-4 px-5`.
- Primary button: blue rounded-3xl, py-3 px-5, shadow.
- Secondary circles: `48x48`.

Teksty/akcje:

```txt
Propoś o kontakt
```

Uwaga: legacy ma prawdopodobną literówkę `Propoś`. Poprawna polszczyzna to `Poproś o kontakt`. Do decyzji: jeśli “kropka i przecinek” literalnie, zachować; moja rekomendacja produktowa: poprawić literówkę i zanotować `TEXT_FIX_NOT_VISUAL_DELTA`.

Pozostałe akcje:

- UserPlus circle.
- Share circle.
- Native share / clipboard.

---

## 18. Personal profile — Prezentacja profilu

### 18.1 Kiedy widoczna

- Tryb osobisty.
- Nie w stranger preview.

### 18.2 Header

```txt
Prezentacja profilu
{posts.length}/12 postów
```

- Klasa legacy `profile-section-header`.
- Title class `profile-section-title`.
- Subtitle class `profile-section-subtitle`.
- Owner add button: Plus, `36x36`, blue circle, jeśli posts < 12.

### 18.3 Empty state

Container:

- Centered.
- `px-5 py-8`.
- Background `#FAFBFF`.
- Radius 20.
- Border dashed slate-300.

Icon:

- `56x56`, rounded-2xl.
- Green gradient.
- Camera icon 26.

Teksty:

```txt
Brak postów
Dodaj do 12 postów ze zdjęciami i filmami.
Ten użytkownik nie dodał jeszcze żadnych postów.
```

Pierwszy opis dla ownera, drugi dla non-owner.

### 18.4 Post card

- Card radius 16.
- Background white.
- Border `var(--px-border)`.
- Shadow `0 1px 4px rgba(0,0,0,0.04)`.
- Hover: shadow `0 4px 16px`, translateY(-1).

Badge:

```txt
Prezentacja profilu
```

Badge style:

- Color `#1E4FD8`.
- Bg `#EFF6FF`.
- Border `#BFDBFE`.
- Font 10px bold.

Content:

- Title optional: 14px bold.
- Description/content: 13px DM Sans, line-height 1.65.
- Media via `PostMediaDisplay`.

Actions:

- Reactions.
- `Komentarz` with MessageCircle and count.
- `Udostępnij` / Send.
- Universal share sheet.
- Comments section.

---

## 19. Personal profile — Ważne wydarzenia

### 19.1 Header

```txt
Ważne wydarzenia
Oś czasu Twojego życia
```

Owner add Plus if less than 12.

### 19.2 View switch

Jeśli są milestones:

- Pill bg indigo50.
- Border indigo200.
- Buttons ok. `36x34`.
- Ikony: `AlignJustify`, `LayoutList` rotated -90.
- Active: blue shadow.

### 19.3 Empty state

Teksty:

```txt
Brak ważnych wydarzeń
Dodaj ważne momenty ze swojego życia na osi czasu.
Ten użytkownik nie dodał jeszcze żadnych wydarzeń.
```

Icon:

- Star amber.
- Centered card `#FAFBFF`, dashed border.

### 19.4 Timeline circles

- Date circle `44x44`.
- Border white 3.
- Background from dot color.
- Shadow/ring.
- Pulse ring: `milestoneCirclePulse 2.2s`.

Dot colors:

```txt
var(--px-primary)
#7C3AED
#D97706
#059669
#DC2626
```

### 19.5 Horizontal timeline

- Overflow-x.
- Negative side margin `-mx-5`.
- Min width max.
- Line: top 8, h 0.5, gradient primary → violet → amber.
- Item width: ok. 305px.

### 19.6 Vertical timeline

- Left line: gradient, left 4, top 3, bottom 3, width 0.5.
- Each item: date circle column + card.

### 19.7 Anniversary banner

Owner only around milestone anniversary.

Teksty relative:

```txt
{diffDays} dni temu
miesiąc temu
{diffMonths} miesiące temu
pół roku temu
rok temu
dwa lata temu
trzy lata temu
cztery lata temu
{diffYears} lat temu
```

Card:

- Amber gradient.
- Border amber300.
- Emoji/sparkle.

---

## 20. MilestonePostCard

Card:

- Rounded-2xl.
- Bg card/white.
- Border.
- Shadow `0 2px 12px`.
- Hover: shadow `0 6px 20px`, translateY(-1).

Badge:

```txt
⭐ Ważne wydarzenie
```

Badge colors:

- Text `#D97706`.
- Bg `#FFFBEB`.
- Border `#FDE68A`.

Tagged friend:

- Button text: `z {name}`.
- Green `#16A34A`.
- Avatar 32.

Milestone avatar:

- `64x64`, round.
- Border 3.
- Shadow.

If no feedPostId:

```txt
Wydarzenie prywatne
```

---

## 21. Professional layer — główny blok zawodu

### 21.1 Kiedy widoczny

- Tryb zawodowy.
- Jeśli są professions: `ProfessionBlock`.
- Jeśli brak: empty/dashed `Dodaj zawód` card.

### 21.2 Empty professional card

Teksty:

```txt
Dodaj zawód
Uzupełnij profil zawodowy aby być znajdowanym
Dodaj
```

Styl:

- Dashed border.
- Primary-light background.
- Ikona 💼.

### 21.3 ProfessionBlock active card

Wymiary:

- Fixed-ish height: ok. 120px.
- Border-left: `3.5px #1E4FD8`.
- Radius: `rounded-2xl`.
- Gradient: `#F0F5FF → #FAFBFF`.
- Border: blue-200.

Lewy icon zone:

- Width ok. 60px.
- Icon box: `40x40`, rounded-xl.
- Gradient `#1E4FD8 → #3B82F6`.
- Icon Briefcase white.

Title:

- Profession name: 15px bold.
- Badge primary:

```txt
Główny
```

Badge:

- 8px uppercase.
- Blue bg rgba.

### 21.4 Specialization tags

- Max visible: 5.
- Area height: ok. 56px.
- Wrap.
- Font: 11px medium slate.
- Background: white .9.
- Border: slate200.
- Radius: 20.
- Padding: `px10 py3`.

### 21.5 Linked activities

Jeśli activity istnieje:

- Button bg `rgba(30,79,216,0.05)`.
- Border rgba primary.
- Padding `9x14`.
- Icon/avatar 24.
- Label:

```txt
Moja praca:
```

- Title: 13px bold blue.
- Chevron.

Jeśli empty:

- Dashed button.
- Owner text:

```txt
Dodaj moją stronę →
```

- Non-owner text:

```txt
Brak powiązanego miejsca pracy
```

### 21.6 ProfessionSwitcher

- Chips for other professions.
- Flex wrap gap 1.5.
- Active: blue gradient.
- Inactive: white, border `#CBD5E1`.
- Dot color based on primary.
- Aria-label:

```txt
Przełącz na: {professionName}
```

---

## 22. ProfileSpecialists

### 22.1 Header

- Icon: Briefcase in orange background.
- Title:

```txt
Specjaliści
```

- Subtitle:

```txt
{count} osób
```

### 22.2 Owner visibility toggle

Teksty:

```txt
Widoczne
Ukryte
```

Switch:

- 40x22.
- Active orange / inactive slate.

### 22.3 Empty state

Teksty:

```txt
Nie dodano jeszcze żadnych specjalistów
Brak specjalistów do wyświetlenia
```

### 22.4 List

- Flex wrap gap 2.
- Max visible: 8.
- Item width: 60.
- Avatar: `44x44`, border orange.
- Fallback: first letter.
- Name: first name, 10px.
- More badge: `+N`.

---

## 23. ProfileProfessionalSection

### 23.1 Tab switcher

Centered profile-mode-switcher.

Buttons:

```txt
Klasyczny
Sieć
```

Icons:

- `LayoutGrid`.
- `Users`.

### 23.2 Klasyczny

Anchor:

```txt
moja-praca-section
```

Owner disabled button:

```txt
Moja praca
```

- Plus icon.
- Full width.
- Bg slate100.
- Text slate400.
- Cursor not-allowed.

Warning card:

```txt
🔧
Moduł w budowie
Sekcja Miejsce pracy będzie dostępna wkrótce.
```

**V2:** to musi być disabled/policy state, nie fake final feature.

### 23.3 Bottom sheet `Co chcesz dodać?`

Title:

```txt
Co chcesz dodać?
```

Close X.

Work types:

| Label | Desc | Route | Color | Bg |
|---|---|---|---|---|
| `Stanowisko` | `Pokaż swoją rolę zawodową w firmie lub organizacji.` | `/activity/new/workplace` | `#6366F1` | `#EEF2FF` |
| `Organizacja` | `Pokaż swoją firmę, markę albo organizację i czym się zajmuje.` | `/activity/new/company` | `#0EA5E9` | `#F0F9FF` |
| `Projekt` | `Zrealizowany projekt lub case study` | `/activity/new/project` | `#3B82F6` | `#EFF6FF` |
| `Usługa` | `Pokaż, co oferujesz klientom jako usługę.` | `/activity/new/service` | `#10B981` | `#ECFDF5` |
| `Produkt` | `Aplikacja, kurs, ebook, SaaS` | `/activity/new/product` | `#F59E0B` | `#FFFBEB` |

### 23.4 Empty professional activities

Teksty:

```txt
Brak działań zawodowych
Dodaj projekt, usługę lub case study aby pokazać swoją pracę.
Ten użytkownik nie dodał jeszcze żadnych działań zawodowych.
```

### 23.5 ActivityCard

Types/colors:

| Type | Label | Color | Bg | Border | Gradient |
|---|---|---|---|---|---|
| `project` | `Projekt` | `#3B82F6` | `#EFF6FF` | `#BFDBFE` | `#3B82F6 → #6366F1` |
| `service` | `Usługa` | `#10B981` | `#ECFDF5` | `#A7F3D0` | `#10B981 → #06B6D4` |
| `case_study` | `Case Study` | `#6366F1` | `#EEF2FF` | `#C7D2FE` | `#6366F1 → #8B5CF6` |
| `workplace` | `Miejsce pracy` | `#6366F1` | `#EEF2FF` | `#C7D2FE` | `#6366F1 → #4F46E5` |
| `product` | `Produkt` | `#F59E0B` | `#FFFBEB` | `#FDE68A` | `#F59E0B → #EF4444` |
| `event` | `Wydarzenie` | `#EF4444` | `#FEF2F2` | `#FECACA` | `#EF4444 → #F97316` |
| `hobby` | `Hobby` | `#8B5CF6` | `#F5F3FF` | `#DDD6FE` | `#8B5CF6 → #EC4899` |
| `company` | `Organizacja` | `#0EA5E9` | `#F0F9FF` | `#BAE6FD` | `#0EA5E9 → #6366F1` |

Card layout:

- `card-hover-px`.
- Flex row, gap 4.
- Avatar square: `w-14 h-14`, rounded-2xl, gradient based on type.
- Title: `text-h3`, truncate.
- Badge: 9px font-bold, icon 8px.
- Subtitle: `text-small`, truncate.
- Delete button if owner: `32x32`, hover red bg.

**V2 note:** `hobby` is not `passions` domain. If kept visually, map to `activity_interest` or disabled visual only.

### 23.6 Sieć / Network view

SVG viewBox:

```txt
400 x 460
center: 200, 230
ring radius: 140
```

Elements:

- Dashed ring: stroke `#E2E8F0`, strokeWidth 1.5, dash `4 4`.
- Lines center→nodes: stroke `#E2E8F0`.
- Center avatar: `80x80`, border 3 primary.
- Center name: 11px bold.
- Center profession: 9px muted.
- Max nodes: 5.
- Node image/icon: `72x72`, rounded-2xl, border 2 colored by activity type.
- Node title: 10px semibold, line clamp 2.

Empty text:

```txt
Dodaj działania aby zobaczyć widok sieci
```

---

## 24. Profession editor flow

### 24.1 Header

Titles:

```txt
Wybór zawodu
Profil zawodowy
```

Subtexts:

```txt
Krok 1 z 2 — wybierz zawód
Krok 2 z 2 — wybierz specjalizacje
Edycja
```

### 24.2 Progress

Steps:

```txt
Zawód
Specjalizacje
```

### 24.3 Krok 1 — Moje zawody

Header:

```txt
Moje zawody
{selectedProfessions.length}/3
```

Badges:

```txt
Główny
Dodatkowy
```

Actions:

- Pencil: edytuj specjalizacje.
- Star: ustaw jako główny.
- Trash: usuń.

### 24.4 Krok 1 — Wyszukaj zawód

Card title:

```txt
Wyszukaj zawód
```

Search placeholder:

```txt
Wpisz nazwę zawodu...
```

No result:

```txt
Nie znaleziono zawodu
```

Separator:

```txt
— lub wybierz kategorię —
```

Category grid:

- 2 columns.
- Button `p-3 rounded-xl text-xs`.
- Icon + name.
- Active scale 0.95.

Category search placeholder:

```txt
Szukaj w kategorii...
```

Empty category:

```txt
Brak wyników
Brak zawodów w tej kategorii
```

Limit warning:

```txt
Osiągnięto limit 3 zawodów. Usuń jeden, aby dodać nowy.
```

### 24.5 Propose new profession

Collapsed row text:

```txt
+ Nie znalazłem swojego zawodu — dodaj nowy
```

Info:

```txt
Zawód będzie widoczny na Twoim profilu z etykietą "⏳ Oczekuje na weryfikację"
```

Labels/placeholders:

```txt
Nazwa zawodu
Nazwa zawodu
Kategoria
Wybierz kategorię
Podaj nazwę i kategorię
Wyślij propozycję
Wysyłanie...
```

### 24.6 Krok 2 — Specializations

Teksty:

```txt
Wybierz specjalizacje
Krok 2 z 2 — dla zawodu: {name}
Zawód główny — możesz wybrać do 7 specjalizacji
Wybrano: {count}/{limit} — wybierz co najmniej 2
— osiągnięto limit
✓
Szukaj specjalizacji...
Dodaj własną specjalizację
Np. Analiza danych klientów (max 3 słowa, 40 znaków)
{chars}/40 znaków · {words}/3 słowa
Dodaj
Dalej →
Wybierz jeszcze {n} specjalizację/e
```

Rules:

- Primary profession: up to 7 specializations.
- Minimum 2 for primary flow.
- Custom specialization max 3 words, max 40 chars.

### 24.7 Success step

Teksty:

```txt
✅
Profil zawodowy gotowy!
Twój zawód został zapisany
Główny
Możesz dodać jeszcze do {3 - addedCount} zawodów dodatkowych.
{addedCount} z 3 możliwych zawodów
Dodaj zawód dodatkowy
Zakończ i przejdź do profilu →
Zapisywanie...
```

Animacja:

- `successPop 0.5s cubic-bezier(0.34,1.56,0.64,1)`.

### 24.8 Final step

Teksty:

```txt
Witaj w PlatformaX{, firstName}! 🎉
Twój profil zawodowy jest gotowy.
Zawody dodane
Specjalizacje wybrane
Bio
Zdjęcie profilowe
Pomiń na razie
Przejdź do swojego profilu →
Następne kroki
Uzupełnij profil zawodowy
Dodaj więcej zawodów i specjalizacji
Znajdź znajomych
Wyszukaj specjalistów w swojej branży
Odkryj społeczności
Dołącz do grup wokół Twoich tematów
Edytuj zawody i specjalizacje
```

Confetti:

- 10 pieces.
- Colors: `#1E4FD8`, `#F97316`, `#16A34A`, `#EC4899`, `#F59E0B`, `#7C3AED`, `#0EA5E9`, `#EF4444`, `#14B8A6`, `#6366F1`.
- Animation: `confettiFall 1.2s ease-in forwards`, delay each `i*0.08s`.

---

## 25. Status modal

### 25.1 Bottom sheet

- Overlay: fixed inset, z `1000`, black/50, backdrop blur.
- Sheet: bottom aligned, max width 480.
- Rounded top: `20px`.
- Padding: px4 pt4 pb8.
- Max height: 90vh.
- Animation: `slideUp 0.22s ease`.
- Handle: `w-9 h-1`, bg slate-200, centered.

### 25.2 Header

```txt
Twój stan
Usuń status
```

### 25.3 Preview block

- Dark slate/black block.
- Avatar dot `Ty`.
- Label: `Ty — {previewLabel}`.
- Right text:

```txt
podgląd
```

### 25.4 Status photo mini section

Label:

```txt
Zdjęcie statusowe (opcjonalnie)
```

Texts:

```txt
Zdjęcie będzie widoczne zamiast awatara w pasku statusów
Wygasa razem ze statusem · max 5 MB
```

### 25.5 Categories

Categories:

```txt
Nastrój
Zdrowie
Praca
Aktywność
```

Grid states: 4 columns, min height 58, chips with Fluent emoji.

State examples exact:

- Mood: `zadowolony`, `szczęśliwy`, `wdzięczny`, `spokojny`, `pełen energii`, `zrelaksowany`, `wyciszony`, `refleksyjny`, `zmęczony`, `senny`, `smutny`, `zestresowany`.
- Health: `w formie`, `świetnie się czuję`, `po treningu`, `zdrowy`, `odpoczywam`, `regeneracja`, `dbam o siebie`, `chory`, `przeziębiony`, `boli mnie głowa`, `rekonwalescencja`, `osłabiony`.
- Work: `skupiony`, `produktywny`, `planuję`, `tworzę`, `zajęty`, `na spotkaniu`, `deadline`, `praca zdalna`, `w biurze`, `po pracy`, `na urlopie`, `na przerwie`.
- Activity: `na spacerze`, `w podróży`, `na siłowni`, `na mieście`, `czytam`, `gram`, `gotuję`, `oglądam film`, `w domu`, `ze znajomymi`, `z rodziną`, `odpoczywam`.

### 25.6 Custom state

Placeholder:

```txt
lub wpisz własny stan…
```

Limit:

```txt
{selectedState.length}/17
Możesz dodać maksymalnie 2 emoji
```

### 25.7 Description

Placeholder:

```txt
Dodaj opis (opcjonalnie)
```

Limit:

```txt
{text.length}/60
Możesz dodać maksymalnie 3 emoji
```

### 25.8 Expiry

Label:

```txt
Czas wygaśnięcia
```

Tabs:

```txt
Godziny
Dni
```

Stepper:

```txt
−
{n} godz.
{n} dzień / dni
+
```

Hours max in status modal: 23. Days max: 30.

### 25.9 Visibility

Label:

```txt
Widoczność
```

Options:

```txt
🌍 Publiczny
👥 Tylko znajomi
```

### 25.10 Friend status source

Label:

```txt
Statusy znajomych
```

Options:

```txt
👥 Wszyscy znajomi
❤️ Bliscy znajomi
```

### 25.11 Buttons

```txt
Anuluj
Zapisz status
Zapisuję…
```

---

## 26. Status photo modal

### 26.1 Flow legacy

1. Klik `Wybierz zdjęcie`.
2. Browser picker.
3. Preview + expiry options.
4. Dopiero klik `Opublikuj` robi upload.

### 26.2 V2 warning

Legacy używa `FileReader.readAsDataURL` i base64 do uploadu. W V2 nie wolno kopiować. UX można odtworzyć, ale runtime później przez `media` domain / presigned upload.

### 26.3 Header copy

```txt
Zdjęcie statusowe
Widoczne przy Twoim statusie dla znajomych
```

### 26.4 Preview

- Circle `220x220`.
- If image: border 3 violet-600.
- Overlay bottom:

```txt
Zmień zdjęcie
```

Empty:

```txt
Dodaj zdjęcie statusowe
Dotknij, aby wybrać zdjęcie
```

### 26.5 Expiry label

```txt
ZDJĘCIE WYGAŚNIE PO
Godzinach
Dniach
```

Limits:

- Hours 1–72.
- Days 1–30.

### 26.6 Buttons

```txt
✓ Opublikuj zdjęcie statusowe
Publikuję…
Wybierz zdjęcie statusowe
Zmień zdjęcie statusowe
Wybierz inne zdjęcie
Usuń zdjęcie statusowe
Usuwam…
```

---

## 27. Image edit / crop UX

### 27.1 Overlay behavior

- Owner taps avatar/banner once → pencil appears for 2.5s.
- Second tap/pencil → action menu.
- Pencil style:
  - Avatar: bottom -4, right -4.
  - Banner: top 8, right 10.
  - Background: `rgba(100,116,139,0.75)`.
  - Border: 2px white.
  - Shadow: `0 2px 6px rgba(0,0,0,0.14)`.
  - Animation: `fadeIn 0.18s`.

### 27.2 Action menu

Bottom sheet:

- Overlay: black 0.5.
- Sheet max width lg.
- Radius top 20.
- Padding 8 0 24.
- Handle `40x4`.

Title:

```txt
Edytuj avatar
Edytuj baner
```

Actions exact legacy spelling:

```txt
Kadruj zdjecie
Zmien kadr bez wgrywania nowego zdjecia
Zmien zdjecie
Wgraj nowe zdjecie z galerii
Usun zdjecie
Usun avatar z profilu
Usun baner z profilu
Anuluj
```

Note: legacy lacks Polish diacritics in this menu (`zdjecie`, `Zmien`, `Usun`). Decision: if literal copy, preserve; if polished V2, fix to `zdjęcie`, `Zmień`, `Usuń` and document delta.

### 27.3 Crop editor

- Fullscreen fixed, z 9999.
- Background `#0a0a0a`.
- Header bg black 0.6, border rgba white .12.
- Left button:

```txt
Anuluj
```

- Center title:

```txt
Ustaw baner
Ustaw avatar
```

- Right button:

```txt
Zapisz
Zapisuję...
```

### 27.4 Banner crop tabs

For profile banner dual crop:

```txt
Komputer
Telefon
```

Instruction labels:

```txt
Kadr komputerowy (10:3) · Przeciągnij i zoom
Kadr mobilny (5:2) · Przeciągnij i zoom
```

### 27.5 Crop dimensions

Profile banner output:

```txt
Desktop: 1200x360, aspect 10:3
Mobile: 900x360, aspect 5:2
Avatar: 400x400
```

Zoom controls:

- Buttons `52x52`, round, white, shadow.
- Text percent in center, white, bg rgba white .1, radius 12.

---

## 28. Universal publish sheet — profile post / milestone

### 28.1 Mobile full-screen sheet

- Fixed inset, white.
- z-index 9999.
- Animation `universalPublishSlideUp 0.26s cubic-bezier(0.32, 0.72, 0, 1)`.
- Padding safe area top/bottom.

Header:

- Left: X button, 36x36, round, border.
- Center: more `⋯`, 28x28.
- Right: publish pill.

Publish button texts:

```txt
Opublikuj
Publikuję...
```

Disabled: border/bg muted, cursor not-allowed.
Active: gradient `var(--px-primary) → #7C3AED`, shadow `0 2px 12px rgba(79,70,229,0.35)`.

### 28.2 Author context

Default context labels:

```txt
Ważne wydarzenie
Prezentacja profilu
Społeczność
Moja praca
Kanały
Post
```

Profile post placeholder:

```txt
Opisz prezentację swojego profilu...
```

Milestone placeholder:

```txt
Opisz ważne wydarzenie...
```

Milestone title placeholder:

```txt
Tytuł wydarzenia *
```

General placeholder typo from legacy:

```txt
Co słychąć?
```

Recommendation: fix typo to `Co słychać?` if used in V2.

---

## 29. Manage/edit profile modal

Legacy edit profile appears as modal/sheet with tabs.

### 29.1 Tabs likely

- Dane.
- Kontakt.
- Prywatność.

### 29.2 Dane tab

Fields:

```txt
Imię
Nazwisko
Bio
Lokalizacja
```

Bio placeholder:

```txt
Kilka słów o sobie... (max 5 linii × 35 znaków)
```

Bio limits:

- Max 5 lines.
- Max 35 chars per line.
- Max 175 total.
- Counter `{editBio.length}/175`.

### 29.3 Kontakt tab

Fields:

```txt
Telefon
WhatsApp
Email kontaktowy
Media społecznościowe
Instagram
Facebook
Telegram
LinkedIn
GitHub
Strona WWW
```

Placeholders:

```txt
+48 123 456 789
kontakt@example.com
@twoja_nazwa
facebook.com/twoja-strona
linkedin.com/in/twoj-profil
github.com/twoj-nick
https://twoja-strona.pl
```

Phone confirmation:

```txt
Potwierdzam, że to mój prawdziwy numer telefonu
```

### 29.4 Prywatność tab

Info text:

```txt
Kontroluj kto widzi Twoje dane. Znajomi Zatwierdzeni to osoby, którym zaakceptowałeś prośbę o kontakt.
```

Status source setting:

```txt
Statusy tylko od bliskich
Pasek statusów pokaże tylko Bliskich znajomych
```

Visibility labels:

```txt
Znajomi widzą
Zatwierdzeni widzą
Brak danych
```

### 29.5 Footer

Buttons:

```txt
Anuluj
Zapisz
Zapisywanie...
```

**V2 privacy:** phone/email/contact are private profile data. Public DTO cannot include these by default.

---

## 30. Public profile / profile innej osoby

### 30.1 Public hero

- Banner aspect approx `10/3`.
- Avatar `96x96`.
- Name/title.
- Status.
- Primary profession/location.

### 30.2 Public tabs

Tabs:

```txt
Osobisty
Zawodowy
```

Stats:

```txt
Znajomi
Społeczności
```

Personal tab:

- Bio.
- Milestones.
- Interests/passions legacy wording.

Professional tab:

- Professional bio.
- Professions.
- Specialization tags.
- Activities.

### 30.3 Public action buttons

Possible labels:

```txt
Dodaj do kontaktów
Zaproś do znajomych
Poproś o kontakt
Napisz wiadomość
Obserwuj
W kontaktach
Znajomy
Oczekuje
Zaakceptuj
Wysłano
```

`Obserwuj` is disabled in some state.

### 30.4 Public warning copy

Legacy has:

```txt
Podgląd profilu innych osób jest w budowie — wkrótce będzie pełny widok.
```

V2 should not use “w budowie” as final UI. For shell, use disabled status or internal report. Avoid shipping as product copy unless accepted.

---

## 31. Friends feed full screen — visual parity requirement

### 31.1 Header

Texts:

```txt
PlatformaX
Feed znajomych
Tylko Twoi znajomi
```

Style:

- `PlatformaX`: 10px, extra-bold, brand gradient/primary.
- H1: Sora, 20px/xl, extra-bold, line-height 1.2.
- Subtitle: 12px muted.

### 31.2 New card

Text:

```txt
Nowe i zaległe
Posty od ostatniej wizyty
```

If newCount > 0 badge with count.

Active style:

- Border `#EF4444`.
- Gradient `#EF4444 → #DC2626`.
- Shadow red.
- Left border `#B91C1C`.
- Icon 🔔 white/brightened.

Inactive:

- White bg.
- Border `#FECACA`.
- Left border `#EF4444`.

### 31.3 Friends section

- FriendsSection embedded horizontally in feed.
- Owner true.
- Uses same contacts carousel pattern.

### 31.4 Composer

Typewriter texts exact:

```txt
Co dziś przeżyłeś?
Pokaż znajomym zdjęcie
Napisz co Cię cieszy
Podziel się chwilą
Co słychać u Ciebie?
Wrzucić film z dnia
Jakie masz plany?
Pochwal się czymś
Co Cię dziś zaskoczyło?
Napisz myśl dnia
```

Behavior:

- Changes every 3000ms.
- Typing speed 55ms/char.
- Cursor `|` with `composePulse`.

Composer layout:

- White bg.
- Border top/bottom.
- Avatar 44.
- Input pill height 40, bg slate100, border slate300, px4.

Quick actions:

| Label | Icon | Color | Bg |
|---|---|---|---|
| `Zdjęcie` | Camera | `#1D4ED8` | `#EFF6FF` |
| `Film` | Film | `#6D28D9` | `#F5F3FF` |
| `Myśl` | PenLine | `#15803D` | `#F0FDF4` |
| `Plik` | Paperclip | `#C2410C` | `#FFF7ED` |

### 31.5 Filter bar

Label:

```txt
Pokaż posty od:
```

Filters:

```txt
👥 Wszyscy
⭐ Bliscy
❤️ Rodzina bliska
💜 Rodzina dalsza
```

Active chip: colored border/bg/text white.
Inactive: border `#E2E8F0`, bg `#F8FAFC`, text `#475569`.

### 31.6 Feed post card

- Card bg white, radius 16, border var border, shadow `0 1px 4px rgba(0,0,0,0.04)`.
- Animation fadeInUp with delay `idx*50ms`.
- Author avatar 42.
- Author name 14px bold.
- Date 11px muted.
- More menu with Edit/Delete for owner.

Badges:

```txt
Prezentacja profilu
⭐ Ważne wydarzenie
Pasja: {emoji} {name}
```

V2: avoid active `Pasja` domain; map to interest/legacy label only if approved.

Content:

- Text 14px, line-height 1.65.
- Goal share badge:

```txt
🎯 Nowy cel
```

Actions:

- Reactions.
- Comment button: count or `Komentuj`.
- Share Send icon.
- Detail sheet.
- Delete confirm.

### 31.7 Empty state

Texts:

```txt
Feed jest pusty
Opublikuj coś lub zaproś znajomych
Dodaj post
Zaproś znajomych
```

---

## 32. Animation catalog for profile

Do not flatten animations. They are part of the profile feel.

| Name | Where | Behavior |
|---|---|---|
| `fadeInUp` | Cards/sections | opacity 0 + translateY(12px) → visible, 300ms. |
| `fadeIn` | Small overlays | opacity 0→1, 200ms. |
| `successPop` | Profession success | scale 0→1.2→1, 0.5s. |
| `px-divider-drop` | Header separator | vertical reveal/drop. |
| `px-divider-pulse` | Header separator | subtle pulse. |
| `px-bio-cursor` | Bio typewriter | cursor blink. |
| `ringpost-pulse` | RingPost bio action | pulse. |
| `ringpost-glow` | RingPost bio action | glow. |
| `ringpost-badge` | RingPost badge | badge pop. |
| `px-ken-burns` | Banner image | slow scale/parallax. |
| `px-shimmer` | Banner shimmer | diagonal shimmer. |
| `ph-shake` | Status empty pill | subtle shake. |
| `ph-sparkle` | Status empty sparkle | sparkle scale/rotate. |
| `ph-dot` | Status dot | pulsing dot. |
| `status-photo-glow` | Status photo set | violet glow. |
| `status-photo-idle` | Status photo empty | subtle scale. |
| `ptr-slideIn` | Portal cards | slide in with stagger. |
| `pxOnlinePulse` | Online indicator | pulse. |
| `pxNotifPop` | Notification badge | pop. |
| `qfp-pulse` | QuickFeed LIVE dot | red pulse. |
| `qfp-badge-in` | QuickFeed badge | badge entry. |
| `qfp-shimmer` | QuickFeed loading | skeleton shimmer. |
| `rel-glow-lr`, `rel-glow-rl` | Relationship | relationship glow direction. |
| `rel-avatar-pulse` | Relationship avatar | avatar pulse. |
| `px-dropdown-in` | Preview/availability dropdowns | dropdown entry. |
| `px-swipe-hint` | Profile mode gesture hint | swipe cue. |
| `px-hint-fade` | Gesture hint | fade. |
| `universalPublishSlideUp` | Publish sheet | slide from bottom. |
| `composePulse` | Composer cursor | pulse. |
| `publishBarEntry` | Composer bar | entry animation. |
| `milestoneCirclePulse` | Timeline date circles | pulse ring. |
| `confettiFall` | Profession final | falling confetti. |

---

## 33. Text/microcopy catalog — must not be lost

### 33.1 Core profile

```txt
O mnie
Dodaj opis...
Dodaj opis zawodowy...
6 wierszy × 24 znaków
Osobisty
Zawodowy
👆 Przesuń w lewo/prawo aby zmienić tryb
```

### 33.2 Top cards

```txt
Społeczności
Twoje grupy i dyskusje
Kanały
Subskrybuj kanały twórców
LIVE
Feed znajomych
Posty Twoich znajomych
0 odkryj!
{n} new
```

### 33.3 Contacts / feed preview

```txt
Kontakty
Szukaj...
Wszyscy
Bliscy
Rodzina bliska
Rodzina dalsza
Ostatnie posty
LIVE
Brak postów kontaktów
```

### 33.4 Preview

```txt
Podgląd profilu
Widok znajomego
Widok nieznajomego
Zamknij podgląd
Podgląd: widok znajomego
Znajomi widzą Twój feed, status i aktywności
Podgląd: widok nieznajomego
Nieznajomi widzą tylko publiczne informacje i zawody
```

### 33.5 Personal sections

```txt
Prezentacja profilu
{n}/12 postów
Brak postów
Dodaj do 12 postów ze zdjęciami i filmami.
Ten użytkownik nie dodał jeszcze żadnych postów.
Ważne wydarzenia
Oś czasu Twojego życia
Brak ważnych wydarzeń
Dodaj ważne momenty ze swojego życia na osi czasu.
Ten użytkownik nie dodał jeszcze żadnych wydarzeń.
Wydarzenie prywatne
```

### 33.6 Professional layer

```txt
Dodaj zawód
Uzupełnij profil zawodowy aby być znajdowanym
Dodaj
Główny
Dodatkowy
Moja praca:
Dodaj moją stronę →
Brak powiązanego miejsca pracy
Specjaliści
Widoczne
Ukryte
Nie dodano jeszcze żadnych specjalistów
Brak specjalistów do wyświetlenia
Klasyczny
Sieć
Moja praca
Moduł w budowie
Sekcja Miejsce pracy będzie dostępna wkrótce.
Co chcesz dodać?
Brak działań zawodowych
Dodaj projekt, usługę lub case study aby pokazać swoją pracę.
Ten użytkownik nie dodał jeszcze żadnych działań zawodowych.
Dodaj działania aby zobaczyć widok sieci
```

### 33.7 Status

```txt
Ustaw swój status...
Twój stan
Usuń status
podgląd
Zdjęcie statusowe (opcjonalnie)
Zdjęcie będzie widoczne zamiast awatara w pasku statusów
Wygasa razem ze statusem · max 5 MB
lub wpisz własny stan…
Dodaj opis (opcjonalnie)
Czas wygaśnięcia
Godziny
Dni
Widoczność
Publiczny
Tylko znajomi
Statusy znajomych
Wszyscy znajomi
Bliscy znajomi
Anuluj
Zapisz status
Zapisuję…
```

### 33.8 Profession editor

```txt
Wybór zawodu
Profil zawodowy
Krok 1 z 2 — wybierz zawód
Krok 2 z 2 — wybierz specjalizacje
Edycja
Moje zawody
Wyszukaj zawód
Wpisz nazwę zawodu...
Nie znaleziono zawodu
— lub wybierz kategorię —
Ładowanie kategorii...
Szukaj w kategorii...
Brak wyników
Brak zawodów w tej kategorii
Osiągnięto limit 3 zawodów. Usuń jeden, aby dodać nowy.
+ Nie znalazłem swojego zawodu — dodaj nowy
Zawód będzie widoczny na Twoim profilu z etykietą "⏳ Oczekuje na weryfikację"
Nazwa zawodu
Kategoria
Wybierz kategorię
Wyślij propozycję
Wysyłanie...
Wybierz specjalizacje
Szukaj specjalizacji...
Dodaj własną specjalizację
Np. Analiza danych klientów (max 3 słowa, 40 znaków)
Dalej →
Profil zawodowy gotowy!
Twój zawód został zapisany
Zakończ i przejdź do profilu →
```

---

## 34. Legacy conflicts / decisions before implementation

### 34.1 `Pasje` / `passions`

Legacy profile contains Passions components and text. V2 documentation removed `passions/pasje` as active product area.

**Recommended V2 handling:**

- Do not create `passions` domain.
- Do not create active `/passions` runtime.
- If visible profile area is needed, use `Zainteresowania` as UI-only/disabled slot or omit until approved.
- If copying copy exactly is required, mark explicit exception: `LEGACY_TEXT_ONLY_NO_DOMAIN`.

### 34.2 Base64/media

Legacy image flow uses base64/dataURL. V2 forbids runtime base64 upload.

**V2 handling:**

- Keep UI: tap image, action sheet, crop editor.
- Runtime later through `media` domain and presigned upload.
- Until then: `MEDIA_RUNTIME_NOT_CONNECTED`.

### 34.3 localStorage

Legacy quick feed uses localStorage for last open. V2 no fake backend/session.

**V2 handling:**

- Use component state in UI shell.
- Later store real read state through content/social read model if needed.

### 34.4 window.confirm

Legacy has some confirm/delete patterns. V2 forbids `window.confirm`.

**V2 handling:**

- Use custom confirmation modal as in `ProfileModals` / `FriendsFeedPostCard` pattern.

### 34.5 Typos/diacritics

Legacy visible typos/spelling:

- `Propoś o kontakt` likely should be `Poproś o kontakt`.
- `Co słychąć?` should be `Co słychać?`.
- Action menu lacks Polish characters: `Kadruj zdjecie`, `Zmien`, `Usun`.

**Decision:** user asked for literal profile, but these are likely accidental typos. Recommended: fix copy and document as `COPY_FIX`, not UI change.

---

## 35. V2 implementation plan — safe PR slicing

Nie robić jednego PR “profil”. To jest zbyt duże.

### Step P1 — Profile source fixtures + component skeleton

- No runtime.
- Add fixture data covering:
  - owner personal.
  - owner professional.
  - friend preview.
  - stranger preview.
  - no professions.
  - no posts.
  - no milestones.
  - with status/photo.
- Components only.
- Tests: render all states.

### Step P2 — Personal profile mobile shell

Scope:

- Header personal.
- Bio.
- Avatar/banner placeholder.
- Status pill UI disabled/local.
- Mode switcher shell.
- Top cards.
- Contacts carousel shell.
- QuickFeedPreview shell.

No professional section yet.

### Step P3 — Personal profile content mobile

Scope:

- Prezentacja profilu.
- ProfilePostCard.
- Timeline.
- MilestonePostCard.
- Empty states.
- Publish sheet UI only.

### Step P4 — Professional layer mobile

Scope:

- Professional header mode.
- Availability.
- ProfessionBlock.
- ProfessionSwitcher.
- Specialists.
- Classic/network tabs.
- Empty states.

### Step P5 — Profession editor shell

Scope:

- Profession editor steps.
- Categories/professions reference fixture.
- Specializations pending handling.
- Success/final screens.

### Step P6 — Desktop adaptation

Only after mobile approved.

- Apply desktop container.
- Sidebar compatibility.
- Desktop wider cards.
- No mobile regressions.

### Step P7 — Visual QA

- Mobile screenshots first.
- Compare against legacy mobile.
- Desktop screenshots second.
- Manual review.

---

## 36. Acceptance checklist for Opus/Cursor before any profile PR

### 36.1 Mobile-first checklist

- [ ] Profile opens on mobile width first.
- [ ] Header order is exact: name → avatar/bio row → status → switcher → banner.
- [ ] Avatar size and glow match.
- [ ] Bio is 6 lines x 24 chars behavior.
- [ ] Bio typewriter exists or is marked pending.
- [ ] Status pill empty and filled states exist.
- [ ] Status photo button exists.
- [ ] Mode switcher exists with `Osobisty / Zawodowy`.
- [ ] Swipe hint exists.
- [ ] Banner aspect/crop matches mobile.
- [ ] Social links match colors.
- [ ] Portal cards in exact order.
- [ ] Contacts tabs exist.
- [ ] Friend card sizes match.
- [ ] QuickFeedPreview exists.
- [ ] Preview friend/stranger menu exists.
- [ ] Personal posts empty and filled states exist.
- [ ] Timeline empty and filled states exist.
- [ ] Professional layer is a mode, not separate route/domain.
- [ ] ProfessionBlock and empty professional states exist.
- [ ] Specialists section exists.
- [ ] Professional classic/network tabs exist.
- [ ] Modals/sheets use custom UI, no browser confirm/alert.

### 36.2 Architecture checklist

- [ ] No legacy runtime import.
- [ ] No tRPC import.
- [ ] No Supabase direct component coupling.
- [ ] No base64 upload runtime.
- [ ] No localStorage fake profile/feed state.
- [ ] No public PII.
- [ ] No `professional-profile` separate domain.
- [ ] Identity owns profile/professions.
- [ ] Social owns contacts/relationships.
- [ ] Content owns posts/feed/milestones.
- [ ] Media owns avatar/banner/status photo assets.
- [ ] Status truth says `UI_SHELL_ONLY` until runtime exists.

### 36.3 Visual checklist

- [ ] Colors match legacy or approved landing-page polish.
- [ ] Animations preserved or listed as `ANIMATION_PENDING`.
- [ ] All visible copy accounted for.
- [ ] All empty states accounted for.
- [ ] All CTA states accounted for: route/modal/local state/disabled policy.
- [ ] Mobile screenshots captured before desktop review.
- [ ] Desktop changes do not alter mobile.

---

## 37. Second-pass sanity check done on this blueprint

After first extraction I rechecked the key legacy areas:

- `ProfileView.tsx` for section order.
- `ProfileHeader*` for mobile header details.
- `ProfileBioEditor.tsx` for 6-line bio/typewriter constraints.
- `ProfileHeaderStatusBar.tsx` and `StatusModal*` for status/status photo.
- `ProfileTopRow*` for three portal cards.
- `FriendsSection*` and `QuickFeedPreview.tsx` for contacts/feed preview.
- `ProfilePostsSection.tsx`, `ProfilePostCard.tsx`, `ProfileTimeline.tsx`, `MilestonePostCard.tsx` for personal content.
- `ProfessionBlock*`, `ProfileProfessionalSection.tsx`, `ProfileNetworkView.tsx`, `ActivityCard.tsx` for professional layer.
- `ProfessionEditor*` and step components for profession setup.
- `ImageEditOverlay*`, `ImageCropEditor*`, `ImageCropShared.tsx` for avatar/banner editing UX.
- `FriendsFeed*` for friend feed visual parity.
- `index.css` and `desktop-premium.css` for tokens, animations, mobile-first/desktop split.

This is still a **source-code-level blueprint**, not a pixel screenshot audit. Pixel validation requires running legacy and V2 side-by-side or screenshots.

---

## 38. Final implementation instruction for profile task

When giving Opus/Cursor the implementation command, include this as non-negotiable:

```txt
PRIORYTET PROFILU:
Mobile-first. Profil mobile jest głównym źródłem prawdy UX. Desktop jest adaptacją, nie odwrotnie. Nie upraszczaj mobile flow. Nie usuwaj sekcji, CTA, sheetów, empty states, mikrocopy ani układu, jeśli występowały w legacy mobile. Jeśli musisz coś zmienić, wypisz to jawnie jako VISUAL_DELTA do akceptacji.

PROFIL ZAWODOWY:
Profil zawodowy nie jest osobnym produktem ani osobną domeną. To druga warstwa profilu osobistego w identity. Nie twórz professional-profile domain.

LEGACY:
Stary kod jest source material only. Nie kopiuj runtime, hooks, tRPC, Supabase coupling, base64 upload, localStorage fake state, window.confirm/alert.
```


---

## 39. Literal component/source anchors for future agent

These names must be searched in `Starykod-4` before profile implementation:

```txt
ProfileView.tsx
ProfileHeader.tsx
ProfileHeaderAvatar.tsx
ProfileHeaderBannerSection.tsx
ProfileHeaderStatusBar.tsx
ProfileBioEditor.tsx
StatusModal.tsx
StatusPhotoModal.tsx
ProfileTopRow.tsx
FriendsSection.tsx
QuickFeedPreview.tsx
ProfilePostsSection.tsx
ProfilePostCard.tsx
ProfileTimeline.tsx
MilestonePostCard.tsx
ProfessionBlock.tsx
ProfileProfessionalSection.tsx
ProfileNetworkView.tsx
ProfileSpecialists.tsx
ProfessionEditor.tsx
ProfessionZawodStep.tsx
ProfessionSpecializationsStep.tsx
ImageEditOverlay.tsx
ImageEditActionMenu.tsx
ImageCropEditor.tsx
FriendsFeed.tsx
FriendsFeedCompose.tsx
FriendsFeedFilterBar.tsx
FriendsFeedPostCard.tsx
```
