# SLICE 3 — Community Management (settings + members + roles + requests + invites)

- Branch: `feat/contacts-v2-clean-room-slice`
- Base commit (pre-slice3): `2370ac8`
- Status: `UI_SHELL_ONLY + MOCK_LOCAL_ONLY + BACKEND_PARTIAL + TRANSPORT_PARTIAL`
- Owner: Dawid

## 1. Legacy files analyzed

`C:/Users/dgola/Desktop/projekt/Starykod-4-extracted/PlatformaX/client/src/features/communities`:

- `pages/CommunityDetailSettings.tsx` (orchestrator settings tab — Structure / Feed / Members Visibility / Modules / Stripe / Danger Zone).
- `components/CommunityMembersPanel.tsx` + `CommunityMembersPanel.MemberRow.tsx` + `CommunityMembersPanel.Dialogs.tsx`.
- `pages/CommunityDetailActions.tsx` (pending join requests list).
- `components/InviteMembersButton.tsx` — uwaga: legacy ma invites **do wydarzeń**, NIE do społeczności. Foundation invites do społeczności wprowadzony w V2 jako nowy element zgodny z patternem.

Mapa szczegółowa: `docs/review/communities-v2/LEGACY_COMMUNITIES_SLICE_3_MANAGEMENT_UI_MAP.md`.

## 2. Co przeniesiono 1:1

- Tabbed manage layout (Ustawienia / Członkowie / Prośby / Zaproszenia / Strefa niebezpieczna) — odpowiednik legacy `?tab=…` na profilu, pivot 1:1 do dedykowanego route.
- MemberRow: avatar (initial) + display name + rola badge (Crown 👑 / Shield 🛡 / member ·) + akcje (Mianuj administratorem / Mianuj moderatorem / Degraduj do członka / Usuń).
- Kolory ról 1:1: founder amber, admin niebieski (`var(--c-primary)`), moderator zielony (`#059669`), member szary.
- Microcopy: „Mianuj administratorem”, „Mianuj moderatorem”, „Degraduj do członka”, „Usuń ze społeczności”, „Strefa niebezpieczna”, „Usunięcie społeczności jest trwałe i nieodwracalne. Wszystkie posty, członkowie, moduły i dane zostaną bezpowrotnie usunięte.”, „Aby potwierdzić, wpisz nazwę społeczności”, „Brak oczekujących zgłoszeń.”, „Akceptuj”, „Odrzuć”.
- Pending request panel z licznikiem („Prośby o dołączenie ({N})”).
- Danger zone box: `border-2 border-red-200 bg-red-50 p-4` + AlertTriangle + przycisk „🗑 Usuń społeczność na zawsze”.
- Confirmation dialog z input-match-name 1:1 (placeholder = nazwa, button disabled gdy nie pasuje).

## 3. Co odrzucono z legacy runtime

- `useCommunityDetail` (tRPC/Supabase/mutations) → `communitiesMockAdapter` (MOCK_LOCAL_ONLY).
- `toast` (sonner) — V2 ma inline `actionError`, brak floating toastów.
- Email w MemberRow (`<p>{member.email}</p>`) — **PII LEAK**, w V2 nigdy nie pokazujemy email członka.
- `Ban` member + `RequestMoreAdminsDialog` + admin limit (out of scope w Slice 3).
- `FeedSettingsPanel`, `MembersVisibilityPanel`, `ModuleSettings`, `StripeConnectPanel`, `StaffDrawer`, `AdminDelegationPanel`, `NewsletterSubscribeBanner` — wszystkie poza zakresem.
- Hard-delete + `deleteCommunityMutation` — w V2 Danger zone to **foundation only** (button disabled + TRANSPORT_PARTIAL note, bez fake save).
- `window.confirm/alert` — w V2 dedykowany inline confirmation flow.
- `RULE_EXCEPTION(id=1)` z `any` — nigdy.
- `localStorage` jako backend.

## 4. Ekran zarządzania — opis

```
Zarządzanie społecznością
{Nazwa społeczności}                    [← Wróć do profilu]
/slug · Publiczna/Prywatna

[ Ustawienia ] [ Członkowie ] [ Prośby ] [ Zaproszenia ] [ Strefa niebezpieczna ]

(zakładka — patrz niżej)
```

### Ustawienia
- pola: Nazwa (3–80), Opis (max 500), Widoczność (publiczna/prywatna).
- Save → `updateSettings` w domain + view refresh.

### Członkowie
- każdy wiersz: avatar (inicjał) + name + meta (od …) + role badge + actions (jeśli `canActOn`):
  - Founder: brak actions (badge tylko, Crown).
  - Admin: select role (admin/moderator/member) + Usuń (danger).
  - Moderator/member: jak admin, jeśli aktor jest founder/admin.
- akcje używają policy `canRemoveMember` (admin nie może ruszyć foundera ani siebie).

### Prośby
- lista pending (display name + data) + Akceptuj/Odrzuć.
- Empty: „Brak oczekujących zgłoszeń.”

### Zaproszenia (foundation)
- Form: userId lub email.
- Lista pending/cancelled/expired ze statusem badge.
- Cancel pending → status `cancelled`.
- TRANSPORT_PARTIAL note: invites są rejestrowane, e-mail nie wysyłany.

### Strefa niebezpieczna
- Card z `AlertTriangle` + microcopy 1:1 z legacy.
- Confirm flow: wpisz nazwę → final button **disabled** + `TRANSPORT_PARTIAL`.

## 5. Settings → backend
- `service.updateSettings` (founder/admin only) — istniejące, wzbogacone testami.

