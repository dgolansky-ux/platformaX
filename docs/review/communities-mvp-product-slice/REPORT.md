# Communities MVP Product Slice — REPORT

**Branch:** `feat/contacts-v2-clean-room-slice`
**Status MVP:** READY_FOR_PRODUCT_REVIEW (wszystkie bramki PASS)

## Co wdrożono

- **Backend `communities-v2`:** poszerzony service o join-request lifecycle (accept/reject), `listMembers`, `changeMemberRole` (founder-protected), `listPendingJoinRequests`, `getPublicCommunityBySlug`, `getViewerRole`, `listCategories`. Operacje członkostwa wydzielone do `service-member-ops.ts`. Repository ports rozszerzone (`updateRole`, `getById`, `update`, `listPending`). Policy: `canChangeRole` z hierarchią rang.
- **Backend `modules`/`channels`/`public-hub`:** bez zmian (PARTIAL).
- **Application-v2:** dodano `enableCommunityModule` use-case z authority check przez `CommunityAuthorityResolver`.
- **Shared contracts:** split na `communities.ts` (core types) + `communities-actions.ts` (input/result envelope), żeby utrzymać <15 eksportów per plik.
- **Frontend:** pełen MOCK_LOCAL_ONLY adapter z in-memory state, ekrany Profile/Manage (z osobnymi panelami w `manage/`), ModulesManage, PublicHubView, ChannelsView. Sześć tras community w `AppRouter.tsx`.
- **Testy:** 733 tests PASS, w tym 22 testy dla communities-v2 service + 6 dla application use-case + 28 dla communities frontend (Shell, Profile, Manage, Modules, Hub, Channels, Wizard).

## Status domen (po slice)

| Domena | Status | Notatka |
|---|---|---|
| communities-v2 | PARTIAL | + join lifecycle + members + categories + filtering |
| modules | PARTIAL | bez zmian |
| channels | PARTIAL | bez zmian |
| public-hub | PARTIAL | bez zmian |
| application-v2/use-cases | PARTIAL | + enableCommunityModule |

## Bramki (zweryfikowane)

- `pnpm check` ✓
- `pnpm lint` ✓
- `pnpm test` ✓ (733/733)
- `pnpm build` ✓ (Vite, 237 modules, ~437 kB JS)
- `pnpm rules:check` ✓
- `pnpm arch:check:v2` ✓
- `pnpm guards:all-local` ✓

## P0/P1/P2

- **P0:** brak.
- **P1:** brak.
- **P2:** brak HTTP transportu (TRANSPORT_PARTIAL — adapter mock-local). Persistence in-memory (BACKEND_PARTIAL — DB adapter docelowo).

## Następne 3 rekomendowane kroki

1. Slice 1 raport — pełen opis listy/kart/kreatora 1:1 (zob. `docs/review/communities-v2/SLICE_1_LIST_AND_CREATE_REPORT.md`).
2. Slice 2 (profil społeczności + join/request flow 1:1).
3. HTTP transport foundation dla communities + DB adapter (Supabase repository).
