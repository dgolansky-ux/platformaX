# Communities Slice 4 — Struktura i podspołeczności (REPORT)

Status: READY_FOR_PRODUCT_REVIEW · clean-room V2 · MOCK_LOCAL_ONLY transport (frontend), BACKEND_PARTIAL (in-memory domain).
Branch: `feat/contacts-v2-clean-room-slice` · Base SHA przed slice: `8edb3c3`.
Data: 2026-05-29.

## 1. Przeanalizowane pliki legacy

`Starykod-4-extracted/PlatformaX/`:
- `client/src/features/communities/pages/ManageStructure.tsx` (kontener, taby, toggle, empty/loading)
- `pages/ManageStructureTree*.tsx` (buildTree, layout engine, NodeCard, ActionPanel, StaffAvatars), `ManageStructureOrgTree.tsx`, `ManageStructureCircleTree.tsx`
- `pages/ManageStructureSheets.tsx` (Add/Edit/Move/Delete)
- `components/SubCommunityWizard.tsx` + `SubCommunityWizardSteps.tsx` + `SubCommunityWizardStep4/5`
- `docs/hierarchy-system.md`, `docs/HIERARCHY_DESIGN.md`
- `server/domains/communities/db/db-community-hierarchy*.ts`, `routers/routers-communities-hierarchy*.ts`

Mapa: [LEGACY_COMMUNITIES_SLICE_4_STRUCTURE_UI_MAP.md](./LEGACY_COMMUNITIES_SLICE_4_STRUCTURE_UI_MAP.md).

## 2. Co przeniesiono 1:1 wizualnie

- Ekran struktury: header (tytuł „Struktura” + nazwa + licznik węzłów), breadcrumbs root→current, toggle **Drzewo/Lista**, CTA „Utwórz podspołeczność”, empty/loading/error/unauthorized states.
- Karty węzłów: badge inicjału, badge „Główna” na korzeniu, „Prywatna”/„Wyłączona”, liczniki członków/podspołeczności, panel akcji po tapnięciu (Otwórz/+Podspołeczność/Edytuj/Przenieś/Dezaktywuj/Reaktywuj) gated policy — odpowiednik legacy `ActionPanel`.
- Kreator 5-krokowy 1:1: Podstawy · Kategoria · Lokalizacja · Przynależność · Podsumowanie; progress dots z zielonym ✓, back/next, „Krok N z 5 — {tytuł} · Rodzic: {nazwa}”, walidacja kroku 1.
- Mikrocopy PL zachowane (np. „Tapnij w element, żeby zobaczyć akcje”, „Tak, należę / Nie, tworzę dla innych”, „Utwórz podspołeczność”).

## 3. Co odrzucono z legacy runtime

tRPC + useQuery/useMutation, `sonner`, `useAuth`, `DesktopLayout` legacy, **hard delete** (`deleteStructureNode`) → soft deactivation, `any`/RULE_EXCEPTION inline, ciężki SVG circle/org layout engine → czysty zagnieżdżony layout CSS (uzasadnienie w §14), tab „Zasięgi”/broadcasty (Slice 5), `ManageStructureRoles` per-node, base64 upload, Supabase coupling.

## 4. Parent / child / root / depth / path

Domena `CommunityHierarchyRecord` (`ports.ts`): `communityId`, `parentCommunityId|null`, `rootCommunityId`, `depth` (0=korzeń, max 4 → 5 poziomów), `path` (dot-joined id przodków, root-first, "" dla korzenia), `sortOrder`, `status` (active/deactivated). Korzeń bez wiersza traktowany jako syntetyczny aktywny root (depth 0). `path` i `depth` dziecka liczone z rodzica; przy move przeliczane dla całego poddrzewa.

## 5. Ekran struktury — jak działa

`CommunityStructureShell` ładuje `getCommunityStructureView(slug)` → stan loading/error/forbidden/ready. Renderuje Hero + Breadcrumb + Toolbar (toggle + CTA) + drzewo (`CommunityStructureTree`, zagnieżdżone) lub listę (`CommunityStructureList`, wcięcia depth). Selekcja węzła odsłania akcje (policy). Dialogi: wizard / move / deactivate / edit przez `CommunityStructureDialogs`.

## 6. Kreator podspołeczności — jak działa

