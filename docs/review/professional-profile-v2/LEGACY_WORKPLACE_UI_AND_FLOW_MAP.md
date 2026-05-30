# LEGACY WORKPLACE UI AND FLOW MAP — Slice 12

**Status:** ANALYSIS_ONLY / LEGACY_READ_ONLY
**Scope:** "Miejsce pracy" w warstwie zawodowej profilu osobistego PlatformaX.
**Goal:** ustalić co przenieść z legacy 1:1 (UX), a co odrzucić jako kopia społeczności / fake runtime.

## 0. Najważniejsza decyzja produktowa

Miejsce pracy NIE jest społecznością.

Legacy w niektórych iteracjach próbowało odtworzyć przy „miejscu pracy" pełen
inwentarz społeczności (członkowie, role, join-flow). To **odrzucamy w V2**.

Miejsce pracy w V2 to:

- część warstwy zawodowej profilu osobistego (`identity` domain),
- prezentuje pracę użytkownika,
- ma dane kontaktowe / stronę www / linki,
- ma własny mikro-feed aktualności (`content-v2/workplace-posts`),
- może publikować mini-zajawki na feedzie znajomych
  (`content-v2/workplace-teasers`, mini-karta, NIE pełny post).

## 1. Materiał legacy

Brak wydzielonego folderu `workplaces/` w `Starykod-4`. Wszystkie ślady miejsca
pracy żyły wewnątrz warstwy zawodowej profilu i były w trakcie wycofywania w
ostatnich iteracjach. Materiał referencyjny dla UI:

| Obszar | Plik / źródło | Notatka |
|---|---|---|
| Profile professional layer (legacy orchestrator) | `client/src/features/identity/components/ProfileProfessionalSection.tsx` | sekcja zawodowa, "Moja praca" anchor — odrzucamy runtime, zachowujemy UX |
| Activity grid / classic + network tabs | `client/src/features/identity/components/ProfileNetworkView.tsx`, `ActivityCard.tsx` | przeniesione już do V2 jako `ProfileProfessionalActivities.tsx` (placeholder) |
| Profession block | `client/src/features/identity/components/ProfessionBlock.tsx`, `ProfessionBlock.Switcher.tsx`, `ProfessionBlock.LinkedActivities.tsx` | warstwa zawodowa — referencja, nie kopia |
| Edytor zawodów / wieloetapowy kreator | `client/src/features/identity/pages/ProfessionEditor.tsx`, `ProfessionZawodStep.tsx`, `ProfessionSpecializationsStep.tsx`, `ProfessionProgressBar.tsx`, `ProfessionSuccessStep.tsx`, `ProfessionFinalStep.tsx` | wzorzec UX kreatora wieloetapowego (progress, kroki, success) — **przenosimy logikę kreatora** do `CreateWorkplaceWizard` |
| Profile blueprint mobile-first | `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST.md` §23 — Professional layer | bazowa specyfikacja UX dla warstwy zawodowej |
| Profile blueprint 1:1 audit | `docs/profile/PROFILE_BLUEPRINT_MOBILE_FIRST_UPDATED_1TO1_AUDIT.md` | mikrocopy, work types, sheet add-flow |
| Aktualny V2 placeholder | `client/src/app-v2/profile/sections/ProfileProfessionalActivities.tsx` | "Moduł w budowie" + disabled CTA — V2 słusznie nie udaje runtime; Slice 12 wymienia placeholder na realny shell |
| Reference data zawodów | `server/domains-v2/identity/professions/*` | używamy do wyboru kategorii / zawodu w kreatorze (DATA_PENDING) |

## 2. Kreator miejsca pracy — przeniesione UX

Wzorzec wieloetapowy z legacy `ProfessionEditor` (progress bar, sukces step):

| Krok | Pola | Walidacja | Mikrocopy (legacy spirit) |
|---|---|---|---|
| 1. Podstawy | `name`, `slug`, `headline`, `description` | nazwa wymagana, slug unique per owner, headline ≤ 140, description ≤ 2000 | "Jak nazywa się Twoje miejsce pracy?" |
| 2. Zawód / obszar | `professionCategorySlug`, `professionSlug`, `specializationSlugs[]` | category istnieje, profession w category, specializations dopuszczone (DATA_PENDING — pokazujemy truthful state) | "Wybierz obszar zawodowy" |
| 3. Kontakt i linki | `websiteUrl`, `contactEmail`, `contactPhone`, `contactVisibility` | URL bezpieczny (no javascript:/data:/file:/vbscript:), email/telefon opcjonalne; widoczność: `owner_only` / `friends` / `approved_contact_fields` / `public` | "Pokaż jak się z Tobą skontaktować" |
| 4. Prezentacja | `logoRef`, `bannerRef`, `locationText`, `onlineAvailable` | media refs walidowane (no data:/base64), locationText ≤ 200 | "Pokaż jak wyglądasz w pracy" |
| 5. Podsumowanie | preview + `visibility` (`public`/`friends_only`/`private`) | wszystko z poprzednich kroków | "Sprawdź i utwórz" |

