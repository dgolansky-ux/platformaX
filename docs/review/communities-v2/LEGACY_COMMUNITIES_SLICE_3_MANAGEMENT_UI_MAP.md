# LEGACY COMMUNITIES — SLICE 3: MANAGEMENT UI MAP

Branch: feat/contacts-v2-clean-room-slice
Base commit (pre-slice3): 2370ac8
Legacy source: `C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities`

Cel: zinwentaryzować legacy UI zarządzania społecznością i oddzielić to, co przenosimy 1:1 wizualnie, od tego, co odrzucamy razem z runtime.

## 1. Trasy / ekrany

| Route                                  | Legacy plik                           | V2 plan |
|----------------------------------------|---------------------------------------|---------|
| `/communities/:id?tab=settings`        | `pages/CommunityDetailSettings.tsx`   | `/communities/:slug/manage` zakładka **Ustawienia** |
| `/communities/:id?tab=members`         | `components/CommunityMembersPanel*`   | `/communities/:slug/manage` zakładka **Członkowie** |
| `/communities/:id?tab=settings` (Members Visibility) | `components/MembersVisibilityPanel.tsx` | NIE w tym slice (Slice 4 / settings advanced) |
| `/communities/:id?tab=settings` (Feed) | `components/FeedSettingsPanel.tsx`    | NIE — feeds NIE w tym slice |
| `/communities/:id?tab=settings` (Stripe) | `components/StripeConnectPanel.tsx` | NIE — donations NIE |
| `/communities/:id/structure`           | brak osobnego pliku                   | placeholder przycisk; struktura NIE w tym slice |
| **Invites** (do społeczności)          | brak — legacy ma tylko invites do wydarzeń (`InviteMembersButton.tsx`) | foundation **nowa** w V2 (bez wysyłki maila) |

