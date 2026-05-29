# SLICE 2 — Community Profile + Join/Request flow

- Branch: `feat/contacts-v2-clean-room-slice`
- Base commit (pre-slice2): `8db42b6`
- Status: `UI_SHELL_ONLY + MOCK_LOCAL_ONLY + BACKEND_PARTIAL` (TRANSPORT_PARTIAL — frontend nadal nie ma HTTP)
- Owner: Dawid

## 1. Legacy files analyzed

Stary kod profilu społeczności w `C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities`:

- `pages/CommunityDetail.tsx` (orchestrator)
- `pages/CommunityDetailHeader.tsx` (banner + avatar + orbit ring + crown + chips)
- `pages/CommunityDetailActions.tsx` (Dołącz/Poproś o dostęp/Pending/Opuść + lista pending)
- `pages/CommunityDetailInfoSection.tsx` (breadcrumb + members carousel + 4 tiles)
- `pages/CommunityDetail.hooks` (referencyjnie — runtime tRPC/Supabase, NIE kopiowany)

Mapa szczegółowa: `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_2_PROFILE_UI_MAP.md`.

## 2. Co przeniesiono 1:1 wizualnie

- Hero: cover banner z gradientem fallback + overlay przyciemniający + chip „Publiczna/Prywatna” + chip licznika członków w prawym dolnym rogu + back-button w lewym górnym.
- Avatar 124×124 z animowanym orbit-ring (SVG `path` + `animation: communityOrbitRotate 12s linear`), gradient fallback, inicjał — odpowiednik starego `ImageEditOverlay` bez uploadu.
- Crown (👑) obok nazwy, gdy viewer jest founderem.
- Mikrocopy + układ CTA: `Dołącz do społeczności`, `Poproś o dołączenie`, „Prośba oczekuje na akceptację” (chip `amber-500/8 + border amber-500/20`), `Opuść`, `Zarządzaj`, „Jesteś członkiem” (chip `primary-soft`).
- Breadcrumb „Społeczności › {nazwa}” (placeholder pod przyszłe parent communities).
- Mobile-first: `aspect-ratio: 3/1` mobile, `4/1` desktop, kolumnowy układ poniżej 720px.
- Subnav: Public Hub / Kanały / „← Wróć do listy”.

## 3. Co odrzucono z legacy runtime

- `useCommunityDetail` (tRPC/Supabase, mutacje, query) → adapter `communitiesMockAdapter` (MOCK_LOCAL_ONLY).
- `ImageEditOverlay` (base64 upload do Supabase) → readonly avatar/banner z gradientami.
- `StaffDrawer` (Modules/Moderation/Settings/Delegation w runtime) → `Zarządzaj` route placeholder (Slice 3).
- `MembersCarousel`, `NewsletterSubscribeBanner`, kafelki modułów (z animacjami + side-effects), `RingPostTab`, `CommunityDetailFeedTab`, `TopicsTab`, `RemindersTab`, `CommunityDetailBroadcast`, `AdminDelegationPanel`, `CommunityDetailSettings`.
- `localStorage.setItem(modules-banner-dismissed-...)` — żadnego localStorage backendu.
- `RULE_EXCEPTION(id=1)` z `any` z `CommunityDetailActions.tsx:95` — w V2 nie używamy `any`.
- Inline `<style>{...}` injekcja w runtime — animacje przeniesione do CSS module.

## 4. Jak wygląda profil społeczności

```
Społeczności › {nazwa}
┌──────────────────────────────────────────────┐
│  ← (banner gradient + overlay)        🌐/🔒  │
│                                       👥 N   │
│   ⓐ ⟳        {nazwa}  👑(jeśli founder)      │
│   /slug                                       │
│                                               │
│   {opis}                                      │
│                                               │
│   [Zarządzaj]   /  [Dołącz do społeczności]   │
│   [Jesteś członkiem] [Opuść]                  │
│   [⏳ Prośba oczekuje]  [Anuluj prośbę]        │
│   🔒 Treści tej prywatnej…                    │
└──────────────────────────────────────────────┘
[ Public Hub ] [ Kanały ]            ← Wróć
```

## 5. Viewer states

| Relacja                | CTA                                              | Sekcje prywatne |
|-----------------------|--------------------------------------------------|-----------------|
| `unauthenticated`     | wszystkie disabled (Slice 2 zakłada logged-in)    | tylko publiczne |
| `stranger` (public)   | „Dołącz do społeczności”                          | widoczne        |
| `stranger` (private)  | „Poproś o dołączenie” + restricted note           | ukryte          |
| `pending_request`     | „⏳ Prośba oczekuje na akceptację” + „Anuluj prośbę” | jak wyżej   |
| `member` / `moderator` / `admin` (non-manager) | „Jesteś członkiem” + „Opuść”      | widoczne |
| `admin` (manage)      | „Zarządzaj”                                       | widoczne        |
| `founder`             | „Zarządzaj” (brak „Opuść” gdy sole-founder)       | widoczne        |

## 6. Join/Request/Cancel/Leave

