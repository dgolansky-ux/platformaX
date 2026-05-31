# LEGACY → V2 — Communities Slice 4: Struktura i podspołeczności (UI MAP)

Status: ACTIVE_EVIDENCE · clean-room. Mapa implementacyjna, nie esej.
Źródło legacy: `Starykod-4-extracted/PlatformaX/`.

## 1. Legacy trasy

| Trasa legacy | Plik | V2 |
|---|---|---|
| `/communities/:id/structure` | `pages/ManageStructure.tsx` | `/communities/:slug/structure` (React Router, slug zamiast id) |
| (brak osobnej trasy kreatora — modal overlay) | `components/SubCommunityWizard.tsx` | overlay w `CommunityStructureShell` (bez osobnej trasy) |
| (edycja/move/delete — sheety w tej samej trasie) | `pages/ManageStructureSheets.tsx` | dialogi w `CommunityStructureShell` |

## 2. Legacy ekrany i komponenty → V2

| Legacy | Rola | V2 odpowiednik |
|---|---|---|
| `ManageStructure.tsx` | kontener: header, taby Podgląd/Zasięgi, toggle Drzewo/Lista, empty/loading/error | `CommunityStructureShell.tsx` (BEZ taba „Zasięgi” — to feedy/broadcast = Slice 5) |
| `ManageStructureCircleTree` (CircleTreeView) | domyślny widok „Drzewo” (org-chart, węzły okrągłe, SVG) | `CommunityStructureTree.tsx` (drzewo, layout zagnieżdżony — uproszczony, bez SVG circle) |
| `ManageStructureOrgTree` (OrgTreeView) | widok „Lista”/org (karty + SVG linie) | `CommunityStructureList.tsx` (lista z wcięciami depth) |
| `ManageStructureTreeLayout` | `buildTree`, layout engine, `TreeLines` | `buildStructureTree` helper (czysty, bez SVG) |
| `ManageStructureTreeCards` (NodeCard, ActionPanel, StaffAvatars) | karta węzła + panel akcji + awatary kadry | `CommunityStructureNode.tsx` + `StructureNodeActions.tsx` |
| `SubCommunityWizard.tsx` | 5-krokowy kreator (overlay) | `CreateSubcommunityWizard.tsx` |
| `SubCommunityWizardSteps` + `Step4`/`Step5` | kroki 1–5 | `SubcommunityWizardSteps.tsx` |
| `ManageStructureSheets` (Add/Edit/Move/Delete) | sheety akcji | `MoveSubcommunityDialog.tsx`, `DeactivateSubcommunityDialog.tsx`, edycja w wizardzie/inline |
| `ManageStructureRoles` | zarządzanie rolami węzła | NIE w Slice 4 (role per-node = nakładka na Slice 3); przyciski „kadra” przy tworzeniu TAK |

## 3. Legacy logika hierarchii (z `docs/hierarchy-system.md` + `db-community-hierarchy*`)

- Pola węzła: `parent_id` (NULL = korzeń), `root_community_id`, `depth` (0 = korzeń), `path` ("1.2.5" = przodkowie), `member_count`, `is_active`, `node_type` (zawsze `community`).
- **Maksymalna głębokość: 5 poziomów (depth 0–4).** Przy depth=4 przycisk „Dodaj podgrupę” ukryty (`ActionPanel`: `canManage && node.depth < 4`).
- Tworzenie dziecka: rola **owner/admin** w węźle nadrzędnym (`canManage = ["owner","admin"]`).
- `path` aktualizowany przy tworzeniu: `parent.path + "." + parent.id`.
- `root_community_id` = zawsze id korzenia drzewa, spójny dla całego drzewa.
- Move: target NIE może być self ani descendantem (`moveTargetOptions` filtruje `selfAndDescendants` + `depth < 4`).
- **Delete legacy = hard delete** (`deleteStructureNode`) — ODRZUCONE w V2 (soft deactivation).
- Broadcast/zasięgi (`community_broadcasts`, tab „Zasięgi”) — ODRZUCONE w Slice 4 (to Slice 5: feedy).

## 4. Kreator podspołeczności — 5 kroków (1:1)

| Krok | Tytuł legacy | Ikona | Pola | V2 |
|---|---|---|---|---|
| 1 | Podstawy | Sparkles | name (≥3, max 100), description (max 500), type public/private | 1:1 |
| 2 | Kategoria | Search | categoryId, subcategoryId, topic | 1:1 (kategorie z katalogu V2; subkategorie pominięte jeśli brak w modelu) |
| 3 | Lokalizacja | MapPin | operatingMode (in_person/online/hybrid), location | 1:1 |
| 4 | Przynależność | Users | joinAsMember (tak/nie), initialStaff [{userId, role: admin/moderator}] z członków rodzica | 1:1 (kandydaci kadry = członkowie rodzica, bez PII: userId+displayName) |
| 5 | Utwórz | Check | podsumowanie: karta + przynależność + kadra + checklist | 1:1 (checklist „co dodać później” zachowany) |