## 6. Members & roles → backend
- `service.listMembers` — gated to active members.
- `service.changeMemberRole` (policy: actor outranks both current i target role; founder protected).
- `service.removeMember` **(NEW)** — self-remove forbidden, founder protected, admin musi outrank target. Adapter mock-only.

## 7. Join requests → backend
- `service.listPendingJoinRequests` (founder/admin only).
- `service.acceptJoinRequest` / `rejectJoinRequest` — istniejące.

## 8. Invites → backend (foundation)
- Nowy `InviteRepository` + `InviteRecord` w `ports.ts` + `store.ts` (in-memory).
- `service.createInvite` (founder/admin only, target = userId lub email, duplicate-pending blocked).
- `service.cancelInvite` (founder/admin only, pending only).
- `service.listInvitesForManage` (founder/admin, manage DTO z `invitedEmail`).
- `service.listInvitesPublic` (każdy, public DTO **bez** `invitedEmail`).
- `service.ts` ma optional `invites?: InviteRepository` w deps — gdy brak, zwraca `INVITES_NOT_CONFIGURED` (truthful, no fake).

## 9. Co realnie podpięte do backendu

- Frontend: NIE — używa `communitiesMockAdapter` (MOCK_LOCAL_ONLY).
- Domena (`server/domains-v2/communities-v2`) ma cały surface: settings/members/roles/remove/requests/invites.
- Application use-case dla manage view + akcji — gotowe i przetestowane.
- HTTP transport — Slice 4+/transport-slice.

Status: `BACKEND_PARTIAL + UI_SHELL_ONLY + TRANSPORT_PARTIAL`.

## 10. UI_SHELL_ONLY / TRANSPORT_PARTIAL details

- Manage UI jest funkcjonalne against mock-adapter (round-trip change role / remove / accept / invite / cancel invite).
- Invites: brak email delivery — explicit `TRANSPORT_PARTIAL` note widoczne w panelu.
- Hard delete: button disabled + transport note.

## 11. Co świadomie NIE wdrażamy

- Ban member (legacy `ban` action).
- Admin limit + „Poproś o więcej adminów”.
- Feed settings, Members visibility, Module settings, Stripe Connect, donations.
- Subcommunities / structure (placeholder w Slice 4).
- Hard delete społeczności (foundation only).
- Email-sending dla invite.
- 3 feedy / RingPost / chat / events / komentarze.
- Audit ZIP.

## 12. Test evidence

- Backend `server/domains-v2/communities-v2`: **39/39** PASS (35 service + 4 contract). Nowe testy: removeMember (×2), invites (×5 — create/duplicate/cancel/public-no-email/manage-gated).
- Application `server/application-v2/use-cases/communities`: **13/13** PASS. Nowe: getCommunityManageView gating + composition, manage flow round-trip (role/remove/accept/invite/cancel).
- Frontend `client/src/features-v2/communities-v2`:
  - `CommunityManageShell.test.tsx`: **8/8** PASS (hero + tabs, forbidden, accept request, settings update, member remove, invite create+cancel, danger zone disabled, no `@server/*` import).
- Razem communities-v2: **90/90** PASS (`npx vitest run client/src/features-v2/communities-v2 server/domains-v2/communities-v2 server/application-v2/use-cases/communities`).
- Pełna suita: **768/768** PASS.

## 13. Guard evidence

- `pnpm check` PASS (tsc --noEmit).
- `pnpm lint` PASS (eslint --max-warnings=0).
- `pnpm build` PASS (vite build, 452.38 kB / gzip 134.25 kB).
- `pnpm rules:check` PASS (RULES_CHECK_PASS / L2_GUARD_SCRIPTS_READY).
- `pnpm arch:check:v2` PASS (ARCH_CHECK_V2_PASS).
- `pnpm guards:all-local` PASS (scalability, frontend perf, status truth, dependency discipline, logging PII security).
- `check-code-quality-structure` PASS (po wyniesieniu invite/viewer DTO do sibling modules i skrócie service.ts via bridge — service.ts: 235 LOC).
- `check-dto-privacy-classification` PASS (dto-viewer.ts ma klasyfikację Public DTO).

## 14. P0 / P1 / P2

- **P0**: brak.
- **P1**: brak.
- **P2**:
  - Invite email delivery (TRANSPORT_PARTIAL note widoczny).
  - Hard delete społeczności (Danger zone disabled — foundation).
  - Ban member (legacy ma, V2 OOS).
  - Admin limit + „request more admins”.
  - Feed/MembersVisibility/Modules settings panels — Slice 4 advanced settings.

## 15. Architecture / DTO / PII

- `CommunityMemberSummaryDTO`: nadal bez email/phone (brak zmiany).
- `CommunityInvitePublicDTO`: bez `invitedEmail`. Asercja w teście „CommunityInvitePublicDTO carries no invitedEmail”.
- `CommunityInviteManageDTO`: zawiera `invitedEmail`, wystawiane wyłącznie przez `service.listInvitesForManage` (gated to founder/admin) i `service.createInvite`/`cancelInvite`.
- ManageView UC blokuje nieautoryzowanych (`FORBIDDEN`) — test gating.
- `removeMember`: founder protected (legacy 1:1 — admin nie usunie foundera), self-removal forbidden.

## 16. Następna rekomendowana komenda

**Community Slice 4 — struktura/podspołeczności + advanced settings** (admin limit + request-more-admins, members visibility, feed settings panel, structure breadcrumb, parent community linking) 1:1 z legacy `CommunitySettingsPage` + `MembersVisibilityPanel` + `FeedSettingsPanel` + structure flow.
