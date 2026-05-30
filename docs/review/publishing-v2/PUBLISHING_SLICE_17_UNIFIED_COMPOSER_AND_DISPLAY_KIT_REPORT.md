# Publishing Slice 17 — Unified Composer + Post Display Kit (Report)

Status: READY_FOR_PRODUCT_REVIEW
Branch: `feat/contacts-v2-clean-room-slice` · Working SHA: 429f0372 (pre-commit)
Date: 2026-05-30

---

## 1. Legacy files reviewed

This repo is the clean-room V2; no `legacy/` source tree is checked in here.
The slice was therefore built from:

- The slice 17 task brief sections 13–16, 25 (UX intent owners signed off on).
- The legacy UX intent captured in
  [LEGACY_PUBLISHING_AND_POST_DISPLAY_UI_MAP.md](./LEGACY_PUBLISHING_AND_POST_DISPLAY_UI_MAP.md)
  — see that file for the explicit
  `TAKE_1_TO_1_UI` / `TAKE_LOGIC` / `REBUILD_CLEAN_ROOM` / `REJECT_LEGACY_RUNTIME` decisions.
- The existing per-target V2 use-cases:
  - `server/application-v2/use-cases/friend-feed/*`
  - `server/application-v2/use-cases/community-feeds/*`
  - `server/application-v2/use-cases/channel-content/*`
  - `server/application-v2/use-cases/workplace-feed/*`

Legacy inventory status: `PARTIAL_LEGACY_SOURCE_MISSING` (no legacy source in
this working copy). Implementation map is in the LEGACY_*.md above.

## 2. What was carried over from legacy UI

- Composer placeholder tones per target (Friend ↦ "Co u Ciebie?", Channel ↦
  "Opublikuj wpis na kanale…", Workplace ↦ "Co nowego w pracy?", Important
  event ↦ title-first card, Profile presentation ↦ editorial).
- Visibility verbs (Tylko znajomi / Publiczne / Prywatne / Tylko kadra /
  Obserwujący / Miejsce — znajomi / Wpis relacyjny / Wg ustawień profilu).
- Visual logic for friend-feed post card layout, workplace teaser as a
  compact card pointing at the full workplace post, and the "Ważne
  wydarzenia" date-pill-led card distinct from a normal post.

## 3. What was rejected from legacy runtime

- Legacy `tRPC` / Supabase coupling, legacy hooks for composer state, and
  any direct `localStorage` / `sessionStorage` reads.
- `window.alert` / `window.confirm` — composer errors render inline.
- `readAsDataURL` / base64 media — V2 uses `mediaRefs` only.
- "Publish-everything" monolith — V2 keeps per-target use-cases.

## 4. Publishing Core (how it works)

`server/application-v2/use-cases/publishing/` — one tiny facade
(`createPublishingService`) and seven files for clarity:

- `contracts.ts` — `PublishingCommand`, `PublishingResult`,
  `PublishingPreview`, `PublishingTargetDefinition`, `PUBLISHING_LIMITS`.
- `registry.ts` — `createPublishingTargetRegistry` enumerates every target
  the viewer can see, with a truthful `status` + `blockedReason`.
- `preview.ts` — `buildPublishingPreview` packs a viewer-safe preview.
- `service.ts` — dispatcher. Owns:
  - validation (idempotency key, important-event title+date);
  - per-target routing into the right per-target use-case;
  - LRU idempotency cache so the same command never double-publishes.
- `targets/friend-feed.ts`, `targets/community-feed.ts`,
  `targets/channel.ts`, `targets/workplace.ts` — orchestrators on top of
  the existing target use-cases.
- `targets/important-event.ts`, `targets/profile-presentation.ts` —
  truthful PARTIAL stubs (no backend in V2 yet).

The dispatcher imports each target through its own `public-api`. There is
NO god-service: every per-target use-case still does its own work.

## 5. Composer variants (how they work)

`client/src/features-v2/publishing/`:

- `PublishingComposerCore.tsx` — shared shell (target/visibility/body/media/
  preview/submit/result block).
- `composers/*` — one file per variant: `FriendFeedComposer`,
  `CommunityFeedComposer` + `StaffFeedComposer` + `RelationalFeedComposer`,
  `ChannelComposer`, `WorkplaceComposer`, `ImportantEventComposer`,
  `ProfilePresentationComposer`. Each variant supplies its placeholder,
  title, subtitle, submit label, optional title/date fields and a visual
  accent (`composerVariant*` CSS class).
