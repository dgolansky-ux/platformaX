# Communities Slice 6 — Komentarze + reakcje (REPORT)

Status: READY_FOR_PRODUCT_REVIEW · clean-room V2 · MOCK_LOCAL_ONLY (frontend), BACKEND_PARTIAL / READ_MODEL_SKELETON (domena).
Branch: `feat/contacts-v2-clean-room-slice` · SHA bazowy przed slice: `d3e4a2b`.
Data: 2026-05-29.

## 1. Przeanalizowane pliki legacy

Brak `_legacy/` w repo (clean-room). Mapa implementacyjna oparta o:
- wzorzec `content/components/CommentSection.tsx` + `PostReactions.tsx` + `PostActionBar.tsx` z legacy `Starykod-4-extracted/PlatformaX/`,
- konwencje UI wprowadzone w Slice 1–5 (Feeds.module.css, layout kart, mikrocopy PL).

Mapa: [LEGACY_COMMUNITIES_SLICE_6_COMMENTS_REACTIONS_UI_MAP.md](./LEGACY_COMMUNITIES_SLICE_6_COMMENTS_REACTIONS_UI_MAP.md).

## 2. Co przeniesiono 1:1 wizualnie

Action bar pod treścią posta (Polub + N komentarzy/Skomentuj), lazy expand komentarzy, composer pod listą („Skomentuj…" + „Opublikuj"), empty state „Brak komentarzy. Bądź pierwszy.", placeholder „Komentarz usunięty" po soft-delete, subtelność: małe przyciski, lekkie counts, brak agresywnych emoji-bombki. Mikrocopy PL, design tokens V2, mobile usable.

## 3. Co odrzucono z legacy runtime

tRPC (`trpc.post.like.useMutation`, `trpc.comment.create.useMutation`), Supabase coupling, `useCommentSection`/`usePostInteractions` hooki, `sonner` toasty, localStorage cache komentarzy, optimistic-UI z magic-rollback, base64 avatary, RingPost, no-op „Dodaj reakcję" przyciski, PII w komentarzach, `any`/`as any`.

## 4. Model komentarzy

`content-v2/comments` posiada encję `Comment`:
- `id`, `feedItemId` (kotwica — NIE postId), `parentCommentId` nullable, `authorUserId`, `body`, `status: "active" | "deleted"`, `createdAt`, `updatedAt`, `deletedAt`.
- Body wymagane, max `COMMENT_BODY_MAX = 2000` znaków.
- Soft delete: status zmienia się na `"deleted"`, mapper zwraca pusty body (`DELETED_BODY_PLACEHOLDER`) — UI renderuje placeholder „Komentarz usunięty".
- `parentCommentId` musi należeć do tego samego `feedItemId` i być aktywny (model gotowy pod threading; UI płaski w MVP).
- Author-only edit/delete (policy `isAuthor`). Brak moderation delete w MVP.
- Lista: cursor + `DEFAULT_LIMIT=20`, `MAX_LIMIT=50`, kolejność `createdAt ASC` + stable id tie-breaker.
- Batch counts: `countActiveBatch(feedItemIds)` zwraca `Map<feedItemId, number>` — bez N+1.

## 5. Model reakcji

`content-v2/reactions` posiada encję `Reaction`:
- `id`, `targetType: "post" | "comment"`, `targetId`, `userId`, `reactionType: "like"` (MVP enum), `createdAt`.
- Unique `uniqueKey = ${targetType}|${targetId}|${userId}|${reactionType}` w repo: powtórzony `setReaction` jest idempotentny (`created=false`, brak duplikatów).
- `toggleReaction`: jeden call flipuje stan; `setReaction`/`removeReaction` dla deterministycznych mutacji.
- Batch:
  - `getReactionSummaries({ targets })` → counts per target (zero-wypełnione typy).
  - `getViewerReactionState({ userId, targets })` → tablica aktywnych typów per target.

## 6. Liczniki / batch counts

`getCommunityPostInteractionSummary(actorUserId, feedItemIds)` zwraca per item: `commentCount` (z `comments.countActiveBatch`), `reactions` (z `reactions.getReactionSummaries`), `viewer` (z `reactions.getViewerReactionState`). Items, których aktor nie widzi (np. staff_only dla membera), są wycinane z wyniku — **żadnego wycieku liczników**.

## 7. Visibility per feed type

`application-v2/use-cases/community-interactions` orkiestruje wszystkie akcje. Przed każdym mutate/list robi:
1. `content.getFeedItem(feedItemId)` → community + feedType.
2. `communities.getViewerRole(communityId, actorUserId)` → rola lub null.
3. `feedSettings.getCommunityFeedSettings(communityId)` → settings.
4. `canViewFeed(role, settings, feedType)`:
   - `community_all` → `canViewCommunityAll` (members),
   - `relational` → `canViewRelational` (members),
   - `staff_only` → `canViewStaffOnly` (founder/admin/moderator).
