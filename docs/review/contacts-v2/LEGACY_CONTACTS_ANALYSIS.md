# Legacy "Kontakty" → V2 — analysis & decisions

Status: `ACTIVE`
Branch: `feat/contacts-v2-clean-room-slice`
Source legacy folder: `C:\Users\dgola\Desktop\ze starego\kontakty.zip`
Extracted to (work copy, NOT committed): `/tmp/legacy-kontakty/platformax_legacy_contacts_extract/`

This document is a **clean-room** extraction: V2 inherits UX, flow names,
field labels, micro-copy and product logic from legacy, but **no
legacy runtime, hooks, tRPC routers, Drizzle schema, Supabase coupling
or auth wiring is copied into V2**. Legacy is treated as a reference
spec, not a code source.

## 1. Legacy files inspected

The vendored extract bundles its own legacy analysis under `docs/01-05`.
Those five documents are the authoritative reference for this slice; in
addition the following raw legacy files were opened to verify the
behaviour we re-implement:

- `docs/01_FRONTEND_MAP.md` — full UI inventory + tabs/sections.
- `docs/02_BACKEND_API_MAP.md` — every tRPC procedure in `contacts`,
  `friendships`, `person`.
- `docs/03_CONTACT_REQUEST_FLOW.md` — exact flow A→B request →
  accept → reveal selected fields.
- `docs/04_DB_SCHEMA_MAP.md` — legacy schema: `contacts`,
  `friendships`, `profile_contact_fields`, `profile_contact_permissions`,
  `contact_requests`.
- `docs/05_IMPLEMENTATION_NOTES_AND_BUGS.md` — 12 known bugs/risks.

Frontend (read for UI inventory; not copied):

- `legacy-source/client/src/features/social/pages/Contacts.tsx`,
  `Contacts.hooks.ts`, `ContactsFriendList.tsx`, `ContactsTierDropdown.tsx`
- `legacy-source/client/src/features/social/pages/ContactRequests.tsx`,
  `ContactRequestsAcceptModal.tsx`, `ContactPrivacySettings.tsx`
- `legacy-source/client/src/features/social/components/AddContactSheet.tsx`,
  `ConnectionsTab.tsx`, `ConnectionsTab.InviteForm.tsx`
- `legacy-source/client/src/features/identity/pages/PublicProfile.tsx`,
  `PublicProfileActionButtons.tsx`, `PublicProfileRequestModal.tsx`,
  `ManageEditProfileKontaktTab.tsx`, `ManageEditProfilePrivacyTab.tsx`
- `legacy-source/client/src/features/_shared/pages/FindPeople.tsx`,
  `Alerts.tsx`, `AlertsCards.tsx`, `BottomNav.tsx`

Backend (read for *shape* and *flow*; not imported):

- `legacy-source/server/domains/social/db/db-contacts.ts`
- `legacy-source/server/domains/social/db/db-friendships*.ts`
- `legacy-source/server/domains/social/routers/routers-contacts.ts`
- `legacy-source/server/domains/social/routers/routers-friendships.ts`
- `legacy-source/server/schemas/output/social/contacts.ts`
- `legacy-source/drizzle/schema/identity/profiles.ts`,
  `connections/tables.ts`, `social/posts.ts`

## 2. What is preserved (visually + as flow)

Visual / UX:

- The `/contacts` tab layout: sticky white header with the
  `Kontakty` H1, search input, `UserPlus` add-button.
- Two-row tab bar: family row (Rodzina bliska / Rodzina dalsza) +
  primary row (Znajomi / Kontakty / Specjaliści) — V2 starts with the
  primary row only, family row deferred (see §4).
- Friend card with avatar, name, tier label + dropdown, trash action.
- `Brak …` empty states with the same copy.
- Incoming friend-requests inline section inside the Znajomi tab.
- `/contact-requests` page with `Przychodzące` / `Wysłane` tabs and
  the `ContactRequestsAcceptModal` checkbox-list of fields to reveal.
- `/contact-privacy` two-toggle layout (`Znajomi widzą` /
  `Zatwierdzeni widzą`) per field.
- Micro-copy (Polish) kept verbatim where it fits in V2 components.

Flow / product logic:

- The four flows from `docs/03` — request, accept-with-selected-fields,
  reject, viewer reads only allowed fields — are preserved.
- `getVisibleContactFields(viewerId, ownerId)` semantics: owner sees
  everything; for any other viewer the pure policy joins three inputs
  — the owner's fields, the owner's per-field permissions, and the
  viewer's relationship state — and returns ONLY the fields that pass.

## 3. What is NOT copied

- Drizzle / Supabase / Postgres coupling. V2 uses repository ports
  with an in-memory implementation; persistence wiring is a future PR.
- tRPC routers. V2 exposes domain services + an application use-case;
  HTTP wiring is deferred (`MOCK_LOCAL_ONLY` adapter on the frontend).
