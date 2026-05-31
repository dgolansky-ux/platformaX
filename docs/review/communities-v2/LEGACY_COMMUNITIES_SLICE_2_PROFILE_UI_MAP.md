# LEGACY COMMUNITIES — SLICE 2: PROFILE & JOIN UI MAP

Branch: feat/contacts-v2-clean-room-slice
Commit (pre-slice2): 8db42b6
Legacy source: `C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities`

Cel: zinwentaryzować legacy UI profilu społeczności, oznaczyć co przenosimy 1:1 wizualnie, a co odrzucamy razem z runtime.

## 1. Trasy / ekrany

| Route                                  | Legacy plik                         | V2 plan |
|----------------------------------------|-------------------------------------|---------|
| `/communities/:id`                     | `pages/CommunityDetail.tsx`         | `/communities/:slug` (już istnieje) |
| `/communities/:id/settings`            | `pages/CommunitySettingsPage.tsx`   | `/communities/:slug/manage` (NIE w tym slice) |
| `/communities/:id/members`             | `pages/CommunityMembersPage.tsx`    | NIE w tym slice |
| `/communities/:id/structure`           | n/d (placeholder w InfoSection)     | NIE w tym slice |
| `/communities/:id/moderation`          | `pages/CommunityModerationPage.tsx` | NIE w tym slice |
| `/communities/:id/modules`             | `pages/CommunityModulesPage.tsx`    | NIE w tym slice |
| `/communities/:id/reminders`           | `pages/CommunityRemindersPage.tsx`  | NIE w tym slice |

Slice 2 dotyczy wyłącznie publicznego profilu i join/leave/request/cancel.

## 2. Profil społeczności — kluczowe legacy pliki (orchestrator → fragmenty)

- `pages/CommunityDetail.tsx` (340 LOC) — orchestrator (runtime: hook `useCommunityDetail`, tabs, modules sheet, settings, broadcast, RingPost, feed). NIE przenosimy.
- `pages/CommunityDetailHeader.tsx` — cover banner + avatar (z orbit ring) + nazwa + Crown dla owner + chipy visibility/members + back button + StaffDrawer + Newsletter banner.
- `pages/CommunityDetailInfoSection.tsx` — breadcrumb (depth>0), MembersCarousel, 4 kafelki shortcut modułów (animowane), depth/path.
- `pages/CommunityDetailActions.tsx` — tagi, Dołącz/Poproś o dostęp/Pending/Opuść, pending requests list (owner widzi).
- `pages/CommunityDetailSettings.tsx` — settings tab. NIE.
- `pages/CommunityDetailModuleTabs.tsx`, `CommunityDetailCoreTabBar.tsx`, `CommunityDetailModulesSheet.tsx`, `CommunityDetailBroadcast.tsx`, `content/pages/CommunityDetailFeedTab.tsx` — moduły/feed/broadcasts. NIE.

## 3. Strukturalne elementy profilu (legacy → V2)

### 3.1 Hero / Header
- Cover banner (aspect 3/1 mobile, 4/1 desktop, fallback gradient z `coverGradient`).
- Subtle dark gradient overlay (`from-black/30 to-transparent`) dla czytelności tekstu.
- Back button: `top-3 left-3`, kółko `bg-black/30 backdrop-blur-sm`, ikona `ArrowLeft` (lucide), `→ /communities`.
- Chip widoczności w prawym dolnym rogu banera: `<Lock|Globe>` + "Prywatna"/"Publiczna" w `bg-black/40 backdrop-blur-sm`.
- Chip licznika członków: `<Users size=10>` + memberCount.
- Avatar circle (124px) z orbit-ring SVG (animacja `community-orbit-ring`, 12s linear), `boxShadow: 0 8px 32px rgba(15,60,201,0.28)`. Fallback: gradient + ikona `Hash`.
- Crown (lucide) obok nazwy gdy `isOwner` (`text-amber-400`, kolor złoty).
- Mały `Network` icon gdy `depth > 0` (podspołeczność).
- Wizytówka kafelek (animowany ring + `Sparkles`) — kreator stron. NIE w tym slice (osobny modul).
- Bio: inline-edit (CommunityInlineEditBio) → V2: czytelny opis (read-only w Slice 2; edit w manage).

