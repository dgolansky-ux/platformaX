# Slice 15 — Profil osobisty owner/viewer + publiczny podgląd profilu

Status: `READY_FOR_PRODUCT_REVIEW`
Branch: `feat/contacts-v2-clean-room-slice`
Date: 2026-05-30

## 1. Co wdrożono

- **Jeden unified profile route** `/profile/:username` renderowany przez ten
  sam komponent `PersonalProfilePage` dla każdej relacji viewera (owner,
  friend, stranger, pending_friend_request_sent, pending_friend_request_received,
  contact_approved, unauthenticated). Stara trasa `/profile` (owner edit
  dashboard) zostaje nietknięta i jest CTA "Zarządzaj profilem" w hero.
- **Shared contract** `shared/contracts/personal-profile-view.ts` z
  `PersonalProfileViewDTO`, `ProfileViewerStateDTO`, `ProfileOwnerActionsDTO`,
  `ProfileRelationActionsDTO`, `ProfileContactPanelDTO` + sub-DTOs sekcyjnych.
  Te same typy implementują serwer (use-case) i klient (mock adapter).
- **Application-v2 use-case** `personal-profile-view` orkiestrujący
  identity + social + contacts + (opcjonalne) workplaces/publicHub/channels
  resolvery. Polityka widoczności jest jednym czystym modułem (`policy.ts`).
- **Akcje relacyjne** `sendFriendRequestFromProfile`,
  `acceptFriendRequestFromProfile`, `requestProfileContactAccess` jako cienkie
  wrappery nad `social.sendFriendRequest`, `social.respondToFriendRequest`
  i `contact-access.sendContactRequest` — bez duplikacji logiki.
- **Frontend feature** `features-v2/personal-profile/` (UI_SHELL_ONLY +
  MOCK_LOCAL_ONLY): hero + viewer-actions + contact panel + workplaces +
  Public Hub + channels entry + friend-feed preview. Adapter MOCK_LOCAL_ONLY
  z czterema seedowanymi profilami (viewer, ada, kuba, private) pokrywa każdy
  scenariusz viewera.

## 2. Dlaczego nie tworzono osobnego public profile

Brief jasno zabraniał: "Nie buduj osobnego drugiego profilu publicznego. Nie
twórz osobnej kopii profilu dla viewerów." Wdrożenie szanuje tę zasadę:
- jeden komponent (`PersonalProfilePage`),
- jeden DTO (`PersonalProfileViewDTO`),
- jeden use-case (`getPersonalProfileView`),
- jeden mock-adapter.

Trasa `/profile` (legacy owner edit dashboard) jest zachowana z powodu
istniejących bogatych formularzy edycji avatara/banera/bio. Hero wskazuje
"Zarządzaj profilem" jako link do tej trasy. To NIE jest osobny "viewer
profile" — to dashboard edycji ownera, do którego nikt inny nie ma dostępu.

## 3. Owner mode

- subtelne pille edycji: "Edytuj baner", "Edytuj awatar", "Edytuj bio".
- CTA: "Zarządzaj profilem" (linkuje do `/profile`), "Dodaj miejsce pracy",
  "Zarządzaj modułami".
- contact panel pokazuje pełny zestaw własnych pól.
- friend feed preview używa `PersonalProfileFriendFeedPreview` z
  `features-v2/friend-feed/public-api`.
- channels entry: "Twoje kanały".

## 4. Viewer mode

- bez przycisków edycji.
- `ProfileViewerActions` renderuje:
  - "Dodaj do znajomych" jeśli relation = stranger,
  - "Zaproszenie wysłane" gdy pending_sent,
  - "Zaakceptuj zaproszenie" gdy pending_received,
  - "Znajomi" gdy friend,
  - "Poproś o kontakt" jeśli policy pozwala,
  - "Kontakt zatwierdzony" gdy contact_approved.
- contact panel: tylko pola, które polityka kontaktów (identity contact-access)
  zwolniła; "Poproś o kontakt" jeśli viewer ma jeszcze taką możliwość.
- workplaces preview: filtruje private/friends_only zgodnie z relacją.
- Public Hub: tylko enabled modules, manage CTA tylko dla ownera.
- channels entry: navigates do `/channels`; pokazuje TRUTHFUL count lub
  null (transport partial) — nigdy fake.
- friend feed preview: jeśli policy nie pozwala, renderowany "Wpisy
  znajomych" restricted state; jeśli pozwala, embedded
  `PersonalProfileFriendFeedPreview` z `features-v2/friend-feed`.

## 5. Viewer state

`ProfileViewerStateDTO` zawiera: `relation`, `canEditProfile`,
`canViewPublicProfile`, `canViewProfessionalLayer`, `canViewWorkplaces`,
`canViewPublicHub`, `canViewModules`, `canViewFriendFeedPreview`,
`canViewContactFields`, `canSendFriendRequest`, `canAcceptFriendRequest`,
`canRequestContactAccess`, `canOpenChannels`, `canOpenWorkplaces`. Wszystkie
flagi są obliczane przez czystą politykę (`policy.ts`) — UI nigdy nie liczy
ich sam.

## 6. Contact / privacy

