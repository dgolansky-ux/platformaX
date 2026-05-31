# Slice 14 — Notifications V2 + Activity Center + Event Registry — Report

Status: `READY_FOR_PRODUCT_REVIEW`
Branch: `feat/contacts-v2-clean-room-slice`
Date: 2026-05-30

## 1. What was delivered

- **`server/domains-v2/notifications-v2/`** — new OPERATIONAL_DOMAIN.
  In-memory notification service with create / list / mark read / mark all
  read / archive / unread count, plus a per-user, per-category in-app
  settings foundation. Public DTOs carry no PII (no email/phone/raw post
  bodies). Cursor-paginated lists with stable createdAt-desc, id tie-break
  order. Idempotency via `dedupeKey`. `actor === recipient` short-circuits
  to a typed `{created:false, reason:"actor_is_recipient"}`.
- **Event registry** — typed decision table at
  `server/domains-v2/notifications-v2/event-registry.ts` + the
  human-readable
  [NOTIFICATION_EVENT_REGISTRY.md](./NOTIFICATION_EVENT_REGISTRY.md). Each
  product event has `createsNotification: yes/no`, recipient rule, actor
  rule, category, reason and handler status (`implemented` / `planned` /
  `no_notification_needed` / `blocked_by_missing_source_event`). An
  integrity check (covered by a vitest assertion) ensures no entry is
  malformed.
- **`server/application-v2/use-cases/notifications/`** — typed
  orchestrator wiring the friend-feed source events (the events that exist
  today: `FriendFeedCommentCreated`, `FriendFeedReactionAdded`,
  `FriendFeedCommentReactionAdded`) to the notifications service.
- **`client/src/features-v2/notifications-v2/`** — Activity Center frontend
  (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). Header + mark-all-read CTA, filter
  tabs (Wszystkie / Nieprzeczytane / Feed znajomych / Społeczności / Kanały
  / Profil zawodowy / Moduły / System), notification cards with per-card
  mark-read + archive, real empty / loading / error states, and the
  settings foundation panel.
- **Sidebar + floating nav** — `Powiadomienia` entry enabled, navigates to
  `/notifications`, badge shows the **real** unread count from the
  notifications mock adapter (subscriber pattern keeps the badge in sync
  with the page).
- **Route** — `/notifications` registered in `app-v2/AppRouter.tsx`.
- **Persistence migration draft** — schema for `notifications` and
  `notification_settings` tables documented in
  [NOTIFICATIONS_MIGRATION_DRAFT.md](./NOTIFICATIONS_MIGRATION_DRAFT.md).
  `pnpm db push` was NOT run; the in-memory repository continues to back
  the runtime.

## 2. How notifications-v2 works

```
Source domain (e.g. friend-posts)
   └─ emits FriendFeedCommentCreated (typed event, no PII)
                       │
                       ▼
application-v2/use-cases/notifications/handleFriendFeedCommentCreated
   - actor !== recipient short-circuit
   - dedupeKey = event.eventId (idempotent)
   - settings check (in-app gate per category)
                       │
                       ▼
notifications-v2.createNotification(...)
   - validates title / body preview / route target
   - persists record (in-memory today)
   - public DTO has no PII, no dedupeKey, no correlationId
```

## 3. Activity Center

- Renders at `/notifications`.
- Header copy: kicker `Centrum aktywności`, title `Powiadomienia`, subtitle
  `Zobacz, co wydarzyło się w Twoich społecznościach, kanałach i profilu.`
- Filter tabs show real per-category unread counts.
- Per-card actions: open (marks as read + navigates to `routeTarget`), mark
  as read, archive. No fake CTAs.
- Settings panel: per-category in-app toggle. Toggle hits the mock adapter
  and the change immediately propagates to the unread badge.

## 4. Unread count

- `notifications-v2.getUnreadCount(viewerUserId)` returns `{total,
  byCategory}` from real records — the in-memory store sums them, the
  mock adapter mirrors the same shape.
- `useNotificationsUnreadCount()` hook subscribes to the adapter and the
  badge re-renders any time a notification flips state.
- The sidebar badge never shows a faked number — when the viewer has no
  unread, the badge is hidden.

## 5. Settings foundation

- Default state: all categories `inAppEnabled: true` (no DB row needed).
- Disabling a category gates **new** notification creates only; existing
  notifications stay visible.