- Progress bar 1:1: kółka 1–5, zielony check po ukończeniu, linie między.
- Walidacja: krok 1 wymaga name ≥ 3; reszta opcjonalna („Pomiń ten krok” na 2/3/4).
- Footer: „Dalej”/„Utwórz podspołeczność”, back arrow w headerze.
- Header pokazuje „Krok N z 5 — {tytuł} · Rodzic: {parentName}”.

## 5. Action panel węzła (legacy `ActionPanel`) → V2 CTA wg policy

| Akcja legacy | Warunek | V2 |
|---|---|---|
| Otwórz | zawsze | link do `/communities/:childSlug` |
| Dodaj niżej | `canManage && depth < 4` | `canCreateChild` |
| Edytuj | `canManage` | `canManageStructure` → updateSubcommunityBasics |
| Zarządzaj rolami | `canManage` | poza Slice 4 |
| Przenieś | `canManage && !isRoot` | `canMove` |
| Usuń (hard) | `canManage && !isRoot` | **ZASTĄPIONE: Dezaktywuj (soft)** `canDeactivate` |
| (brak) | — | **NOWE: Reaktywuj** dla zdezaktywowanych (`canReactivate`) |

## 6. Co przenosimy 1:1 (wizualnie)

- Layout headera (back, tytuł „Struktura”, podtytuł = nazwa, licznik węzłów).
- Toggle Drzewo/Lista (ikony Share2/LayoutList, aktywny = primary).
- Drzewo z czytelną hierarchią parent/child, breadcrumbs do korzenia.
- Karty węzłów: ikona Hash w gradiencie, badge „Główna” na korzeniu, nazwa, public/private (Globe/Lock), liczba członków/dzieci, status active/deactivated.
- Mikrocopy PL: „Struktura społeczności”, „Tapnij w element…”, „Brak struktury”, „Dodaj pierwszy element”, „Nowa podspołeczność”, „Pomiń ten krok”, „Utwórz podspołeczność”.
- Empty/loading/error/unauthorized states.
- Mobile-usable (design tokens V2, CSS module).

## 7. Co ODRZUCAMY z legacy (runtime)

- tRPC (`trpc.communities.*`, `useQuery`/`useMutation`, `utils.invalidate`).
- `sonner` toasty, `useAuth`, `DesktopLayout` legacy.
- Hard delete (`deleteStructureNode`) → soft deactivation.
- `any`/`as any`/RULE_EXCEPTION inline (legacy pełen `any`).
- SVG circle/org layout engine (ryzykowny, ciężki) → uproszczone drzewo zagnieżdżone CSS (visual hierarchy zachowana). Różnica opisana w raporcie.
- Tab „Zasięgi” + broadcasty (Slice 5).
- `ManageStructureRoles` per-node (poza zakresem).
- base64 upload avatarów, Supabase coupling, localStorage backend.

## 8. Model V2 (clean-room) — gdzie ląduje

- Domena `server/domains-v2/communities-v2`:
  - `dto-structure.ts` — `SubcommunityDTO`, `CommunityStructureDTO`, `CommunityBreadcrumbDTO`, inputy.
  - `policy-structure.ts` — `canViewStructure`, `canCreateSubcommunity`, `canMoveSubcommunity`, `canDeactivateSubcommunity`, `canReactivateSubcommunity`, `canAssignSubcommunityStaff`, `wouldCreateCycle`, `MAX_STRUCTURE_DEPTH=4`.
  - `ports.ts` — `CommunityHierarchyRecord` + `HierarchyRepository`.
  - `store.ts` — `createInMemoryHierarchyRepository`.
  - `service-structure.ts` (+ `service-structure-read.ts` / `service-structure-write.ts`) — operacje.
- Application `server/application-v2/use-cases/communities/structure.ts`:
  - `getCommunityStructureView`, `createSubcommunityWithStaff`, `moveSubcommunitySafely`, `deactivateSubcommunitySafely`, `listSubcommunities`, `reactivate`, `updateBasics`.
- Shared `shared/contracts/communities-structure.ts` — DTO front + inputy.
- Frontend `client/src/features-v2/communities-v2/structure/` + `structure-mock-adapter.ts` (MOCK_LOCAL_ONLY) + trasa `app-v2/communities/CommunityStructurePage.tsx`.

## 9. Reguły bezpieczeństwa (do egzekwowania)

- Brak cykli; community nie jest rodzicem samego siebie; brak przeniesienia pod własnego potomka.
- `rootCommunityId` spójny dla całego drzewa; `depth` przeliczany po move (i poddrzewo).
- Soft deactivation; domyślnie **blokuj dezaktywację rodzica z aktywnymi dziećmi** (rekomendacja z taska).
- DTO bez PII (tylko id/slug/name/role/liczniki); kadra = userId + displayName.
- Tylko founder/admin rodzica tworzy/move/dezaktywuje/przypisuje kadrę; member/moderator nie.