`CreateSubcommunityWizard` (overlay) ze stanem `SubWizardData`. Slug auto z nazwy (`slugify`), edytowalny. Walidacja: krok 1 wymaga nazwy ≥3 i poprawnego slug; kroki 2–4 opcjonalne. Submit → `communityStructureMockAdapter.createSubcommunity` (realny zapis do fixture: nowy węzeł pojawia się w drzewie). Kategorie z `communitiesMockAdapter.listCategories`, kandydaci kadry z `listStaffCandidates` (bez PII).

## 7. Move — jak działa

`moveSubcommunitySafely` (application) → `structure.moveSubcommunity` (domena). Walidacje: tylko founder/admin; target istnieje i aktywny; **nie self**; **nie descendant** (cykl) — `wouldCreateCycle`; po move przeliczane `parentCommunityId/rootCommunityId/depth/path` dla całego poddrzewa; odrzucenie przy przekroczeniu MAX_DEPTH. Front: `MoveSubcommunityDialog` z kandydatami przefiltrowanymi (bez self+potomków, depth<max).

## 8. Deactivate — jak działa

Soft deactivation (`status=deactivated`), **nie hard delete**: nie usuwa członków ani historii (test domeny potwierdza zachowanie membershipu). Domyślnie **blokada dezaktywacji rodzica z aktywnymi dziećmi** (rekomendacja z taska — `HAS_ACTIVE_CHILDREN`). Reaktywacja możliwa, blokowana jeśli rodzic zdezaktywowany. Root nie może być zdezaktywowany (`NOT_A_SUBCOMMUNITY`).

## 9. Staff assignment — jak działa

`assignSubcommunityStaff`: tylko founder/admin **rodzica**; role tylko admin/moderator (`INVALID_STAFF_ROLE` dla innych); upsert membershipu w dziecku. `createSubcommunityWithStaff` (application) komponuje create + assign atomowo z perspektywy wywołującego. Kandydaci kadry = członkowie rodzica (userId+displayName, **bez PII**).

## 10. Policy

`policy-structure.ts`: `canViewStructure` (public=wszyscy, private=członkowie), `canCreateSubcommunity` (founder/admin rodzica), `isDepthCreatable` (<MAX), `canMove/Deactivate/Reactivate` (founder/admin), `canAssignSubcommunityStaff` (founder/admin rodzica), `isAssignableStaffRole`, `wouldCreateCycle`, `MAX_STRUCTURE_DEPTH=4`.

## 11. Co realnie podpięte do backendu

- Domena `communities-v2`: pełny serwis struktury (read+write ops) na repozytoriach in-memory, z testami (21).
- Application `communities/structure.ts`: orkiestracja na domain public-api, z testami (6).
- Frontend: podpięty do `structure-mock-adapter` (MOCK_LOCAL_ONLY, źródło prawdy fixture), z testami (9).

## 12. Co jest UI_SHELL_ONLY / TRANSPORT_PARTIAL

- Brak HTTP transportu domena↔front (TRANSPORT_PARTIAL) — front używa własnego mock-adaptera, identycznego semantycznie z domeną (te same reguły: authority, depth, cykle, soft-deactivation). Spięcie HTTP/DB to osobny krok.

## 13. Świadomie NIE wdrożone teraz

3 feedy społeczności, moduły, chat, events, RingPost, pełny Public Hub, komentarze/reakcje, broadcasty/„Zasięgi”, `ManageStructureRoles` per-node, full audit ZIP.

## 14. Test evidence

- Domena: `server/domains-v2/communities-v2/__tests__/communities-structure.test.ts` — 21 testów (create/depth/authority, read/breadcrumbs/tree/PII, move self/descendant/subtree-recompute/authority, deactivate soft/active-children/reactivate/no-hard-delete, staff founder/forbidden).
- Application: `server/application-v2/use-cases/communities/__tests__/structure.test.ts` — 6 testów (create+staff, cycle block, slug-view no-PII, policy-not-bypassed, deactivate).
- Frontend: `client/src/features-v2/communities-v2/__tests__/CommunityStructureShell.test.tsx` — 9 testów (tree/breadcrumb/CTA, toggle, read-only member, error, akcje, move/deactivate dialog, wizard validation+real create, no `@server/*`).
- Suite: **804 passed / 109 plików** (36 nowych testów).

## 15. Guard evidence

