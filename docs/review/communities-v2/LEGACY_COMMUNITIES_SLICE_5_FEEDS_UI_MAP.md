# LEGACY → V2 — Communities Slice 5: Trzy feedy + publikacja w dół (UI MAP)

Status: ACTIVE_EVIDENCE · clean-room. Mapa implementacyjna.
Źródło legacy: `Starykod-4-extracted/PlatformaX/`.

## 1. Legacy ekrany/komponenty → V2

| Legacy | Rola | V2 |
|---|---|---|
| `content/pages/CommunityDetailFeedTab.tsx` | feed społeczności: composer-trigger + publish sheet + lista postów + infinite scroll | `CommunityFeedsShell` + `CommunityFeedList` + `CommunityFeedComposer` |
| `communities/components/StructureScopeSelector.tsx` | wybór zasięgu publikacji: `here` / `selected` / `all` / `staff` (mini-drzewo z checkboxami) | `CommunityPublishScopeSelector` + `DescendantCommunityPicker` |
| `communities/components/FeedSettingsPanel.tsx` | ustawienia feedu: `feedPublishMode` (all/staff/disabled), `staffFeedEnabled`, media flags | `CommunityFeedSettings` (panel w zarządzaniu) + `CommunityFeedSettingsDTO` |
| `content/components/SharedPostCard.tsx`, `PostCardHeader.tsx` | karta posta (autor, treść, data, media) | `CommunityFeedItemCard` |
| `content/components/UniversalPublishSheet` | sheet publikacji z `extraHeader` na scope | `CommunityFeedComposer` (textarea + feed type + scope + quota) |

## 2. Legacy logika

- Legacy miał **jeden** feed społeczności + selektor zasięgu, gdzie „Feed zarządców" (`staff`) był **opcją zasięgu**, nie osobną zakładką.
- `feedPublishMode`: `all` (wszyscy członkowie) / `staff` (tylko kadra) / `disabled`.
- `staffFeedEnabled`: osobny feed kadry (widoczny tylko owner/admin/moderator).
- Zasięgi publikacji: `here` (tylko ta), `selected` (wybrane gałęzie, checkboxy mini-drzewa), `all` (cała hierarchia niżej), `staff` (feed zarządców).
- Scope selector pokazywany tylko dla `isStaff`.
- Mikrocopy: „Napisz coś do społeczności...", „Zasięg:", „Tylko tutaj", „Wybrane gałęzie", „Cała hierarchia", „Feed zarządców", „Widoczny tylko dla właściciela, administratorów i moderatorów", „Brak postów", „Załaduj więcej".

## 3. Różnice V2 (uzasadnione)

- **Relational feed** — NIE istnieje w legacy. Dodatek produktowy V2 (limit miesięczny, charakter osobisty). Oznaczone `PARTIAL_LEGACY_SOURCE` dla tej zakładki — UI clean-room, brak wzorca 1:1.
- **3 feedy jako TABS** (Główny/Relacyjny/Kadra) zamiast jednego feedu + scope `staff`. Lepsza czytelność i zgodność z celem produktowym Slice 5. `staff_only` to teraz osobny feed (tab), nie tylko zasięg.
- **Publikacja w dół** zachowuje legacy zasięgi (`here`→current_community_only, `selected`→selected_descendants, `all`→all_descendants) + dodaje `direct_children`. Propagacja dozwolona tylko dla `community_all` i `staff_only` (NIE relational).
- Soft/policy backendowy zamiast tRPC; quota relational liczona backendowo.

## 4. Co przenosimy 1:1

- Composer-trigger („Napisz coś do społeczności…") + sheet/inline composer.
- Scope selector z opcjami + mini-drzewo wyboru gałęzi (descendant picker).
- Karta posta: autor (public summary), treść, data, media refs.
- Empty/loading/error states, infinite scroll / „Załaduj więcej".
- Ustawienia feedu w zarządzaniu (kto publikuje, feed kadry on/off) + V2: relational on/off + limit, descendant publishing on/off + role.
- Mikrocopy PL, design tokens V2, mobile.

## 5. Co odrzucamy z legacy runtime

tRPC (`trpc.communities.*`, `trpc.content.*`), `sonner`, `useCommunityDetail` hooki, Supabase coupling, localStorage, base64 media, RingPost, events block, moduły, komentarze/reakcje (`PostReactions`, `CommentSection`), `any`/RULE_EXCEPTION.

## 6. Mapowanie domenowe V2

- `communities-v2`: członkostwo, role, struktura (Slice 4), **CommunityFeedSettings**, policy feedów/propagacji. NIE trzyma postów.
- `content-v2/community-feeds`: **community_posts + community_feed_items**, FeedType, dedupe, cursor, distribution, relational count. NIE trzyma ról/membershipów.
- `application-v2/use-cases/community-feeds`: orkiestracja publish/list/tabs/settings — łączy communities + content przez public-api/contracts.
- Frontend `features-v2/communities-v2/feeds/` + `community-feeds-mock-adapter` (MOCK_LOCAL_ONLY) + trasa `/communities/:slug/feed`.

## 7. Świadomie pominięte

komentarze, reakcje, chat, events, RingPost, pełne moduły, global feed, ranking, full Public Hub, full audit ZIP.