### 3.2 Info section
- Breadcrumb gdy `depth > 0`: "Społeczności › Poziom 1 › … › {name}" (chevrony lucide).
- MembersCarousel — visible according to `membersVisibility` rule. NIE w tym slice (placeholder count w hero).
- 4 kafelki shortcut (`Tematy`, `Baza wiedzy`, `Struktura`, `Dysk`) — animowane gradienty. NIE w tym slice (moduły).

### 3.3 Actions
- Tags (chipy `tag-gray`).
- CTA:
  - Stranger / public: `Dołącz` (lucide `UserPlus`).
  - Stranger / private: `Poproś o dostęp` (lucide `UserPlus`).
  - Pending: badge `Clock` + "Prośba oczekuje na akceptację" w `bg-amber-500/[0.08] border border-amber-500/20`. Legacy NIE miało "Anuluj prośbę" w tym widoku — dodajemy w V2 jako sensowny default (tylko requester może anulować).
  - Active member (nie-owner): `Opuść` (`btn-ghost`, `text-error`).
  - Owner: brak CTA — Crown w nagłówku, Zarządzaj wchodzi w settings (tab w legacy, route w V2).
- Pending requests (owner widzi listę z avatarami + Akceptuj). NIE w tym slice (manage).

### 3.4 States
- Loading: spinner + "Ładowanie..." (DesktopLayout).
- Not found: "Społeczność nie istnieje" + Button "Wróć" → `/communities`.
- Restricted private (brak dostępu): w legacy nie było jawnego "restricted" — prywatne community renderowało profile, ale ukrywało feed/posty. W V2 zachowujemy: profil widoczny, ale sekcje prywatne (np. członkowie/feed) — placeholder restricted note.

## 4. Co przenosimy 1:1 (czyste presentational)

- Layout hero: cover banner z aspect-ratio + overlay + back button + chipy widoczność/członkowie.
- Avatar z orbit-ring (124px, gradient fallback, `Hash` ikona, animacja orbit).
- Crown obok nazwy gdy owner.
- Network icon gdy `depth>0` (placeholder — w V2 nie wdrażamy struktury; tylko visual).
- Visibility chip (Lock/Globe + "Prywatna"/"Publiczna").
- Member count chip (`Users` + liczba).
- Tags chips.
- CTA: `Dołącz` / `Poproś o dostęp` / "Prośba oczekuje na akceptację" / `Opuść` — identyczne kolory, ikony lucide, mikrocopy 1:1.
- Mikrocopy: "Społeczność nie istnieje", "Ładowanie…", "Prośba oczekuje na akceptację", "Wróć".
- Tokens / klasy: `var(--px-primary)`, `var(--px-warning)`, `var(--px-error)`, `var(--px-muted)`, `var(--px-border)`, `var(--px-background)`, `var(--px-surface)`, `var(--px-dark)`.
- Animacje: `animate-fadeInUp`, orbit ring `community-orbit-rotate 12s linear`.
- Hover/focus: `hover:shadow-lg`, `active:scale-95`, focus-visible — wzorzec z legacy.
- Mobile: `aspectRatio: 3/1` mobile, `4/1` desktop; `minHeight: 130/160`.

## 5. Co odrzucamy z legacy runtime

