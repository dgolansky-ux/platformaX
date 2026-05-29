# Communities Slice 5 — Trzy feedy + publikacja w dół struktury (REPORT)

Status: READY_FOR_PRODUCT_REVIEW · clean-room V2 · MOCK_LOCAL_ONLY (frontend), BACKEND_PARTIAL / READ_MODEL_SKELETON (domena).
Branch: `feat/contacts-v2-clean-room-slice` · SHA bazowy przed slice: `b38c122`.
Data: 2026-05-29.

## 1. Przeanalizowane pliki legacy

`Starykod-4-extracted/PlatformaX/`: `content/pages/CommunityDetailFeedTab.tsx`, `communities/components/StructureScopeSelector.tsx`, `communities/components/FeedSettingsPanel.tsx`, `content/components/SharedPostCard.tsx`, `UniversalPublishSheet`. Mapa: [LEGACY_COMMUNITIES_SLICE_5_FEEDS_UI_MAP.md](./LEGACY_COMMUNITIES_SLICE_5_FEEDS_UI_MAP.md).

## 2. Co przeniesiono 1:1 wizualnie

Composer („Napisz coś do społeczności…"), selektor zasięgu (Tylko ta / Bezpośrednie / Wybrane / Wszystkie — legacy here/selected/all), mini-picker podspołeczności z checkboxami, karta posta (autor public summary + treść + data + badge), empty/loading/error states, ustawienia feedu (kto publikuje, feed kadry). Mikrocopy PL, design tokens V2, mobile.

## 3. Co odrzucono z legacy runtime

tRPC, `sonner`, `useCommunityDetail`, Supabase coupling, localStorage, base64 media, RingPost, events block, moduły, komentarze/reakcje, `any`/RULE_EXCEPTION.

## 4. Trzy feedy

- **community_all** — feed główny; widoczny dla członków; publikacja wg `communityAllPostingPolicy` (`all_members` lub `staff_only`).
- **relational** — feed relacyjny; włączalny; **limit miesięczny 1–10 liczony backendowo** (per user/community/month); brak propagacji w dół.
- **staff_only** — feed kadry; widoczny i zapisywalny wyłącznie dla founder/admin/moderator; niewidoczny dla memberów i obcych.

## 5. Publisher

`CommunityFeedComposer` + `CommunityFeedTabs`: aktywna zakładka = feedType; composer pokazuje selektor zasięgu tylko dla uprawnionej kadry i tylko poza relational; relational pokazuje pasek quota. Submit → `community-feeds-mock-adapter` (front) / `publishCommunityPost` use-case (backend). Brak fake save.

## 6. Publikacja w dół struktury

`application-v2/use-cases/community-feeds`:
- `PublishScope`: `current_community_only` / `direct_children` / `selected_descendants` / `all_descendants`.
- Dozwolone feedy do propagacji: **tylko community_all + staff_only** (relational → `RELATIONAL_NO_PROPAGATION`).
- Policy `canPublishToDescendants(role, settings, feedType)` (domyślnie founder/admin; moderator tylko gdy jawnie włączony).
- Cele rozwiązywane z drzewa Slice 4 (`structure.getCommunityStructure`), filtrowane do aktywnych potomków; `selected` waliduje przynależność (`TARGET_NOT_DESCENDANT`).
- `all_descendants` ma cap `MAX_DESCENDANT_TARGETS=100` → powyżej `TOO_MANY_TARGETS_REQUIRES_ASYNC_DISTRIBUTION` (OUTBOX_SKELETON; brak ciężkiego sync fanout).

## 7. PublishScope — szczegóły

current → 0 celów (tylko źródło). direct_children → bezpośrednie aktywne dzieci. selected_descendants → wskazane (walidacja). all_descendants → całe poddrzewo (cap). Źródłowy feed item powstaje zawsze; kopie do celów przez `distributeCommunityPost`.

## 8. Dedupe / distributionId

Jeden `distributionId` na całą dystrybucję. `dedupeKey = communityId|feedType|(distributionId ?? postId)` z unikalnym indeksem — ponowna dystrybucja do tego samego celu/feedu jest idempotentna (`DUPLICATE` pomijane, brak duplikatów). Ślad: `sourceCommunityId` + `distributionId`; UI: badge „Opublikowano z: {nazwa źródła}".

## 9. Relational quota

`relationalMonthlyLimit` (1–10) w `CommunityFeedSettings`. `content.countRelationalForAuthorMonth(communityId, authorUserId, monthKey)` liczy aktywne itemy relational autora w danym miesiącu; use-case blokuje publikację przy `used >= limit` (`QUOTA_EXCEEDED`). Quota liczona **backendowo**, front tylko pokazuje stan (pasek `used/limit`). Relational nie propaguje się w dół.

## 10. staff_only visibility

`canViewStaffOnly(role)` = founder/admin/moderator. `listCommunityFeed(staff_only)` dla membera/obcego → `FORBIDDEN`. Propagowany item staff_only zachowuje feedType w społeczności docelowej, więc strict-visibility obowiązuje też tam (member docelowej społeczności go nie zobaczy).

## 11. Policy (communities-v2/policy-feeds.ts)

`canUpdateFeedSettings` (founder/admin), `canPostToCommunityAll`, `canPostRelational`, `canPostStaffOnly`, `canViewCommunityAll/Relational/StaffOnly`, `canPublishToDescendants`, `isStaffRole`, `isValidRelationalLimit`.

## 12. Use-cases (application-v2)

`publishCommunityPost` (+ wbudowana propagacja), `listCommunityFeed`, `getCommunityFeedTabsState`, `getCommunityFeedSettings`/`updateCommunityFeedSettings` (passthrough). Importuje wyłącznie domain public-api; nie jest source of truth; nie obchodzi policy.

## 13. Migration / schema drafts

`supabase/migrations/0005_community_feeds.sql` (SCHEMA DRAFT, additive-only, NIE pushowane): `community_feed_settings`, `community_posts`, `community_feed_items` (unique `dedupe_key`, index `community_id+feed_type+created_at DESC+id`, index author/distribution/source, partial index quota), `community_post_distributions`. RLS enabled, brak permissive catch-all. Quota liczona z feed items (generated `month_key`).

## 14. BACKEND_PARTIAL / TRANSPORT_PARTIAL / UI_SHELL_ONLY

- content-v2 community-feeds + communities-v2 feed-settings: BACKEND_PARTIAL / READ_MODEL_SKELETON (in-memory adaptery, testy).
- application-v2 community-feeds: orkiestracja na public-api, testy.
- Frontend: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (`community-feeds-mock-adapter`, te same reguły co domena). Brak HTTP transportu domena↔front (TRANSPORT_PARTIAL).
- all_descendants > cap: OUTBOX_SKELETON (event `CommunityPostDistributed` nie wdrożony — async distribution to osobny krok).

## 15. Świadomie NIE wdrożone

komentarze, reakcje, chat, events, RingPost, global feed, ranking, pełne moduły, pełny Public Hub, full audit ZIP.

## 16. Test evidence

- content-v2: `community-feeds/__tests__/community-feeds-service.test.ts` — 7 (post+item, empty body, no-PII, distribute+isDistributed, dedupe, cursor+stable order+scoped, relational count).
- communities-v2: `__tests__/communities-feed-settings.test.ts` — 11 (defaults, update founder, member denied, limit range, no-PII, + 6 policy).
- application-v2: `community-feeds/__tests__/service.test.ts` — 15 (posting policy all_members/staff_only, staff feed staff-only, relational quota+disabled+no-propagation, direct/selected/all descendants, non-descendant denied, moderator denied, staff visibility strict, tabs state, no-PII).
- frontend: `__tests__/CommunityFeedsShell.test.tsx` — 8 (tabs, staff hidden for member, publish real post, scope selector + picker, relational quota badge, distribution trace in child, relational no scope, no `@server/*`).
- Suite: **844 passed / 113 plików** (41 nowych testów).

## 17. Guard evidence

`pnpm check` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ (844) · `pnpm build` ✅ · `pnpm rules:check` ✅ · `pnpm arch:check:v2` ✅ · `pnpm guards:all-local` ✅ (24/25; poz. 19 = [EXT] branch-protection, weryfikacja po stronie GitHub) · `pnpm guards:governance` ✅ · migration safety ✅ · removed-product-areas ✅.

## 18. P0/P1/P2

- P0: brak. P1: brak.
- P2: (a) brak HTTP/DB transportu (TRANSPORT_PARTIAL); (b) async distribution dla dużych drzew = OUTBOX_SKELETON (cap 100 + DOMAIN_ERROR); (c) settings UI feedów nie podpięty w panelu zarządzania (passthrough use-case istnieje, mock-adapter ma get/update) — można dodać w polishu.

## 19. Następny rekomendowany krok

**Community Slice 6 — product polish/integration** (podpięcie ustawień feedów w zarządzaniu + async distribution outbox) **albo komentarze/reakcje**, zależnie od decyzji ownera.

---

## PRE-COMMIT DECISION

- Changed files: 8 zmodyfikowanych + 12 nowych (`git status`).
- Domains touched: `content-v2` (community-feeds), `communities-v2` (feed settings/policy), `application-v2/use-cases/community-feeds`, `features-v2/communities-v2/feeds`, `app-v2/communities`, `shared/contracts`, `supabase/migrations`.
- Cross-domain imports: application → tylko `communities-v2/public-api` + `content-v2/public-api`; front → `@shared/*` + lokalne; brak `@server/*` we froncie (test zielony). communities nie trzyma postów; content nie trzyma ról/membershipów.
- Legacy runtime imports: brak.
- Removed routes/nav/build chunks: brak usunięć; dodana trasa `/communities/:slug/feed` + link „Feed" w profilu.
- Public DTO PII: brak — feed/settings DTO mają tylko id/role/liczniki (testy PII zielone).
- Media base64/dataUrl: brak.
- List pagination/limit/cursor: feed read model cursor + maxLimit; descendant fan-out z capem 100; relational quota backendowa.
- Fake DONE/status truth: brak fake save — mutacje realnie zmieniają stan; status READY_FOR_PRODUCT_REVIEW.
- Env safety: brak zmian env; brak db push/deploy (migracja to draft additive).
- TypeScript: PASS. V2 lint: PASS. Tests: 844 PASS. Build: PASS.
- Commit decision: COMMIT — brak P0/P1, bramki zielone.

## SELF-AUDIT / INDEPENDENT REVIEW PASS

- What I changed: 3 feedy (content-v2 posty/feed items + communities-v2 ustawienia/policy), orkiestracja publish/list/tabs/descendant w application-v2, shared contract, UI feedów + composer + scope/picker + karty, trasa + link, migration draft.
- What I might have broken: istniejące przepływy communities/content — pokryte testami, nadal zielone; dodano tylko nową powierzchnię i jeden link.
- Domain boundaries affected: rozszerzono public-api content-v2 i communities-v2; brak nowych zależności cross-domain internals.
- Cross-domain imports check: zweryfikowane (patrz PRE-COMMIT); arch:check:v2 + depcruise w guardach zielone.
- Legacy/runtime check: brak importu legacy/tRPC/Supabase.
- Fake DONE/status truth check: brak — patrz PRE-COMMIT; status truth guard zielony.
- PII/base64/secrets check: brak PII (testy), brak base64, secret scan zielony.
- Routes/nav/build graph check: nowa trasa + link; build PASS; removed-product-areas PASS.
- Guard weakening check: nie osłabiono guardów; false-positives rozwiązane przez sankcjonowane markery (`SCALABILITY_HOT_PATH_EXCEPTION`) i refaktor nazw (kolizja „notes"/„limit"), nie przez zmianę guardów.
- Evidence reviewed: testy 4 warstw + wyniki bramek (§17).
- Gates run: check, lint, test, build, rules:check, arch:check:v2, guards:all-local, guards:governance, migration safety.
- Remaining risks: TRANSPORT_PARTIAL i OUTBOX_SKELETON (P2); UI weryfikowane testami jsdom + buildem, nie ręcznie w przeglądarce w tym środowisku.