5. Komentowanie/reakcje wymagają `role !== null` + widoczność. Stranger zawsze `FORBIDDEN`.

Member nie zobaczy komentarzy ani liczników staff_only feed item: `listCommunityPostComments` zwraca `FORBIDDEN`, summary batch wyklucza ten item.

## 8. Interakcje na postach dystrybuowanych w dół

Komentarze i reakcje są przypięte do KONKRETNEGO `feedItemId` (nie do globalnego `postId`). Skutki:
- Post `community_all` propagowany do childa ma własną sekcję komentarzy/reakcji w childzie — niezależną od parenta.
- Staff_only post propagowany do childa zachowuje feedType w childzie (Slice 5 dedupe), więc komentarze tam też są staff_only — brak wycieku do parent/sibling/cross-community.
- Test `comments on a distributed post stay local to the target community` + `reactions on a distributed post stay local` weryfikują niezależność liczników i listy.

## 9. UI

- `CommunityPostActionBar` (w `feeds/interactions/CommunityPostInteractions.tsx`) — pasek pod kartą: `CommunityReactionButton` (Polub/Polubiono · N) + `CommunityCommentsToggle` (N komentarzy/Skomentuj/Zwiń komentarze).
- `CommunityCommentsList` — lista komentarzy (empty/loading/error/forbidden states, soft-delete placeholder).
- `CommunityCommentItem` — wiersz z autorem (public summary), datą, ciałem; reaction toggle (♡/♥ count) + Usuń dla autora.
- `CommunityCommentComposer` — composer ze stanem busy, błędem walidacji i komunikatem permission gating.
- Stylistyka: małe action chips, subtelne kolory (primary-soft), spacing 12–16px, mobile usable, brak agresywnych ikon. Liczniki tylko gdy `> 0`.
- Wszystkie counts pochodzą z mock-adaptera — zero fake counters.

## 10. Transport

`client/src/features-v2/communities-v2/feeds/community-interactions-mock-adapter.ts` (MOCK_LOCAL_ONLY): in-memory store komentarzy/reakcji + rejestr `feedItemId → community/feedType/viewerRole`. Stosuje TE SAME reguły co backend (view gating, author-only edit/delete, soft-delete strip, unique reactions). Każda mutacja realnie zmienia store; refetch summary po sukcesie — bez optimistic-UI.

## 11. Architektura — gdzie co siedzi

| Domena | Co ma | Czego NIE ma |
|---|---|---|
| `content-v2/comments` | encja Comment + repo + policy + service | role/membership, sprawdzanie communities |
| `content-v2/reactions` | encja Reaction + repo + service | role/membership, sprawdzanie communities |
| `communities-v2` | role, członkostwo, settings, struktura | komentarze, reakcje |
| `application-v2/community-interactions` | orkiestracja widoczności + delegacja do content | własne dane, bypass policy |

`application-v2` importuje tylko `public-api` obu domen. Test architektoniczny `orchestrator does not import internals of either domain` weryfikuje regex.

## 12. DTO / contracts

- Backend: `CommentDTO`, `CommentListDTO`, `ReactionDTO`, `ReactionSummaryDTO`, `ViewerReactionStateDTO`, `CommunityPostInteractionSummaryDTO`, `CommunityCommentInteractionSummaryDTO`, `CreateCommunityPostCommentCommand`, `ReactToCommunityPostCommand`, `ReactToCommunityCommentCommand`.
- Frontend: `shared/contracts/community-interactions.ts` — `CommunityCommentDTO` (+ `viewerIsAuthor`), `CommunityReactionSummaryDTO` (+ `viewerActive`), `CommunityPostInteractionDTO`, `CommunityCommentInteractionDTO`, inputy `Create/Update/Delete/ReactToPost/ReactToComment`.
- Wszystko z `userId` reference only — **zero PII** (test `DTO no PII` weryfikuje brak `email/phone/@`).
- Soft-deleted body strippped → leak hidden po stronie mappera.

## 13. Persistence / migrations

Brak `db push`. Schema draft w komentarzach domeny:
- `content_comments(id, feed_item_id, parent_comment_id, author_user_id, body, status, created_at, updated_at, deleted_at)`, indeks `(feed_item_id, created_at, id)`, indeks `parent_comment_id`.
- `content_reactions(id, target_type, target_id, user_id, reaction_type, created_at)`, **UNIQUE** `(target_type, target_id, user_id, reaction_type)`, indeks `(target_type, target_id)`.
- Liczniki: read model albo `COUNT(*)` z indeksu — adapter in-memory liczy w pamięci.

## 14. BACKEND_PARTIAL / TRANSPORT_PARTIAL / UI_SHELL_ONLY

