# Legacy Publishing + Post Display — UI Map (Slice 17)

Status: PARTIAL_LEGACY_SOURCE_MISSING

This repo is a clean-room V2 (`PlatformaX-V2-clean`). No `legacy/`,
`legacy-*` or `src/legacy*` source tree is checked in alongside the working
copy. The maps below are an *implementation map* derived from:

- the slice 17 task brief (sections 13–16, 25) — UX intent owners signed off on,
- existing V2 use-cases that already orchestrate the same targets
  (friend-feed, community-feeds, channel-content, workplace-feed),
- existing V2 DTOs and policies in `content-v2`, `channels`, `communities-v2`,
  `identity/workplaces`.

Anything below tagged `OWNER_DECISION_NEEDED` is a place where the V2
implementation deliberately differs from legacy and the owner should confirm
or override during product review. Anything tagged `REBUILD_CLEAN_ROOM` is
new V2 code with no legacy file to copy from.

The runtime taxonomy is fixed: legacy hooks / tRPC bindings / Supabase
coupling MUST NOT be ported — only UX intent and decision flow.

---

## 1. Composer

| Element | Decision | Notes |
| --- | --- | --- |
| Composer outer shell (card + textarea + submit row) | REBUILD_CLEAN_ROOM | `PublishingComposerCore` (V2). |
| Placeholder copy (FriendFeed) | TAKE_LOGIC | "Co u Ciebie?" — short, social, single-line entry. |
| Placeholder copy (Channel) | TAKE_LOGIC | "Opublikuj wpis na kanale..." — more formal. |
| Placeholder copy (Workplace) | TAKE_LOGIC | "Co nowego w pracy?" — professional. |
| Placeholder copy (Important event) | TAKE_LOGIC | Title-first ("Tytuł wydarzenia…"), then date + description. |
| Placeholder copy (Profile presentation) | TAKE_LOGIC | Editorial — "Tytuł sekcji" + "Opisz…". |
| Visibility toggle (friends_only / public / private) | TAKE_LOGIC | Already exists in `friend-posts` policy + workplace-posts. |
| Media picker (refs only, no base64) | REBUILD_CLEAN_ROOM | Re-uses media upload-intent pattern (no runtime today; partial-state allowed). |
| Preview card | REBUILD_CLEAN_ROOM | `PublishingPreview` mirrors the corresponding display-kit variant. |
| Submit button / loading / success / error states | REBUILD_CLEAN_ROOM | `PublishingSubmitBar`, `PublishingLoadingState`, etc. |
| Error UX (toast/alert/confirm) | REJECT_LEGACY_RUNTIME | No `window.alert`/`window.confirm`. Inline `PublishingErrorState`. |
| Mobile layout | REBUILD_CLEAN_ROOM | One-column composer, sticky submit. |
| Desktop layout | REBUILD_CLEAN_ROOM | Side-by-side preview when wide. |

## 2. Friend feed

| Element | Decision | Notes |
| --- | --- | --- |
| Friend feed post card layout | REBUILD_CLEAN_ROOM | `FriendFeedPostCard` (V2). |
| Author header (avatar + display name + handle) | TAKE_LOGIC | Already enriched by `application-v2/friend-feed`. |
| Action bar (comment / react / share) | TAKE_LOGIC | Reuses `FriendFeedInteractionSummary` (no fake counters). |
| Inline comment list / nested replies | REBUILD_CLEAN_ROOM | Already implemented server-side; UI variant. |
| Empty state | REBUILD_CLEAN_ROOM | "Brak postów" + CTA "Napisz pierwszy". |
| Loading state | REBUILD_CLEAN_ROOM | `PostSkeleton`. |
| Error state | REBUILD_CLEAN_ROOM | `PostErrorState`. |

## 3. Important events

