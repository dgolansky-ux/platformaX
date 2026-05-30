# Legacy Friend Feed UI map — Slice 11

**Branch:** feat/contacts-v2-clean-room-slice
**Date:** 2026-05-30

## Clean-room context

`PlatformaX-V2-clean` is a clean-room V2 working copy. There is no legacy
PlatformaX V1 tree in `audit-out/`, `client/`, `server/`, `shared/`, or
`supabase/`. The slice brief explicitly says "Frontend feedu znajomych i
szczególnie narzędzie podglądu feedu na profilu osobistym były w starej
wersji bardzo dobre — Trzeba je odtworzyć możliwie 1:1." Because the legacy
source itself is not in this repository, "1:1" cannot be a pixel match.

This file documents the target UX skeleton the V2 implementation models on,
drawing from the brief and product memory, so future readers know what was
deliberately carried over and what was deliberately replaced. If a legacy
snapshot is later added, this file will be updated to point at concrete
paths; the conceptual mapping below stays valid.

---

## Main friend feed (`/friends-feed`)

**Carry over (UX/flow):**
- One vertical column of post cards, newest first.
- Header sticks at the top: title "Feed znajomych", brief subtitle, viewer
  composer state ("Możesz publikować" / "Brak znajomych — dołącz, aby zobaczyć
  feed").
- Composer at the top of the feed: avatar + textarea + privacy chip +
  publish CTA. Disabled state has visible reason text, no silent no-op.
- Post card: author block (avatar + display name + handle), publication
  date (relative), body text, optional media badges, privacy chip,
  action bar (reaction toggle + comments toggle + post timestamp link).
- Reactions: single "Lubię to" pill that fills when active.
- Comments: collapsed by default; expanding renders the comment list and
  the inline composer.
- Empty state: "Twoi znajomi jeszcze nic nie opublikowali. Bądź pierwszy."
- Loading state: skeleton placeholders that match the card layout.
- Error state: small banner with retry CTA, never silent.
- Permission state (no friends yet): friendly card explaining how to add
  friends, link to /kontakty.
- Mobile: composer collapses to a single tappable row that expands inline.

**Reject:**
- tRPC / legacy hooks / Supabase coupling.
- localStorage as backend.
- Fake counters (we render real counts only).
- Window confirm/alert dialogs.
- Mixing community posts into the friend feed.

## Personal profile preview tool

**Mandatory carry-over (per brief).**
The personal profile page hosts a compact "ostatnie wpisy" widget surfaced
in the side column on desktop and inline on mobile.

**Structure:**
- Header card: profile owner display name + "Ostatnie wpisy" kicker +
  small CTA "Zobacz feed znajomych".
- Item list (3–5 entries):
  - Author display name (or "Ty" when owner = author).
  - Relative date.
  - Body excerpt (single line on mobile, ~2 lines on desktop).
  - Privacy badge if not "public".
- Empty state: kind, owner-aware copy ("Nie masz jeszcze wpisów. Otwórz
  composer w feedzie znajomych.")
- Restricted state (stranger looking at a friends-only profile): explains
  why nothing is visible without leaking that posts exist.
- Loading / error states distinct from empty.
- CTA "Zobacz więcej" links to `/friends-feed` (no no-op).

**Visibility rules baked in:**
- Owner viewing own profile: sees own friends + private (private only own).
- Friend viewing the profile: sees friends-only items the owner authored.
- Stranger: sees only `public` items; if there are none, restricted card.

## Comments / reactions

- Friend post reactions: single `like` for MVP (legacy parity); pill toggle.
- Friend post comments: top-level + soft-deleted preserves order (deleted
  body replaced with "[usunięto]" stripped at the DTO boundary, not in UI).
- Viewer who cannot see a post must not see counts/comments either.

## What we deliberately do NOT build this slice

- Global / discovery feed.
- Ranking, recommendations.
- Push or in-app notifications UI.
- 1:1 chat.
- Community posts mixed into the friend feed.
- Channels in the friend feed.
- Payments / monetisation.

## Mapping to V2 domains

| Surface                    | V2 owner                                  | Status this slice            |
|----------------------------|-------------------------------------------|------------------------------|
| Friend posts (data)        | `content-v2/friend-posts`                 | FOUNDATION_READY (in-memory) |
| Friend graph               | `social` (existing)                       | unchanged                    |
| Author public summary      | `identity` (existing)                     | unchanged                    |
| Orchestration              | `application-v2/use-cases/friend-feed`    | BACKEND_PARTIAL              |
| Friend feed page           | `client/src/features-v2/friend-feed`      | UI_SHELL_ONLY                |
| Personal profile preview   | `client/src/features-v2/friend-feed`      | UI_SHELL_ONLY                |