Stany: progress (1/5…5/5), error inline, success → redirect do strony miejsca
pracy.

## 3. Strona miejsca pracy — przeniesione UX

| Sekcja | Co | Legacy źródło UX |
|---|---|---|
| Hero | nazwa, headline, baner, logo, owner public summary, kategoria/zawód | `ProfileHeader`, `ProfessionBlock` |
| Kontakt | website link, email/telefon (zgodnie z policy), CTA „Skontaktuj się" | `ProfileContacts`, `RelationshipStatus` |
| Opis | description, specjalizacje, linki | `ProfessionBlock.LinkedActivities` |
| Mikro-feed | wpisy z `workplace-posts` (composer dla ownera, lista wpisów, empty state) | `QuickFeedPreview`, `ProfilePostsSection` |
| Owner actions | edytuj / dodaj wpis / archiwizuj / widoczność | `ProfileModals`, `ImageEditActionMenu` |

## 4. Mini-zajawka na feedzie znajomych — przeniesione UX

Inspiracja z `QuickFeedPreview.tsx` + `FriendActivityGridTiles.tsx` —
**mała karta**, nie pełny post:

- owner public summary,
- nazwa miejsca pracy,
- preview text (1–2 zdania),
- miniaturka media (opcjonalnie),
- data,
- chip „Z miejsca pracy",
- CTA „Zobacz wpis" → pełny post na stronie miejsca pracy.

## 5. Co ODRZUCAMY z legacy

| Element legacy | Powód odrzucenia |
|---|---|
| członkowie miejsca pracy | miejsce pracy NIE jest społecznością |
| role admin/moderator/member dla workplace | jw. — to profil osobisty |
| join/request/invite dla workplace | jw. |
| podspołeczności / struktura grupowa | jw. |
| tRPC hooks w komponentach | zakaz V2 |
| Supabase coupling z UI | zakaz V2 (transport via use-case → adapter) |
| base64/dataURL upload | zakaz BRAMKI |
| localStorage jako backend / fake save | zakaz V2 |
| `window.confirm` / `window.alert` | zakaz V2 |
| PublicProfile leak (phone/email w public DTO) | zakaz V2 |
| osobna domena `professional-profile` | warstwa identity, nie nowa domena |
| pełny post w feedzie znajomych z wpisu miejsca pracy | dublowanie — feed pokazuje tylko mini-zajawkę z linkiem |

## 6. Mapping legacy → V2 docelowy

| Legacy file/UX | V2 location |
|---|---|
| ProfessionEditor wizard pattern | `client/src/features-v2/professional-profile/CreateWorkplaceWizard.tsx` |
| ProfileProfessionalSection "Moja praca" | `client/src/features-v2/professional-profile/ProfileProfessionalLayer.tsx` |
| ProfilePostsSection / QuickFeedPreview | `client/src/features-v2/professional-profile/WorkplaceMicroFeed.tsx` |
| FriendsFeedPostCard (variant) | `client/src/features-v2/friend-feed/FriendFeedWorkplaceTeaserCard.tsx` |
| Backend workplace entity | `server/domains-v2/identity/workplaces/*` |
| Backend workplace posts | `server/domains-v2/content-v2/workplace-posts/*` |
| Backend friend feed teaser read-model | `server/domains-v2/content-v2/workplace-teasers/*` |
| Cross-domain orchestration | `server/application-v2/use-cases/workplace-feed/*` |

## 7. Statusy startowe Slice 12

- `identity/workplaces` — **BACKEND_PARTIAL** (in-memory store, public-api, tests; DB adapter pending)
- `content-v2/workplace-posts` — **BACKEND_PARTIAL** (in-memory; tests)
- `content-v2/workplace-teasers` — **BACKEND_PARTIAL** (in-memory read-model; dedupe per source_post_id)
- `application-v2/use-cases/workplace-feed` — **BACKEND_PARTIAL** (orchestration; tests)
- `client/src/features-v2/professional-profile` — **UI_SHELL_ONLY + MOCK_LOCAL_ONLY** (mock adapter)
- `client/src/features-v2/friend-feed` (teaser card) — **UI_SHELL_ONLY + MOCK_LOCAL_ONLY**

NIE wolno oznaczyć tej warstwy jako IMPLEMENTED / BACKEND_DONE / VISUAL_DONE
bez DB persistence + evidence.