- `Contacts.hooks.ts` and the rest of the legacy React Query / tRPC
  hook layer. V2 components consume the mock adapter directly.
- `friendRequestProcedure` rate-limiter middleware. Rate-limiting is
  an HTTP-transport concern and will be re-added with the transport.
- `contactsCache` / `friendsCache` (legacy `server/cache.ts`).
- `setRelationshipStatus`, `setShowStatusOnlyClose`, status feed —
  those are unrelated personal-status features bundled in the legacy
  `friendships` router; out of scope.
- `chat.checkAccess` and the chat-access bridge — chat is a separate
  domain; V2 will add a chat-access port later if/when chat ships.
- Tier / family-bliska / family-dalsza split — represented in the
  schema but UX-only deferred until the basic relations land.

## 4. Bugs / risks intentionally avoided

Numbered against `docs/05_IMPLEMENTATION_NOTES_AND_BUGS.md`:

| # | Legacy issue | V2 decision |
|---|---|---|
| 1 | `contacts` and `friendships` are out of sync; `getVisibleContactFields` checks `contacts.type === friend` instead of `friendships.status === accepted` | V2 makes friendship the ONLY source of truth for "is X my friend"; the address-book stores its own `contact`/`specialist` entries that do NOT impersonate friendship. |
| 2 | Double gate (`approvedFields[field] && perm.approved`) is product-confusing | Preserved as the intentional behaviour — owner privacy MUST override a per-request approval — but the UI is explicit about it (toggle copy: "Również jeśli ktoś dostał zgodę na to pole"). |
| 3 | `approvedFields` is `z.array(z.string())` with no enum | V2 uses a closed enum `ApprovedContactField` (`"phone" \| "emailContact" \| ...`); both contract type and runtime guard reject unknown values. |
| 4 | Duplicate / repeat requests after accepted/rejected unclear | V2 policy: at most ONE non-terminal request in a given direction at a time. After `accepted` no new request is created (caller already has access). After `rejected` a new request is allowed only by the original sender (NOT by the receiver) — receiver has effectively said no, the sender may try again. |
| 5 | `ContactRequests.tsx` JSX double `<p>` bug | New components written from scratch — bug cannot recur. |
| 6 | `getContacts` 30s cache not invalidated by `addContact/removeContact` | No backend cache in this PR; future transport may add cache + invalidation in a single layer. |
| 7 | `FindPeople` filters are UI-only | Out of scope for this slice — search lives in the `search` domain. |
| 8 | Sent requests render only `toUserId` | V2 use-case returns a full `SentContactRequestView` with `toUserName` / `toAvatar`. |
| 9 | `github` field stored but not in AcceptModal/permissions | V2 enum drops `github` from contact-request flow on purpose; profile may still store it but it is NOT a contact-request field. Documented under "Allowed approved fields" below. |
| 10 | `toggleShowFriendsMutation` in hook but no UI in Contacts | Not migrated. Show/hide friends is a separate concern; deferred. |
| 11 | `AddContactSheet` does not add `friend` | V2 keeps `friendship` and address-book strictly separate (see §1 above). Adding a friend is `sendFriendRequest`, NOT `addAddressBookContact`. |

## 5. Legacy concept → V2 domain map

| Legacy table / concept | V2 domain | V2 module |
|---|---|---|
| `profile_contact_fields` (private PII) | `identity` | `identity/contact-fields-{dto,policy,service,repository}.ts` |
| `profile_contact_permissions` (per-field visibility toggles) | `identity` | same as above (lives next to fields) |
| `contact_requests` (request for PII access) | `identity` (request owns PII reveal) + `application-v2/use-cases/contacts` (orchestration) | `identity/contact-requests-*` + use-case |
| `contacts` table (address-book / specialist tag) | `social` | `social/address-book-{dto,policy,service,repository}.ts` |
| `friendships` (accepted-friend relation) | `social` | `social/friendships-{dto,policy,service,repository}.ts` (subset: send/accept/reject/remove) |
| `getVisibleContactFields(owner, viewer)` | `application-v2/use-cases/contacts` | composes identity (fields+permissions) + social (relationship) |
| `/contacts` tab | frontend | `client/src/features-v2/social/contacts/` |
| `/contact-requests` page | frontend | same feature folder |
| Accept-fields checkbox modal | frontend | same feature folder |

## 6. CONTACTS LOGIC DECISION (required section per task spec)

- **Did legacy distinguish "contact request" from "friend invitation"?**
  YES — `contact_requests` (request-to-reveal-PII) and `friendships`
  (invite-to-friend) are separate concepts on separate tables with
  separate routers. V2 keeps this split.