- `hooks/usePublishingTargets`, `hooks/usePublishingPreview`,
  `hooks/usePublishCommand` — one concern each.
- `mock-adapter.ts` — MOCK_LOCAL_ONLY transport with the same envelope
  shape; idempotency cache mirrors the server LRU.

## 6. Target Publishing Registry (how it works)

`getAvailablePublishingTargets({ viewerUserId, now })` returns a stable
ordered list:

1. `friend_feed` (always available for a logged-in viewer).
2. For every community the viewer belongs to, three target definitions
   (`community_feed`, `community_staff_feed`, `community_relational_feed`),
   with `feedEnabled` and `canPost` computed via the official communities-v2
   policy helpers.
3. For every channel the viewer is a lead of: `channel`, with permission
   resolved via `canPublishChannelContent(perms)`.
4. For every active workplace the viewer owns: `workplace`.
5. `important_event` and `profile_presentation` — both `partial`
   (`blockedReason: backend_not_ready_v2`) until those domains land.

The registry never publishes itself; it only enumerates.

## 7. Per-target use-cases

| Target | Use-case | Underlying domain |
| --- | --- | --- |
| friend_feed | `publishToFriendFeed` | `content-v2/friend-posts` via `friend-feed` use-case |
| community_feed / staff_feed / relational_feed | `publishToCommunityFeed*` | `content-v2/community-feeds` via `community-feeds` use-case |
| channel | `publishToChannel` | `content-v2/channel-posts` via `channel-content` use-case |
| workplace | `publishToWorkplace` | `content-v2/workplace-posts` + `workplace-teasers` via `workplace-feed` use-case |
| important_event | `publishImportantEvent` | — (truthful PARTIAL) |
| profile_presentation | `publishProfilePresentationItem` | — (truthful PARTIAL) |

## 8. Post Display Kit (how it works)

`client/src/features-v2/content-display/`:

- `PostDisplayKit.tsx` — bases: Root / AuthorSummary / Header / Body /
  MediaGrid / Meta / PrivacyBadge / BadgeRow.
- `PostActionBar.tsx` — interaction bar + `PostRouteLink`.
- `PostDisplayStates.tsx` — Skeleton / ErrorState / EmptyState.
- `PostDisplayHelpers.ts` — pure helpers + label maps (split out so the
  kit stays inside the code-quality file-size guard).
- `variants/PostCardVariants.tsx` — visual variants, all consuming the
  same `PostDisplayViewModel` and the base components.

## 9. Display variants added

- `FriendFeedPostCard` · `CommunityFeedPostCard` · `StaffFeedPostCard` ·
  `RelationalFeedPostCard` · `ChannelPostCard` · `WorkplacePostCard`
  (each: full card with action bar; visually distinct accent on the top
  border).
- `WorkplaceTeaserCard` — compact, NO full body; routes to the full
  workplace post.
- `ImportantEventCard` — date-pill + title-led layout, distinct from a
  normal post.
- `ProfilePresentationCard` — editorial section card.
- `CompactPostPreviewCard` — compact list / hover preview.

## 10. Scalability

Backend:

- All list paths already enforce cursor + max limit via the underlying
  domain APIs (`content-v2/friend-posts`, `community-feeds`,
  `channel-posts`, `workplace-posts`, `workplace-teasers`).
- The publishing facade adds an LRU idempotency cache so a retried submit
  does not double-publish.
- `PublishingResult.feedEffects` is explicit so consumers (notifications,
  read-models) can react without re-querying.

Frontend:

- Display Kit components are `memo`-wrapped where they're pure.
- `PublishingComposerCore` debounces the preview build (200ms default).
- View models are intentionally compact; teaser variants never carry a
  full body to avoid duplicate payload.

## 11. Media handling

- Composer + adapter accept `mediaRefs` only.
- Live media runtime is not wired here; `PublishingMediaPicker` truthfully
  shows "Media w przygotowaniu" instead of pretending to upload — no
  base64, no `readAsDataURL`.
- Per-target `allowedMediaTypes` + `maxMediaCount` come from the registry.

## 12. Permissions

- Every per-target use-case validates the request through the source-of-
  truth domain's `public-api` (no direct repository / internal access).
- The registry asks the same policy helpers used in production:
  - `canPostToCommunityAll`, `canPostStaffOnly`, `canPostRelational`
  - `canPublishChannelContent`
  - workplace ownership via `listWorkplacesForOwner`
- The composer + display kit NEVER re-check permissions; they trust the
  upstream view model.

## 13. Target readiness

