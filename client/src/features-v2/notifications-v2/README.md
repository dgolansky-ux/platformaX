# features-v2/notifications-v2

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`

## Purpose

In-app Activity Center frontend. Renders the list of notifications, filter
tabs (`Wszystkie / Nieprzeczytane / Społeczności / Kanały / Feed znajomych /
Profil zawodowy / Moduły / System`), per-notification mark-as-read + archive
actions, a mark-all-read button, and the settings foundation panel.

A small hook (`useNotificationsUnreadCount`) keeps the sidebar bell badge in
sync with the adapter so navigating away from the Activity Center never shows
a stale count.

## Today

- `mock-adapter.ts` is a `MOCK_LOCAL_ONLY` in-memory transport that mirrors
  the server `notifications-v2` contract. Seeded with realistic notifications
  for `u-viewer`.
- No `@server/*` imports anywhere — boundaries audited by
  `audit-domain-boundaries.mjs`.
- Mark-all/mark-read/archive/toggle-setting all hit the adapter and emit to
  subscribers, so the unread badge updates in real time.

## Not implemented in Slice 14

- HTTP / WebSocket transport.
- E-mail / push / mobile-native delivery.
- AI priority ranking.