| Element | Decision | Notes |
| --- | --- | --- |
| Card layout (date pill, title, body, optional CTA) | REBUILD_CLEAN_ROOM | `ImportantEventCard` — visually distinct from posts. |
| Form (title required, description, date, mediaRefs) | REBUILD_CLEAN_ROOM | `ImportantEventComposer`. |
| Ordering / pinning | OWNER_DECISION_NEEDED | Backend persistence does not exist in V2 yet — surface kept partial. |
| Limit per profile | OWNER_DECISION_NEEDED | Suggested: 10 active items. Confirm. |
| Friend-feed teaser when created | OWNER_DECISION_NEEDED | Optional event hook. Wired but no-op until backend lands. |

Status: TARGET_PARTIAL — frontend shows truthful `backend_not_ready_v2`
disabled state until an Important Events domain ships.

## 4. Profile presentation

| Element | Decision | Notes |
| --- | --- | --- |
| Presentation item card | REBUILD_CLEAN_ROOM | `ProfilePresentationCard`. |
| Section / ordering | OWNER_DECISION_NEEDED | Same gap as Important Events. |
| Form (title optional, body, media, visibility) | REBUILD_CLEAN_ROOM | `ProfilePresentationComposer`. |
| Owner vs viewer state | TAKE_LOGIC | Reuses `identity/getPublicProfile` for viewer; owner check by viewerUserId match. |

Status: TARGET_PARTIAL — same reason as Important Events.

## 5. Workplace

| Element | Decision | Notes |
| --- | --- | --- |
| Workplace post (full) | REBUILD_CLEAN_ROOM | `WorkplacePostCard` (V2). Backend in `application-v2/workplace-feed`. |
| Workplace teaser on friend feed | TAKE_LOGIC | Server already creates teaser via `workplaceTeasers`. UI is `WorkplaceTeaserCard` (compact, no full body). |
| Composer | REBUILD_CLEAN_ROOM | `WorkplaceComposer` — postType select (`update` / `realization` / `offer` / `note`). |
| Owner-only publish | TAKE_LOGIC | Already enforced in `workplaceFeed.createWorkplacePostWithFriendFeedTeaser`. |

## 6. Channels

| Element | Decision | Notes |
| --- | --- | --- |
| Channel post card | REBUILD_CLEAN_ROOM | `ChannelPostCard` (V2). |
| Composer (lead-only) | REBUILD_CLEAN_ROOM | `ChannelComposer`; permission gating from `canPublishChannelContent`. |
| Pinned post | TAKE_LOGIC | Server already has `pin`/`unpin`; UI only renders pinned variant — pinning itself is not in the publishing composer (separate action). |

## 7. Communities

| Element | Decision | Notes |
| --- | --- | --- |
| `community_all` card | REBUILD_CLEAN_ROOM | `CommunityFeedPostCard`. |
| `staff_only` card | REBUILD_CLEAN_ROOM | `StaffFeedPostCard` — staff badge. |
| `relational` card | REBUILD_CLEAN_ROOM | `RelationalFeedPostCard` — quota hint. |
| Composer (3 variants) | REBUILD_CLEAN_ROOM | One core + 3 thin wrappers; permission/quotas enforced server-side. |
| Descendant publishing | TAKE_LOGIC | Already handled in `community-feeds.publishCommunityPost` `scope`. UI exposes a single "Publikuj też w podstrukturze" toggle. |

---

## Implementation notes (clean-room V2 boundaries)

- Frontend NEVER imports `@server/*`. View models / DTOs cross the wire only.
- Application-v2 publishing orchestrators only call domain `public-api.ts`.
- Per-target use-cases stay separate — there is no `publishEverything()` god
  service. The unifying surface is the **Target Publishing Registry** + the
  thin `publish(command)` dispatcher; both live in
  `server/application-v2/use-cases/publishing/`.
- Display Kit receives **safe view models** built by the orchestrator. It
  never re-checks permissions and never calls source-of-truth.

OWNER_DECISION_NEEDED items above are surfaced in the slice 17 report and
should be triaged before backend work on Important Events / Profile
Presentation begins.