- **Does V2 separate `contact_request` / `friendship` /
  `address_book` / `specialist`?** YES, four separate concepts:
  - `contact_request` (identity domain) — pending/accepted/rejected;
    accepted reveals selected PII fields.
  - `friendship` (social domain) — pending/accepted/rejected; tier
    metadata reserved for follow-up.
  - `address_book_contact` (social domain) — a one-sided saved entry
    in MY address book; no consent required from the other side, but
    it does NOT grant any PII access on its own.
  - `specialist_relation` (social domain) — same shape as
    address_book_contact but tagged `specialist`; UI-only category,
    again no PII implication.
- **Does friendship grant access to PII?** NO. Friendship is a
  *signal* that the owner CAN expose to friends via the
  `Znajomi widzą` toggle, but the toggle is OFF by default. A friend
  sees PII only when the owner has flipped that toggle for the
  specific field. This is the same intent the legacy code had via
  `permissions.<field>.friends`; V2 surfaces it as an explicit toggle.
- **Approved contact-field enum:** `phone`, `emailContact`,
  `instagram`, `facebook`, `whatsapp`, `telegram`, `linkedin`,
  `website`. Closed enum — `github` is intentionally OUT.
- **Re-request after rejected?** YES, but only by the original
  sender, and the previous `rejected` row stays for audit. A receiver
  who rejected cannot re-send (would feel like spam). Sender-side
  duplicate-pending in the same direction is blocked (`PENDING_DUPLICATE`).

## 7. Out of scope for THIS PR

- Family tiers (`family_close`, `family_distant`).
- Tier picker dropdown (`close`/`regular`/`family_close`/`family_distant`).
- "Wysłane prośby" search / pagination.
- `chat.checkAccess` integration.
- Real HTTP transport / Supabase persistence — frontend uses
  `MOCK_LOCAL_ONLY` adapter; backend uses in-memory repositories.
- Friend-of-friend visibility shortcuts.
- `showFriends` / `showSpecialists` public-profile toggles.
- Search (`findPeople`) — lives in the `search` domain.
- Alerts / BottomNav badge counts — will compose `getIncomingRequests`
  + `getIncoming{Friend,Contact}Requests` from this slice in a later
  PR.

These are explicit deferrals — every one of them is named here so the
status registry stays truthful (`BACKEND_PARTIAL`, `UI_SHELL_ONLY`,
`MOCK_LOCAL_ONLY`).

## 8. Owner clarification (2026-05-29) — circles un-deferred

The owner re-scoped the family/friend tiers (deferred in §3, §4 row 99 and
§7) back IN, but reframed them so they do NOT repeat the legacy bug where the
tier lived on the `friendships` row and conflated "label" with "relation".

Decision, as implemented:

- The four concepts stay independent (contact request / friendship /
  address-book / specialist), exactly as §6 already established.
- **Friend circles** (`close_friend`, `distant_friend`, `close_family`,
  `distant_family`, `none`) are now an **owner-local label** in the `social`
  domain — `ContactGroupEntry` keyed `(ownerId → personId)`. Setting a circle
  requires NO consent, does NOT create/alter a friendship, and grants NO PII.
  This is a deliberate departure from legacy `friendships.tier`: the label is
  decoupled from the mutual relation, which sidesteps legacy bug #1.
- The PII gate (`identity/contact-access-policy.ts`) is unchanged: it reads
  only `isFriend` + `acceptedContactRequest`. Circles are NOT an input, so by
  construction a circle label can never leak a field.
- The `/contacts` tab now renders the legacy eight sections: **Wszyscy /
  Kontakty / Specjaliści / Bliżsi znajomi / Dalsi znajomi / Bliska rodzina /
  Dalsza rodzina / Prośby**. A person may appear in several at once
  (e.g. friend + contact + close_family). The circle dropdown re-creates the
  legacy `ContactsTierDropdown` UX (labels: Bliższy/Dalszy znajomy, Rodzina
  bliska/dalsza).

New contract surface (`shared/contracts/contacts.ts`): `FriendCircle`,
`FRIEND_CIRCLE_VALUES`, `ContactGroupEntry`, `ContactPersonSummary`,
`ContactListItemDTO`; `ContactProfileRelationshipDTO` now exposes
`isMutualFriend` (renamed from `isFriend`) + `friendCircle`; `ContactsTabData`
gains `circles`. Still `BACKEND_PARTIAL` + `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`
— persistence/HTTP transport remain deferred.

### CONTACTS OWNER LOGIC

- Czy dodanie do kontaktów jest prywatnym skrótem bez zgody? **YES**
- Czy dodanie specjalisty jest prywatnym skrótem bez zgody? **YES**
- Czy znajomość wymaga obopólnej zgody? **YES**
- Czy prośba o kontakt dotyczy tylko ujawnienia danych kontaktowych? **YES**
- Czy kontakt/specjalista/friend/family labels NIE ujawniają PII same z
  siebie? **YES**
- Czy odtworzono legacy podział: kontakty / specjaliści / bliżsi znajomi /
  dalsi znajomi / bliska rodzina / dalsza rodzina? **YES**
