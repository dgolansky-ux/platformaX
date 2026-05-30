# SLICE 20C — Dead Code & Replaced Tools

## 1. Stare narzędzia / duplikaty — wynik wyszukiwania

| Co szukałem | Wynik | Status |
|---|---|---|
| stare inline composery (wbudowane formy na feedach) | **0 hits** w aktualnych route'ach | USUNIĘTE / ZASTĄPIONE przez `ComposerTrigger` + `ComposerModal` |
| stare formularze publikacji (textarea bezpośrednio na stronie) | **0 hits** poza wnętrzami composerów | OK |
| stare karty postów (np. legacy `RingPost`) | **0 hits** w `client/src/features-v2/` | OK |
| stare karty społeczności/kanałów (np. `OldCommunityCard`) | **0 hits** | OK |
| stare mocki feedów (np. globalny feed) | **0 hits** | OK |
| stare localStorage save | **0 hits** (tylko komentarze "no localStorage" + testy) | OK |
| stare fake counters (hardcoded `likes: 42`) | **0 hits** w runtime (są tylko w mock seed data, ale to jest "mock data", nie fake counter) | OK |
| stare komponenty `RingPost` | **0 hits** | OK |
| stare community-copy miejsc pracy | **0 hits** — guard `check-removed-product-areas.mjs` PASS | OK |
| stare niedziałające route | brak — wszystkie 28 route'ów w `AppRouter.tsx` mają komponenty | OK |
| stare komponenty niepodpięte (orphans) | 44× w pustych scaffoldach (akceptowalne) | OK |

## 2. Stare obszary produktowe usunięte (sprawdzone przez guard)

`scripts/check-removed-product-areas.mjs` skanuje:
- `App.tsx`, `client/src/nav/**`, build artifacts
- pod kątem: "Usługi", legacy feed, community-copy workplaces, stare obszary z V1

**Wynik: PASS** — nic nie wróciło.

## 3. Mock adaptery — czy nie są duplikatami?

Każda domena frontu ma DOKŁADNIE jeden `*-mock-adapter.ts`:
- `features-v2/channels/channels-mock-adapter.ts`
- `features-v2/communities-v2/mock-adapter.ts`
- `features-v2/communities-v2/feeds/community-feeds-mock-adapter.ts`
- `features-v2/communities-v2/feeds/community-interactions-mock-adapter.ts`
- `features-v2/communities-v2/structure/structure-mock-adapter.ts`
- `features-v2/friend-feed/mock-adapter.ts`
- `features-v2/moderation/mock-adapter.ts`
- `features-v2/modules/mock-adapter.ts`
- `features-v2/notifications-v2/mock-adapter.ts`
- `features-v2/personal-profile/mock-adapter.ts`
- `features-v2/professional-profile/mock-adapter.ts`
- `features-v2/public-hub/mock-adapter.ts`
- `features-v2/publishing/mock-adapter.ts`
- `features-v2/social/contacts/mock-adapter.ts`
- `features-v2/media/media-adapter.ts` (nie nazwany "mock-adapter", ale jest mock)

**Brak duplikatów per-domena.** Każdy zawiera w nagłówku tag `MOCK_LOCAL_ONLY` z wyjaśnieniem.

## 4. Publishing — czy nowy zastąpił stary?

| Surface | Composer używany | Plik |
|---|---|---|
| `/friends-feed` | `FriendFeedComposer` (przez `ComposerModal`) | `friend-feed/FriendFeedPage.tsx:111-133` |
| `/communities/:slug/feed` | `CommunityFeedComposer` (przez `ComposerModal`) | `communities-v2/feeds/CommunityFeedsShell.tsx:152-174` |
| `/channels/:slug` | `ChannelPostComposer` | `channels/ChannelPostComposer.tsx` |
| `/profile/workplaces/:slug` | `WorkplaceMicroFeed` z composer | `professional-profile/WorkplaceMicroFeed.tsx` |
| `/admin/moderation` | `ReportDialog` (nie composer, ale action surface) | `moderation/ReportDialog.tsx` |