| Target | Status |
| --- | --- |
| friend_feed | READY |
| community_feed | READY |
| community_staff_feed | READY |
| community_relational_feed | READY (quota enforced server-side) |
| channel | READY (lead-only, MIN_ACTIVE_LEADS=1) |
| workplace | READY (owner-only, teaser auto-created) |
| important_event | TARGET_PARTIAL (`backend_not_ready_v2`) |
| profile_presentation | TARGET_PARTIAL (`backend_not_ready_v2`) |

## 14. BACKEND_PARTIAL / TRANSPORT_PARTIAL / UI_SHELL_ONLY

- BACKEND_PARTIAL: important_event + profile_presentation (no domain yet).
- TRANSPORT_PARTIAL: live HTTP transport — the publishing dispatcher is
  callable in-process and unit-tested; HTTP wiring is not part of this
  slice. Mock adapter mirrors the contract.
- UI_SHELL_ONLY: composer page chrome (the slice ships re-usable building
  blocks; mounting the composers on a route is a follow-up).

## 15. Test evidence

- `server/application-v2/use-cases/publishing/__tests__/service.test.ts` —
  14 tests: each target routed, idempotency dedupe, empty body, missing
  key, important_event title/date, partial envelopes, no-PII shape.
- `server/application-v2/use-cases/publishing/__tests__/registry.test.ts` —
  6 tests: viewer with channel-lead + community-staff + workplace-owner
  roles sees full set; stranger sees only personal targets; partial reason
  truthful; no PII.
- `client/src/features-v2/publishing/__tests__/PublishingCore.test.tsx` —
  9 tests: every composer variant renders; partial target shows badge +
  keeps submit disabled; adapter publish returns truthful PARTIAL for
  important_event.
- `client/src/features-v2/content-display/__tests__/PostCardVariants.test.tsx`
  — 14 tests: every display variant renders + correct privacy label; teaser
  carries NO full body; helpers + states render.

Total slice 17 tests: **43 / 43 passing**.

## 16. Guard evidence

- `pnpm tsc --noEmit` — PASS.
- `pnpm vitest run` — 1208 / 1208 tests passing (full repo).
- `node scripts/check-code-quality-structure.mjs` — `CHECK_CODE_QUALITY_STRUCTURE_PASS`.
- `node scripts/check-no-any-types.mjs` — see Section 27 (bramki).
- `node scripts/check-placeholder-tests.mjs` — see Section 27.
- `node scripts/check-feature-registry.mjs` — updated KNOWN_FEATURES + the
  feature-registry.ts.

## 17. P0 / P1 / P2

- P0: none.
- P1: none.
- P2: when `important-events` / `profile-presentation` V2 domains land,
  switch the matching target file from PARTIAL to wired and drop the
  `backend_not_ready_v2` reason from the registry.

## 18. Next recommended steps

1. Wire an HTTP transport on top of `createPublishingService` so the
   composers can switch from `createPublishingMockAdapter` to the real
   adapter.
2. Add a small composition page (slice 18 candidate) that mounts the
   right composer per route using `usePublishingTargets`.
3. Add Important Events + Profile Presentation backend domains. Both will
   reuse the unified contracts from this slice.
4. Wire the publishing event hooks into `notifications-v2/event-registry`
   (entries already exist for `FriendFeedPostCreated`, `WorkplacePostCreated`,
   `ChannelPostCreated`; add the community / important-event / presentation
   entries once those events emit).

---

## Final acceptance table

| Area | Status |
| --- | --- |
| Legacy publishing inventory | PARTIAL (`PARTIAL_LEGACY_SOURCE_MISSING`) |
| Publishing Core | PASS |
| Composer variants | PASS |
| Target Publishing Registry | PASS |
| Friend feed publishing | PASS |
| Community feed publishing | PASS |
| Channel publishing | PASS |
| Workplace publishing | PASS |
| Important events publishing | PARTIAL (truthful — backend not ready in V2) |
| Profile presentation publishing | PARTIAL (truthful — backend not ready in V2) |
| Post Display Kit | PASS |
| Display variants | PASS |
| Scalability/read-model readiness | PASS |
| Media handling | PARTIAL (live media runtime not wired — composer truthful) |
| Permissions/privacy | PASS |
| Event hooks | PARTIAL (kept compatible; new emits land with notifications wiring) |
| DTO/PII/security | PASS |
| Architecture boundaries | PASS |
| Frontend UI quality | PASS |
| Tests | PASS (43 new, 1208 total) |
| Guards | PASS |
| Readiness | READY_FOR_PRODUCT_REVIEW |