W V2 zostawiamy jeden route `/communities/:slug/manage` z lokalnymi tabami (state w komponencie, bez nowych route'ów) — zgodnie z konwencją legacy „tab as query param”.

## 2. Settings — kluczowe legacy elementy

`pages/CommunityDetailSettings.tsx`:
- karta **Struktura hierarchii** (Network ikona + „Zarządzaj strukturą”) — V2: placeholder/disabled, nie wdrażamy struktury.
- `FeedSettingsPanel` — NIE.
- `MembersVisibilityPanel` — NIE w tym slice (planowane w Slice 4 settings).
- `ModuleSettings` (settings modułów) — NIE.
- `StripeConnectPanel` — NIE.
- **Strefa niebezpieczna** (rounded-2xl `border-red-200 bg-red-50 p-4`, `AlertTriangle text-red-500`, „Usunięcie społeczności jest trwałe i nieodwracalne. Wszystkie posty, członkowie, moduły i dane zostaną bezpowrotnie usunięte.”, przycisk `Trash2` „Usuń społeczność na zawsze”) → V2: **foundation only**, soft-confirmation z input-name-match, ale `deleteCommunityMutation` nie istnieje w domain → disabled + truthful note.
- **Delete confirmation dialog** (modal `bg-black/60`, „Aby potwierdzić, wpisz nazwę społeczności”, input + Anuluj/Usuń na zawsze).

Brakuje w legacy podstawowego formularza name/description/visibility w settings tabie — V2 dodaje ten panel (pochodzi z create-community wizard).

## 3. Members panel — legacy 1:1

`components/CommunityMembersPanel.tsx` + `MemberRow.tsx`:

- **Admin limit info** (Owner widzi „Administratorzy: {N} / {limit}”, gdy at-limit → orange box + przycisk „Poproś o więcej →”). V2: NIE w tym slice (admin limit policy do Slice 4).
- **MemberRow**:
  - `Avatar` (40×40) z ringa `ring-2 ring-white shadow-sm`.
  - Nazwa: `firstName + lastName` lub fallback `name`.
  - **Email** (`text-xs truncate text-[var(--px-muted)]`) — **PII LEAK** — w V2 NIE pokazujemy email.
  - Crown 3.5 obok nazwy gdy owner.
  - Status `Zablokowany` (`text-[#EF4444]`) gdy `status === "banned"` — V2: ban poza zakresem.
  - Role badge:
    - owner: bg `rgba(245,158,11,0.1)` color `#D97706`, Crown.
    - admin: bg `rgba(30,79,216,0.08)` color `var(--px-primary)`, Shield.
    - moderator: bg `rgba(16,185,129,0.1)` color `#059669`, Shield.
    - member: bg `#F3F4F6` color `var(--px-muted)`.
  - Actions dropdown (MoreVertical, w52, align="end") jeśli `canActOnMember`:
    - „Mianuj administratorem” (ChevronUp, disabled gdy at-limit; V2: bez at-limit guard).
    - „Mianuj moderatorem” (Shield).
    - „Degraduj do członka” (ChevronDown).
    - separator.
    - „Usuń ze społeczności” (UserMinus, `text-destructive`).
    - „Zablokuj użytkownika” (Ban, `text-destructive`) — NIE w tym slice.
  - `ConfirmActionDialog` (`appoint_admin|appoint_moderator|demote|remove|ban`) — V2: prostsze confirm w `aria-modal` bez `window.confirm`.

## 4. Roles → V2

| Legacy | V2 (`CommunityRole`) | Notatki |
|--------|----------------------|---------|
| `owner` | `founder` | Crown amber, niezmienialny |
| `admin` | `admin`  | Shield niebieski |
| `moderator` | `moderator` | Shield zielony |
| `member` | `member` | szary |

## 5. Join requests — pending list

Legacy `pages/CommunityDetailActions.tsx:87-129` (pending requests w `card-px amber-500/[0.04]` z listą `Avatar + name + Akceptuj`):
- header: „Oczekujące prośby ({n})” z Clock ikoną.
- każdy req: `Avatar` (8×8), nazwa, `Akceptuj` (CheckCircle, bg `--px-success`).
- brak Odrzuć w legacy → V2 dodajemy Odrzuć jako sensible default (już istnieje w Slice 2/2.5).

V2: zachowujemy strukturę nagłówka „Prośby o dołączenie ({N})” + listę kart + Akceptuj/Odrzuć (oba przyciski).

## 6. Invites — foundation V2

Legacy NIE ma invites do społeczności (tylko do wydarzeń `InviteMembersButton`). Wprowadzamy w V2 czysty foundation:
- input: identyfikator zapraszanego (userId/email; PII chowane w manage DTO),
- przycisk „Wyślij zaproszenie”,
- lista pending (inviteeId, status, createdAt),
- akcja „Anuluj zaproszenie”,
- brak wysyłki email — status `INVITE_CREATED_NO_EMAIL_DELIVERY` w mock-adapter / raport.

## 7. Co przenosimy 1:1

- Layout sekcji manage: header + 4 zakładki/tab grupy (Ustawienia / Członkowie / Prośby / Zaproszenia).
- Card pattern (`rounded-2xl` z border + shadow w design tokens V2 — odpowiednik `card-px`).
- Strefa niebezpieczna (`border-red-200 bg-red-50 p-4`, AlertTriangle red-500, microcopy 1:1).
- Confirmation dialog dla usuwania społeczności: input-match-name (legacy: „Aby potwierdzić, wpisz nazwę społeczności”).
- MemberRow: avatar + name + role badge z Crown/Shield + actions dropdown (lista wpisów 1:1 minus Ban).
- Microcopy: „Mianuj administratorem”, „Mianuj moderatorem”, „Degraduj do członka”, „Usuń ze społeczności”, „Strefa niebezpieczna”, „Usunięcie społeczności jest trwałe i nieodwracalne”, „Oczekujące prośby ({N})”, „Akceptuj”, „Odrzuć”.
- Hover/focus: `hover:bg-gray-100`, `transition-colors`, focus-visible — wzorzec z legacy.

## 8. Co odrzucamy z legacy runtime

- `useCommunityDetail` (tRPC/Supabase/mutations) → mock-adapter.
- `toast` (sonner) — w V2 inline `actionError` zamiast toastów.
- `ImageEditOverlay`, `StaffDrawer`, `MembersCarousel`, `RingPost`, `FeedSettingsPanel`, `MembersVisibilityPanel`, `StripeConnectPanel`, `ModuleSettings`, `AdminDelegationPanel`.
- `RULE_EXCEPTION(id=1)` z `any` — w V2 nie używamy.
- `localStorage.setItem(modules-banner-dismissed-...)` — żaden localStorage backend.
- `window.confirm/alert` — w V2 dedykowany dialog z input-match.
- Ban member — poza zakresem.
- Admin limit + „Request more admins” — poza zakresem (foundation w Slice 4).
- Email w member row — NIE (PII).

## 9. PII / Security

- Members list DTO V2: `userId`, `displayName`, `role`, `joinedAt` — bez email/phone.
- Invites public DTO: id, status, createdAt, *target ref (userId)* — bez email.
- Invites manage DTO (founder/admin): może zawierać `inviteEmail` jeśli zaproszono po e-mail (foundation), tylko authorized.
- Manage view zwracana tylko gdy `canManage === true`; w innych przypadkach UNAUTHORIZED state.

## 10. Co świadomie NIE wdrażamy w Slice 3

- Ban member, admin limit + request-more-admins.
- Feed/members visibility settings (z legacy `FeedSettingsPanel`, `MembersVisibilityPanel`).
- Module settings, Stripe Connect, donations.
- Struktura / podspołeczności.
- Hard delete społeczności (foundation tylko — soft confirmation + disabled action, bez backend mutation).
- Email-sending dla invite.
- Audit ZIP.

## 11. Routing

Pozostajemy przy `/communities/:slug/manage` (jeden route + lokalne tabs/state). Manage CTA z profilu (Slice 2) prowadzi tutaj. Unauthorized → ładny state „Brak uprawnień” + back link do profilu (już istnieje, wzmacniamy).

## 12. Następna komenda po Slice 3

Slice 4 — struktura/podspołeczności + advanced settings (admin limit, members visibility, feed settings).