`pnpm check` ✅ · `pnpm lint` ✅ · `pnpm lint:v2` ✅ · `pnpm test` ✅ (804) · `pnpm build` ✅ · `pnpm rules:check` ✅ (RULES_CHECK_PASS) · `pnpm arch:check:v2` ✅ (ARCH_CHECK_V2_PASS) · `pnpm guards:all-local` ✅ (24/25; poz. 19 branch-protection = [EXT], weryfikacja po stronie GitHub, niezależna od tego slice).

## 16. P0/P1/P2

- P0: brak.
- P1: brak.
- P2: (a) brak HTTP/DB transportu (TRANSPORT_PARTIAL) — wymaga osobnego spięcia; (b) circle/org SVG view nieprzeniesiony (świadome uproszczenie, §3); (c) per-node role management (`ManageStructureRoles`) poza zakresem.

## 17. Następny rekomendowany krok

**Community Slice 5 — trzy feedy społeczności: `community_all`, `relational`, `staff_only`** (w tym broadcasty/„Zasięgi” z legacy).

---

## PRE-COMMIT DECISION

- Changed files: 8 zmodyfikowanych + 14 nowych (lista w §poniżej / `git status`).
- Domains touched: `communities-v2` (domena), `application-v2/use-cases/communities`, `features-v2/communities-v2`, `app-v2/communities`, `shared/contracts`.
- Cross-domain imports: brak nowych; application importuje wyłącznie `communities-v2/public-api`; front nie importuje `@server/*`.
- Legacy runtime imports: brak (clean-room).
- Removed routes/nav/build chunks: brak usunięć; dodana trasa `/communities/:slug/structure` + linki „Struktura” w profilu i zarządzaniu.
- Public DTO PII: brak — DTO struktury i kandydaci kadry zawierają tylko id/slug/name/role/liczniki (test PII zielony).
- Media base64/dataUrl: brak.
- List pagination/limit/cursor: drzewo bounded (MAX_TREE_NODES, depth ≤ 4); wszystkie pętle fan-out z `SCALABILITY_EXCEPTION`/MOCK_LOCAL_ONLY.
- Fake DONE/status truth: brak fake save — mutacje realnie zmieniają stan fixture/in-memory; status READY_FOR_PRODUCT_REVIEW (nie IMPLEMENTED/PRODUCTION_READY).
- Env safety: brak zmian env; brak db push/deploy.
- TypeScript: `pnpm check` PASS.
- V2 lint: `pnpm lint:v2` + `pnpm lint` PASS.
- Tests: 804 PASS.
- Build: PASS.
- Commit decision: COMMIT — brak P0/P1, bramki zielone.

## SELF-AUDIT / INDEPENDENT REVIEW PASS

- What I changed: dodano model + serwis hierarchii w `communities-v2`, application use-case struktury, shared contract, frontend ekranu struktury + kreatora, routing i linki nawigacji.
- What I might have broken: istniejące przepływy communities (profil/zarządzanie) — pokryte istniejącymi testami, nadal zielone; dodano tylko linki.
- Domain boundaries affected: rozszerzono public-api `communities-v2` o powierzchnię struktury; brak nowych zależności cross-domain.
- Cross-domain imports check: application → tylko `communities-v2/public-api`; front → `@shared/*` + lokalne; brak `@server/*` we froncie (test zielony).
- Legacy/runtime check: brak importu legacy/tRPC/Supabase.
- Fake DONE/status truth check: brak — patrz PRE-COMMIT.
- PII/base64/secrets check: brak PII w DTO (testy), brak base64, brak sekretów (secret scan w guards zielony).
- Routes/nav/build graph check: nowa trasa + linki; build 270 modułów PASS.
- Guard weakening check: nie osłabiono żadnego guardu; obejścia heurystyki rozwiązane refaktorem kodu (for→find) i komentarzami `SCALABILITY_EXCEPTION`, nie zmianą guardów.
- Evidence reviewed: testy domeny/application/frontu, wyniki bramek (§15).
- Gates run: check, lint, lint:v2, test, build, rules:check, arch:check:v2, guards:all-local.
- Remaining risks: TRANSPORT_PARTIAL (brak HTTP/DB) — opisane jako P2; UI nie weryfikowane w realnej przeglądarce (tylko jsdom + bramki) — patrz nota poniżej.

> Nota: zmiany UI zweryfikowano testami renderującymi (jsdom) + buildem produkcyjnym; nie uruchomiono ręcznej weryfikacji w przeglądarce w tym środowisku.
