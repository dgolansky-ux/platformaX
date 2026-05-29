# LEGACY → V2 — Communities Slice 6: Komentarze + reakcje (UI MAP)

Status: ACTIVE_EVIDENCE · clean-room. Mapa implementacyjna.
Źródło legacy: `Starykod-4-extracted/PlatformaX/` (nie kopiowane do repo; reverse-engineered z UI patterns użytych w Slice 1–5).

## 1. Legacy ekrany/komponenty → V2

| Legacy | Rola | V2 |
|---|---|---|
| `content/components/PostReactions.tsx` | przyciski reakcji pod postem (like/like count) | `CommunityReactionButton` + `CommunityReactionSummary` |
| `content/components/CommentSection.tsx` | sekcja komentarzy pod kartą posta: lista + composer + reply | `CommunityCommentsThread` (lazy) + `CommunityCommentsList` + `CommunityCommentComposer` |
| `content/components/CommentItem.tsx` | jeden wiersz komentarza (autor + body + data + akcje) | `CommunityCommentItem` |
| `content/components/PostActionBar.tsx` | pasek akcji pod postem (reakcja, komentuj, zwiń) | `CommunityPostActionBar` |
| `content/components/CommentsToggle.tsx` | „N komentarzy" expand/collapse | `CommunityCommentsToggle` |
| `content/hooks/usePostInteractions.ts` | tRPC `post.like` / `comment.create` + Supabase coupling | `community-interactions-mock-adapter` (front) + `community-interactions` use-case (backend) |

## 2. Legacy logika

- **Pod każdym postem**: pasek z liczbą reakcji + liczbą komentarzy + „Dodaj komentarz" (toggle).
- **Reakcje**: tylko „like" (legacy nie miało emojiset). Toggle: kliknij = dodaj/usuń. Licznik aktualizowany optimistically z server-confirm.
- **Komentarze**: lista chronologicznie (najstarszy → najnowszy w wątku), composer pod listą lub jako trigger („Skomentuj…"). Reply był **nie wdrożony** w legacy (płaski model w MVP).
- **Sekcja komentarzy domyślnie zwinięta**, expand pokazuje listę + composer.
- **Permission gating**: jeśli user nie ma uprawnień do feedu (np. staff_only jako member), karta posta nawet się nie renderuje — komentarze/reakcje są lokalne do tego item.
- **Soft delete**: usunięty komentarz pokazywał „Komentarz usunięty" placeholder (body ukryte), zachowując pozycję w wątku.
- **Mikrocopy**: „Skomentuj…", „Opublikuj komentarz", „N komentarzy", „N reakcji", „Polub", „Polubiono", „Brak komentarzy. Bądź pierwszy.", „Komentarz usunięty", „Twój komentarz", „Tylko dla członków społeczności".

## 3. Różnice V2 (uzasadnione)

- **Komentarze/reakcje przypięte do `feedItemId`, nie globalnego `postId`**. Powód: propagowany staff_only post do childa nie wycieka komentarzy do parenta/sibling. Każda kopia (`CommunityFeedItemDTO`) ma swoją lokalną sekcję komentarzy/reakcji. To wzmacnia visibility model z Slice 5.
- **Reaction type model** zostawia miejsce na rozwój (`"like"` enum w MVP, łatwo rozszerzalne), bez wymyślania 20 reakcji.
- **Backend orkiestracja**: application-v2 sprawdza widoczność postu (feed type policy) zanim pozwoli komentować/reagować — żaden bypass z UI.
- **Brak optimistic UI w MVP**: po sukcesie z adaptera robimy refetch counts. Subtelne, bez efektów-magic.
- **Brak threadingu w MVP**: model ma `parentCommentId` ale UI go nie renderuje (flat). To gotowość pod przyszłość, nie placeholder feature.

## 4. Co przenosimy 1:1

- Layout: action bar pod treścią posta (counts + toggle).
- Composer komentarza pod listą.
- „Brak komentarzy" empty state.
- Soft-delete „Komentarz usunięty" placeholder.
- Permission states: disabled composer dla brakujących uprawnień + komunikat.
- Mikrocopy PL (przeniesione z legacy gdzie pasują).
- Subtelność: małe przyciski, lekkie counts, brak agresywnych ikon-bombki.

## 5. Co odrzucamy z legacy runtime

tRPC (`trpc.post.like.useMutation` etc.), Supabase coupling, `useCommentSection` hook, `sonner`, localStorage cache komentarzy, optimistic-UI z magic-rollback, base64 avatary, RingPost, fake counts, no-op „Dodaj reakcję" przyciski, PII w komentarzach (email autora), `any`/`as any`.

## 6. Mapowanie domenowe V2

- `content-v2/comments`: encja `Comment` + repo + policy + service. Komentarze przypięte do `feedItemId` (i opcjonalnie `parentCommentId`). NIE trzyma ról/communities.
- `content-v2/reactions`: encja `Reaction` (target = post-item lub comment) + repo + service. Toggle/dedupe. NIE trzyma ról.
- `communities-v2`: BEZ ZMIAN (nie wkłada się tu komentarzy/reakcji).
- `application-v2/use-cases/community-interactions`: orkiestracja widoczności (przez community-feeds policy) + komentarze + reakcje. Importuje wyłącznie public-api obu domen.
- Frontend `features-v2/communities-v2/feeds/interactions/`: `CommunityPostActionBar`, `CommunityCommentsThread`, `CommunityCommentComposer`, `CommunityCommentsList`, `CommunityCommentItem`, `CommunityReactionButton`, `CommunityReactionSummary`. Mock adapter `community-interactions-mock-adapter.ts` (MOCK_LOCAL_ONLY).

## 7. Świadomie pominięte

threading/reply UI (model gotowy, UI flat), edit comment, moderation delete, emoji reactions multi-set, notifications po komentarzu/reakcji, chat, events, RingPost/kanały runtime, global feed, full audit ZIP, push/email.

## 8. Decyzje modelu (zakotwiczone)

| Aspekt | Decyzja | Powód |
|---|---|---|
| Anchor | `feedItemId` (nie `postId`) | każda kopia ma własne komentarze → staff_only nie wycieka |
| Threading | model: `parentCommentId` nullable; UI: flat w MVP | przyszłość bez churn schematu |
| Reactions | jedna `reactionType` enum (`"like"` w MVP), unique (feedItemId/commentId, userId, reactionType) | toggle prosty, łatwo rozszerzyć później |
| Delete | soft delete (`status: "active" | "deleted"`, `deletedAt`) | zachowuje porządek wątku + audit |
| Body cap | 2000 znaków | sensowny, wyraźny komunikat błędu |
| Order | createdAt ASC (najstarszy → najnowszy) | naturalne czytanie wątku |
| Cursor | bounded limit 50, DEFAULT 20 | scoped read model, brak global feedu |