- `content-v2/comments` + `content-v2/reactions`: BACKEND_PARTIAL / READ_MODEL_SKELETON (in-memory adaptery, testy 10 + 7).
- `application-v2/community-interactions`: orkiestracja na public-api, 15 testów.
- Frontend: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (`community-interactions-mock-adapter`). Brak HTTP transportu domena↔front (TRANSPORT_PARTIAL).

## 15. Świadomie NIE wdrożono

threading/reply UI (model gotowy, UI flat), edit comment w UI, moderation delete, emoji reactions multi-set, notifications po komentarzu/reakcji, chat, events, RingPost/kanały runtime, global feed, ranking, full Public Hub, full audit ZIP, push/email.

## 16. Test evidence

- `content-v2/comments/__tests__/comment-service.test.ts` — 10 (create/empty/too-long, update author-only, soft-delete + body strip, non-author denied, cursor + scoped + ordering, count single+batch, no-PII, parentCommentId thread-check).
- `content-v2/reactions/__tests__/reaction-service.test.ts` — 7 (set, idempotent dedupe, remove idempotent, toggle, batch counts, viewer state, no-PII).
- `application-v2/community-interactions/__tests__/service.test.ts` — 15 (member can comment community_all, stranger denied, member denied staff_only, mod can on staff_only, staff_only listing denied for member, author-only update/delete, toggle like, member denied react staff_only, stranger denied, react on comment, summary batch only-visible, no-PII, distributed locality of comments + reactions, architecture: no internals import).
- `client/src/features-v2/communities-v2/__tests__/CommunityPostInteractions.test.tsx` — 7 (action bar renders, reaction toggle updates count from adapter, comments toggle + composer posts real comment, member never sees Kadra cards, soft-delete placeholder rendering, no `@server/*` imports, adapter bans `as any`/`@ts-ignore`).

Total nowych: **39 testów**. Pełny suite: **884/884 PASS**.

## 17. Guard evidence

- `pnpm check` — PASS (tsc --noEmit).
- `pnpm lint` — PASS (eslint, 0 warnings).
- `pnpm test` (vitest) — PASS, 117 files / 884 tests.
- `pnpm build` — PASS (Vite, 2.4s).
- `pnpm rules:check` — PASS (43/43 guard scripts).
- `pnpm arch:check:v2` — PASS (9/9: legacy-imports, removed-product-areas, public-dto-pii, media-base64, pagination, domain-registry, domain-scaffold, feature-registry, brak naruszeń).
- `pnpm guards:all-local` — PASS (rules + secrets + scripts + placeholder-tests + inline-exceptions + no-any + review-index + pre-commit-decision + self-audit + bramka + code-quality + scalability + frontend-perf + status-truth + dependency-discipline + logging-pii). Bramka acceptance: 24/25 (1 wymaga zewnętrznego — branch protection na GitHubie).

## 18. P0 / P1 / P2

Brak P0. Brak P1.
P2 (do oddzielnych slice'ów):
- Threading UI (model gotowy, render zwiniętych odpowiedzi).
- Edit comment afford­ance (model + service obsługuje, UI brak).
- Moderation delete (separate command/policy).
- HTTP transport (TRANSPORT_PARTIAL → REAL).
- Notifications hook (po komentarzu/reakcji w obserwowanych postach).

## 19. PR status

Commit lokalny gotowy do `feat(v2): communities slice 6 — comments + reactions (clean-room)`. Push/PR — w gestii ownera.

## 20. Następna rekomendowana komenda

**Community Slice 7** — channels/RingPost legacy-to-V2 (struktura kanałów, follow/unfollow w V2, distribution czytelnia) **albo** community product polish (skoro pełna ścieżka feed → komentarze → reakcje działa, polish = notifications + threading + transport HTTP).

Rekomendacja: **community-feeds HTTP transport** jako kolejny krok techniczny zanim Slice 7, żeby wreszcie zamknąć TRANSPORT_PARTIAL na trzy slice'y (Slice 5 + Slice 6).

---

## Tabela skrócona

| Obszar | Status |
|---|---|
| Legacy comments/reactions UI inventory | PASS |
| Comments backend | PASS |
| Reactions backend | PASS |
| Interaction counts (single + batch) | PASS |
| Application-v2 orchestration | PASS |
| Community feed visibility | PASS |
| Propagated post interactions (locality) | PASS |
| Frontend comments UI | PASS |
| Frontend reactions UI | PASS |
| Architecture boundaries | PASS |
| DTO / PII / security | PASS |
| Tests | PASS (39 nowych, 884/884 total) |
| Guards | PASS (rules:check, arch:check:v2, guards:all-local) |
| Readiness | **READY_FOR_PRODUCT_REVIEW** |