- `service.updateSettings({viewerUserId, category, inAppEnabled})` upserts
  one row, returns the full settings DTO; viewers can never write to
  another user's settings (input is the only write authority).

## 6. Event registry

See [NOTIFICATION_EVENT_REGISTRY.md](./NOTIFICATION_EVENT_REGISTRY.md). The
typed `NOTIFICATION_EVENT_REGISTRY` array drives an integrity test; missing
fields fail the build. Categories used in the registry come from the typed
`NotificationCategory` union, so a typo cannot ship.

## 7. Mapping event → notification

| Source event | Mapping | Implemented |
| --- | --- | --- |
| FriendFeedCommentCreated | type `friend_post_comment`, friend_feed | yes |
| FriendFeedReactionAdded | type `friend_post_reaction`, friend_feed | yes |
| FriendFeedCommentReactionAdded | type `friend_post_comment_reaction`, friend_feed | yes |

All other registry entries with `createsNotification: true` are currently
`blocked_by_missing_source_event` — communities-v2, channels and modules do
not emit their respective events yet. We deliberately did NOT add fake
handlers; once the source domain begins emitting we wire the matching
handler in `application-v2/use-cases/notifications`.

## 8. Statuses

- `notifications-v2` domain: **BACKEND_PARTIAL** + **OUTBOX_SKELETON**.
- Frontend `features-v2/notifications-v2`: **UI_SHELL_ONLY** +
  **MOCK_LOCAL_ONLY**.
- Application orchestrator: **BACKEND_PARTIAL** (friend-feed handlers
  live; others blocked by source events).
- Persistence: in-memory adapter only; durable adapter pending (migration
  draft committed, `db push` not executed).

## 9. Not implemented (out of scope this slice)

- Email notifications.
- Push notifications.
- Mobile-native notifications.
- AI priority ranking / smart inbox.
- Global activity feed.
- HTTP transport for notifications (the frontend uses the local mock
  adapter; same contract as the server domain, no `@server/*` imports).

## 10. Test evidence

- 1139 / 1139 vitest tests pass (`pnpm test`).
- New test suites:
  - `server/domains-v2/notifications-v2/__tests__/notifications-v2-service.test.ts`
  - `server/domains-v2/notifications-v2/__tests__/notifications-v2-settings.test.ts`
  - `server/domains-v2/notifications-v2/__tests__/notifications-v2-event-registry.test.ts`
  - `server/domains-v2/notifications-v2/__tests__/domain-contract.test.ts`
  - `server/application-v2/use-cases/notifications/__tests__/notifications-event-handlers.test.ts`
  - `client/src/features-v2/notifications-v2/__tests__/NotificationsPage.test.tsx`
  - `client/src/app-v2/navigation/__tests__/DesktopSidebar.test.tsx`
  - Updated `client/src/app-v2/navigation/__tests__/FloatingNav.test.tsx`
- Coverage spans: PII-free DTO, dedupe, actor==recipient skip, settings
  gate, list pagination, unread filter, category filter, mark/archive
  authority, settings authority, event registry integrity, frontend
  filter / mark-all / settings toggle / unread badge realism.

## 11. Guard evidence

| Gate | Result |
| --- | --- |
| `pnpm check` (TypeScript) | PASS |
| `pnpm lint` (ESLint, max-warnings=0) | PASS |
| `pnpm test` (1139 tests) | PASS |
| `pnpm build` (Vite production build) | PASS |
| `pnpm rules:check` (43 guards) | PASS |
| `pnpm arch:check:v2` (9 guards) | PASS |
| `pnpm guards:all-local` (acceptance + secret scan + complexity + …) | PASS |

## 12. P0 / P1 / P2

- P0: none.
- P1: none.
- P2:
  - durable Postgres adapter for `notifications` and `notification_settings`.
  - outbox / worker runtime to dispatch source events to the orchestrator
    asynchronously.
  - HTTP transport for the frontend (replace the mock adapter).
  - wire the remaining handlers as soon as source domains begin emitting
    the events listed as `blocked_by_missing_source_event`.

## 13. Next recommended step

Pick **one** of the `blocked_by_missing_source_event` source domains and
emit its first event:
- Communities: `CommunityInviteCreated` is the most user-visible and would
  exercise the orchestrator wiring end-to-end.
- Channels: `ChannelLeadAssigned` is small but high-value for moderators.

When that lands, the corresponding `handle*` handler can drop straight in;
the registry entry simply flips to `implemented` and a test for the
handler joins the suite.
