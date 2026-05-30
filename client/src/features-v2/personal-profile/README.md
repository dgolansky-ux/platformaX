# features-v2/personal-profile

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`

## Purpose

The unified personal profile screen at `/profile/:username`. The SAME
component renders every viewer relation — owner / friend / stranger /
pending_friend_request_sent / pending_friend_request_received /
contact_approved / unauthenticated. Per-section permissions in the view
DTO drive what the UI shows.

## What it owns

- `PersonalProfilePage.tsx` — unified hero + sections + viewer-action wiring.
- `mock-adapter.ts` — MOCK_LOCAL_ONLY adapter implementing the
  `PersonalProfileViewAdapter` contract from
  `@shared/contracts/personal-profile-view`.
- `fixtures.ts` — three seeded profiles (`viewer`, `ada`, `kuba`) plus a
  private profile (`private`) so every relation can be exercised in the UI
  without `@server/*`.

## What it does NOT own

- Profile / contact data — owned by `identity` (server).
- Friendship — owned by `social` (server).
- Workplace records — owned by `identity/workplaces` + `content-v2`
  (server). The view only carries the public summary cards.
- Public Hub composition — owned by `public-hub` (server). The view only
  carries the enabled-module list.
- Friend feed — the embedded preview reuses
  `@client/features-v2/friend-feed` and never duplicates feed logic.

## Not implemented in Slice 15

- HTTP transport for the view DTO.
- Live media URL resolution (the seeded profiles ship null URLs; the hero
  falls back to gradient + initial).
- Channels count (resolver is optional in the backend; mock seeds counts).