**Stary inline composer NIE jest używany w żadnym z powyższych.**

## 5. AppShell vs duplikacja route shells

**ZNALEZIONE**: `app-v2/navigation/AppShell.tsx` (untracked) — komponent który zamyka `DesktopSidebar + main + FloatingNav`. **NIE jest jeszcze użyty przez ŻADEN route**. Wszystkie route shells (10+) ręcznie składają sidebar + content + mobile nav.

| Route shell | Czy używa AppShell? |
|---|---|
| `FriendFeedPageRoute.tsx` | NO — ręcznie składa |
| `PersonalProfileRoute.tsx` | NO — ręcznie |
| `ManageDashboard.tsx` | NO — ręcznie (brak FloatingNav!) |
| `PersonalProfileManageRoute.tsx` | NO |
| `ProfessionalSectionRoute.tsx` | NO |
| `ContactsPage.tsx` | NO |
| `ChannelsPage.tsx` / `ChannelProfilePage.tsx` | NO |
| `CommunitiesPage.tsx` / `CommunityProfilePage.tsx` itd. | NO |
| `NotificationsPage.tsx` | NO |
| `ModerationAdminPage.tsx` | NO (brak sidebar w ogóle!) |

**Status**: `AppShell.tsx` to **DEAD_CODE w sensie nie-podpięte**. To NIE jest blokujące (nic nie jest złamane), ale to nieukończona refaktoryzacja. Priorytet: P2.

Brakuje także sidebar/nav w `ModerationAdminPage` — gdy moderator wejdzie na `/admin/moderation`, nie ma jak wyjść kliknięciem. P2.

## 6. Test fixtures z `as any` (intencjonalnie złe)

`tests/architecture/fixtures/bad-*.ts(x)` — celowe red-case'y do testowania guardów:
- `bad-unused-export.ts`
- `bad-cross-domain-internal.ts`
- `bad-client-to-server.tsx`
- `bad-circular-a.ts` + `bad-circular-b.ts`

**To NIE jest dead code** — to są ofiary guardów (tooling:redcase). Status: OK.

## 7. Komentarze TODO/FIXME/HACK/XXX

Grep `TODO|FIXME|HACK|XXX|placeholder|MOCK_|mock|fake` zwrócił 170 plików, ALE większość to:
- nazwy komponentów ("MockAdapter", "useMediaUpload — przyszłe Slice", "placeholder w pill")
- komentarze opisowe ("MOCK_LOCAL_ONLY adapter", "no fake save")

**Realnych TODO/FIXME w runtime kodzie**: kilka, nieblokujących. Przykład:
- `client/src/features-v2/communities-v2/CommunityProfileShell.tsx:9` — komentarz architektoniczny "uploads, StaffDrawer, MembersCarousel intentionally NOT carried over".

## 8. Knip (wykluczenia)

Nie uruchomiono w tym audycie (`knip:check` jest w `tooling:weekly`). Jeśli będzie >5 znaczących dead exports, dodać do P2.

## 9. Stare route'y / placeholdery

Sprawdzono `AppRouter.tsx`:
- Wszystkie 28 route'ów renderują REALNE komponenty.
- `Navigate to="/"` jako catch-all (`path="*"`) — OK.
- Brak `<>{...}</>` placeholderów.
- Brak `{() => <>TODO</>}` placeholderów.

## 10. Werdykt

- **Stare narzędzia: 0 znalezionych w runtime.** Wszystkie poprzednie compositions wyparte przez Slice 17 (publishing) + Slice 20B (top-tier UI).
- **Mock adapters: nie duplikaty, każdy serwuje jednoznaczną domenę.**
- **Dead code (nie-podpięte): tylko `AppShell.tsx` (untracked).** P2.
- **Brak fake save / fake counters / fake actions** — `mock-adapter.ts:111-117` egzekwuje real idempotency + state mutation.
- **`ModerationAdminPage` nie ma sidebar** — UX wpadka, P2.

**STATUS: PASS**.