- `joinCommunity(slug)` — public: dołączenie atomowe, view państwa → `member`.
- `requestJoin(slug)` — private/unlisted: tworzy pending request, view → `pending_request`.
- `cancelJoinRequest(slug)` — wyłącznie requester; w domain join request → status `cancelled`.
- `leaveCommunity(slug)` — usuwa membership; sole founder → `FORBIDDEN` z mikrocopy.

Backend (domain):
- `service.joinCommunity` – odrzuca prywatne (`JOIN_REQUIRES_APPROVAL`).
- `service.cancelJoinRequest` – sprawdza ownership; tylko `pending`.
- `service.leaveCommunity` – chroni „last founder” (`FOUNDER_CANNOT_LEAVE`).
- `service.getViewerState` – derived flags (no PII / no raw membership).

Application use-case (`server/application-v2/use-cases/communities`):
- `getCommunityProfileView(slug, viewerUserId)` – composes public DTO + viewer state.
- `getCommunityViewerState`, `joinCommunity`, `requestJoinCommunity`, `cancelJoinRequest`, `leaveCommunity` – cienkie wrappery wokół domeny (foundation pod HTTP).

## 7. Co realnie podpięte do backendu

- Frontend: NIE — używa wyłącznie `communitiesMockAdapter` (MOCK_LOCAL_ONLY, in-memory).
- Mock adapter ma teraz: `getCommunityProfileView`, `joinCommunity`, `requestJoin`, `cancelJoinRequest`, `leaveCommunity` z polityką (sole founder, duplicate pending, only-requester-can-cancel).
- Domena (`server/domains-v2/communities-v2`) + use-case są gotowe i pokryte testami. Transport HTTP — nadal Slice 3+/inny.

Status: `BACKEND_PARTIAL + UI_SHELL_ONLY + TRANSPORT_PARTIAL`.

## 8. Co świadomie NIE jest wdrażane teraz

- modules (kafelki shortcut, modules sheet),
- 3 feedy / RingPost / kanały (poza istniejącą podstroną `/channels` z poprzednich slice'ów),
- subcommunities / structure,
- full members management (Slice 3),
- full settings (Slice 3),
- chat,
- wydarzenia,
- pełny `/manage` (placeholder z linkiem do osobnego widoku z poprzedniego slice'a),
- audit ZIP,
- HTTP transport / Supabase.

## 9. Test evidence

- Backend `server/domains-v2/communities-v2`: **32/32** PASS (28 service + 4 contract). Nowe: `joinCommunity` ×3, `cancelJoinRequest`, `leaveCommunity` ×3, `getViewerState` ×4.
- Application `server/application-v2/use-cases/communities`: **11/11** PASS. Nowe: `getCommunityProfileView` + composition + `joinCommunity / requestJoinCommunity / cancelJoinRequest / leaveCommunity` round-trips.
- Frontend `client/src/features-v2/communities-v2/__tests__/CommunityProfileShell.test.tsx`: **10/10** PASS. Pokrywa founder Zarządzaj, stranger Dołącz → członek, prywatna request → pending → cancel, leave dla member, restricted note, sole-founder bez Opuść, no-`@server/*` import.
- Razem dla communities-v2: **77/77** PASS (`npx vitest run client/src/features-v2/communities-v2 server/domains-v2/communities-v2 server/application-v2/use-cases/communities`).

## 10. Guard evidence

Patrz sekcja 12 — bramki uruchomione po commicie. W tym dokumencie odnotowano: `wc -l` dla service.ts / policy.ts / dto.ts / CSS module (poniżej limitów: 240/240/—/320 LOC).

## 11. P0 / P1 / P2

- P0: brak.
- P1: brak — viewer state w mock adapterze odzwierciedla rule „last founder cannot leave”, brak fake save, brak PII leak.
- P2:
  - Logged-out flow (anon viewer) na froncie — pominięte (Slice 2 zakłada logged-in fixture). DTO `unauthenticated` jest gotowe po stronie domain/use-case.
  - Realny avatar/banner upload — nie w tym slice (Slice 3+/media storage).
  - Parent community breadcrumb — placeholder; pełna struktura w Slice 4+.
  - HTTP transport łączący frontend z domain — Slice 3+ (manage) lub osobny transport-slice.

## 12. Architecture / DTO / PII

- Public DTO (`CommunityPublicDTO`) — brak `email/phone/founderUserId`. Asercja w teście `public community DTO carries no PII / founder id` (już istniała) + nowa: `getViewerState DTO carries no PII`.
- ViewerState DTO — booleany derive, viewerUserId optional. Brak raw membership/PII.
- Restricted private — `canViewPrivateSections` ukrywa Public Hub / Kanały i pokazuje note „Treści tej prywatnej społeczności są widoczne wyłącznie dla członków”.
- Frontend NIE importuje `@server/*` (test enforce + depcruise/eslint).

## 13. Następna rekomendowana komenda

**Community Slice 3 — zarządzanie społecznością: settings, members, roles, join requests 1:1.**
Powinien:
- przenieść 1:1 layout settings + members panel + join-requests acceptance z legacy `CommunitySettingsPage` / `CommunityMembersPanel.*` / `CommunityDetailActions` (pending list),
- dopiąć `acceptJoinRequest`/`rejectJoinRequest`/`changeMemberRole` (już istnieją w backendzie) do UI,
- dodać policy „last founder transfer” (i CTA „Przekaż founder").