- email/phone domyślnie ukryte.
- friend widzi pole tylko jeśli owner ustawił `friends: true` w permissions.
- contact_approved widzi tylko approved fields (double-gate: request musi
  być accepted ORAZ `approved: true` per field).
- stranger / unauthenticated: brak PII.
- contact panel DTO carries policy-gated PII only — tests sprawdzają, że
  email/phone nie wycieka stranger viewerowi.

## 7. Relation actions

- "Dodaj do znajomych" — owner nigdy go nie widzi (`canSendFriendRequest = false`).
- pending_sent pokazuje "Zaproszenie wysłane" (info, nie CTA).
- pending_received pokazuje "Zaakceptuj zaproszenie".
- friend pokazuje status, contact_approved pokazuje "Kontakt zatwierdzony".
- contact request jest osobny od friend request (różne polityki/lifecycle).

## 8. Public Hub profilu

- `ProfilePublicHubSection` renderuje moduły z `publicHub.modules`.
- viewer widzi tylko enabled modules (lub wszystko, jeśli to owner z manage).
- owner widzi CTA "Zarządzaj modułami".
- empty state: "Ten profil nie ma jeszcze publicznych modułów."

## 9. Warstwa zawodowa + miejsca pracy

- `ProfileWorkplacesSection` renderuje karty workplace'ów.
- owner widzi "Dodaj miejsce pracy" (linkuje do `/manage/profile/workplaces/new`).
- viewer: workplace o widoczności `private` jest ukryty; `friends_only`
  widoczny tylko dla friend / contact_approved.
- Test "stranger nie widzi private workplace 'Sekret'" pokrywa ten case.

## 10. Friend feed preview

- `ProfileFriendFeedPreviewSection` wybiera między:
  - embedded `PersonalProfileFriendFeedPreview` (gdy policy `canView`),
  - restricted state ("Aby zobaczyć wpisy, musisz być w gronie znajomych.")
- Owner widzi własny preview, friend widzi friends_only, stranger restricted,
  anonymous: zaloguj się.

## 11. Wejście do kanałów

- `ProfileChannelsEntry` renderuje sekcję z CTA "Otwórz kanały →".
- routes do `/channels` (target route z `channelsEntry.targetRoute`).
- count: jeśli mock seed daje liczbę — pokazuje; jeśli backend resolver nie
  jest podpięty, pokazuje "Liczba kanałów dla profilu pojawi się, gdy
  transport zostanie podpięty." — truthful, nie fake.

## 12. Statusy

- `personal-profile-view` use-case: **BACKEND_PARTIAL** — workplaces /
  publicHub / channels resolvery są opcjonalne; gdy nie wpięte, zwraca
  truthful empty / null counts.
- `features-v2/personal-profile`: **UI_SHELL_ONLY + MOCK_LOCAL_ONLY**.
- `shared/contracts/personal-profile-view*`: **FOUNDATION_READY** — typy
  ustabilizowane dla Slice 15; mogą rosnąć przy kolejnych iteracjach.

## 13. Test evidence

- 26 nowych testów (10 backend, 16 frontend), wszystkie zielone:
  - `server/application-v2/use-cases/personal-profile-view/__tests__/service.test.ts`
    — owner / stranger / friend / contact_approved / pending_sent / unauth /
    not_found / private restricted / PII safety / action wrappers.
  - `client/src/features-v2/personal-profile/__tests__/PersonalProfilePage.test.tsx`
    — owner edit pills, friend visibility, stranger CTA, send→sent flip,
    private restricted, not-found, anonymous, workplaces filtering,
    add-workplace ownership, Public Hub manage CTA, channels real count,
    friend-feed gating, PII absence.
- Pełny pakiet: `pnpm test` 1165 / 1165 PASS.

## 14. Guard evidence

| Gate | Result |
| --- | --- |
| `pnpm check` (TypeScript) | PASS |
| `pnpm lint` | PASS |
| `pnpm test` (1165) | PASS |
| `pnpm build` | PASS |
| `pnpm rules:check` (43 guards) | PASS |
| `pnpm arch:check:v2` (9 guards) | PASS |
| `pnpm guards:all-local` | PASS |

## 15. P0 / P1 / P2

- P0: brak.
- P1: brak.
- P2:
  - durable HTTP transport dla `getPersonalProfileView` + thin HTTP wrapper
    do `sendFriendRequest` / `acceptFriendRequest` / `sendContactRequest`.
  - resolvery `workplaces` / `publicHub` / `channels` w application bootstrap
    (Postgres adapter dla workplaces; reuse istniejących `public-hub` +
    `channels` services).
  - resolver media URL dla avatara/banera (dziś summary zwraca null URL —
    frontend mock seeduje URL lokalnie).
  - migracja do unified profile we wszystkich deep linkach (post author,
    community member, contact list) tak, żeby kliknięcie autora prowadziło
    do `/profile/:username` zamiast wewnętrznego shortcuta.

## 16. Następny rekomendowany krok

Podpiąć resolver `workplaces` do application bootstrap: cienka warstwa
nad `identity/workplaces` + `content-v2/workplaces` zwracająca już
publicznie-bezpieczne karty. Dzięki temu profil natychmiast pokaże realne
miejsca pracy (zamiast fixture seedów), a slice 12 (Workplaces) zyska
naturalną integrację z unified profile.