- `useCommunityDetail` hook (tRPC, query, mutations) — V2 używa `communitiesMockAdapter` (MOCK_LOCAL_ONLY) i appki use-cases.
- `ImageEditOverlay` (base64 upload do Supabase) — w V2 banner/avatar to gradient fallback / readonly URL, bez uploadu w Slice 2.
- `StaffDrawer` (Modules/Moderation/Settings/Delegation runtime panel) — V2 ma osobny route `/manage` (Slice 3).
- `NewsletterSubscribeBanner` (modules side effect) — NIE.
- `MembersCarousel` z realnym fetchem (PII risk) — NIE w tym slice.
- 4 kafelki shortcut z animacjami i side-effectami (`setActiveModuleView`, `setShowModulesSheet`) — NIE.
- `CommunityInlineEditBio` (inline mutation save) — read-only opis w profilu.
- `RingPostTab`, `CommunityDetailFeedTab`, `TopicsTab`, `RemindersTab`, `CommunityDetailBroadcast`, `AdminDelegationPanel`, `CommunityDetailSettings` — NIE w tym slice.
- `localStorage.setItem(modules-banner-dismissed-...)` — żadnego localStorage backendu.
- `RULE_EXCEPTION(id=1)` z `any` (CommunityDetailActions.tsx:95) — NIE kopiujemy.
- Inline `<style>{...}`-injection w runtime (orbit/tile/icon animations) — w V2 to CSS module.

## 6. Viewer state — mapowanie

| Legacy                         | V2 (`CommunityViewerRelation`) | UI w hero |
|--------------------------------|-------------------------------|-----------|
| `!user` (anon)                 | (logged-out — Slice 2 OOS)   | CTA disabled + login hint (niewdrażane: zakładamy logged-in fixture) |
| `!membership` (stranger)       | `not_member`                  | "Dołącz" (public) / "Poproś o dołączenie" (private) |
| `membership.status==="pending"` | `requested`                  | "Oczekuje na akceptację" + "Anuluj prośbę" (V2 dodaje) |
| `membership.role==="member"`   | `member`                      | "Jesteś członkiem" + "Opuść" |
| `membership.role==="moderator"` | `moderator`                  | "Jesteś członkiem" + "Opuść" |
| `membership.role==="admin"`    | `admin`                       | "Zarządzaj" + "Opuść" |
| `membership.role==="founder"`  | `founder`                     | "Zarządzaj" + (brak "Opuść" jeśli sole founder — policy V2) |

## 7. Join/Request/Cancel/Leave — flow w V2

1. **Dołącz** (`public`): `joinCommunity(slug)` → `member`.
2. **Poproś o dołączenie** (`private`): `requestJoinCommunity(slug)` → `requested`.
3. **Anuluj prośbę** (`requested`): `cancelJoinRequest(slug)` → `not_member`. (V2: tylko requester.)
4. **Opuść społeczność** (member/moderator/admin): `leaveCommunity(slug)` → `not_member`. Founder NIE może opuścić jeśli jest jedynym founderem (policy V2).
5. **Zarządzaj** (founder/admin): link `→ /communities/:slug/manage`.

Duplicate pending blocked. Acceptance/rejection — NIE w tym slice (Slice 3).

## 8. Bezpieczeństwo / PII

- Public profile DTO: NO email/phone/dateOfBirth. Tylko id/slug/name/description/visibility/memberCount/avatarRef/bannerRef/categorySlug.
- Viewer state DTO: viewerUserId optional ref, relation + boolean flags (`canJoin`, `canRequestJoin`, `canCancelRequest`, `canLeave`, `canManage`, `canViewPrivateSections`). Brak raw membership/PII.
- Restricted private: profil widoczny dla wszystkich, ale prywatne sekcje (members list, hub) zwracają FORBIDDEN — viewer state ma `canViewPrivateSections=false`.

## 9. Co świadomie NIE wdrażamy w Slice 2

- Modules / feeds / channels / chat / events / RingPost / Topics / Reminders / Broadcast.
- MembersCarousel z PII.
- Settings (manage).
- Pełne zarządzanie członkami / rolami.
- Structure / subcommunities (tylko placeholder Network icon, bez funkcji).
- Image upload (banner/avatar).
- Logged-out flow CTA (zakładamy logged-in fixture).
- Newsletter banner.
- Audit ZIP.

## 10. Następne kroki

Slice 3: zarządzanie społecznością (settings, członkowie, role, akceptacje pending requests) — manage route z tabami 1:1 z legacy.
