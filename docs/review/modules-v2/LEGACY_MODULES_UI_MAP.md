# Legacy modules UI map — Slice 10

**Branch:** feat/contacts-v2-clean-room-slice
**Date:** 2026-05-30

## Important context

`PlatformaX-V2-clean` is a clean-room V2 repository. There is **no legacy
runtime tree** inside this working copy (`audit-out/`, `client/`, `server/`,
`shared/`, `supabase/` only). The original "PlatformaX V1" UI for Tematy,
Wydarzenia, Integracje, Newsletter chatowy lives outside this repo.

This document therefore serves a different purpose than the corresponding
legacy maps in previous slices: it specifies, from product memory and the
slice brief, the **target UX skeleton** the V2 clean-room implementation is
modelled on (what we are deliberately keeping vs deliberately replacing) so
that future readers understand the design intent without needing the legacy
tree.

If/when a legacy snapshot is dropped into this repo, this file will be
updated to point at concrete files; the conceptual mapping below remains
valid.

---

## Tematy (topics)

**Keep (UX/flow):**
- List of topic cards on the owner surface (profile/community).
- Topic detail page reachable from the card.
- Create/Edit topic form: title, description, slug, visibility.
- Empty state: "Tu jeszcze nie ma tematów."
- Loading + error states distinct from empty.

**Reject:**
- Legacy "tag cloud" treatment — V2 topics are structured areas of
  conversation, not free-floating tags.
- Coupling of topics to specific channels in the legacy runtime; V2 topics
  belong to an owner (profile/community), not to a channel.

## Wydarzenia (events)

**Keep:**
- Event card: title, big readable date/time, location chip, status pill.
- Event detail page.
- Create event form: title, description, start/end, location type +
  location text, visibility.
- Empty state: "Brak nadchodzących wydarzeń."

**Reject:**
- Payments, ticketing, paid RSVP (out of scope; V2 may add later, separate
  domain).
- Calendar provider sync (Google/Apple) — not in this slice.
- The legacy "interested counter" prominently shown above the title; V2
  treats RSVP as optional foundation only.

## Integracje (integrations)

**Keep:**
- Simple link cards: name + safe URL + optional description.
- Integration kinds: external_link / website / social / embed_placeholder.
- Empty state with a "Dodaj integrację" CTA.

**Reject:**
- OAuth flows for connected accounts (Slack, Discord, etc).
- Storage of secret API keys / tokens in this slice.
- Live data sync to external APIs.
- The legacy "embed live iframe" rendering — V2 stops at safe placeholder
  cards until a security policy is written.

## Newsletter chatowy (newsletter chat)

**Keep (the good parts):**
- Chat-style vertical layout — messages flow top-to-bottom, easy to skim.
- A clear composer for the owner/admin to publish a new broadcast.
- Subscribe/Unsubscribe CTA for viewers.
- A short public-preview surface for non-subscribers.

**Reject (what was bad in legacy):**
- Pretending newsletter chat is a private chat — V2 makes the broadcast
  nature explicit (composer hidden for non-authors, "Newsletter" label).
- Allowing arbitrary subscribers to post — broadcasts only, no inbound.
- Email/push delivery — out of scope for this slice.
- Heavy fanout writes per message — V2 newsletter-chat domain stores the
  message once; delivery is an outbox concern handled later.
- Hidden "subscriber count" leak — V2 subscriber list is not public.

## Public Hub / module surfaces

**Keep:**
- The idea of an owner's public surface composed of enabled module slots.
- Empty state when no modules are enabled.
- Owner sees a "manage modules" CTA; viewer does not.

**Reject:**
- Hub owning module data directly — V2 hub is a composition surface only.
- Per-page hard-coded module sections — V2 surface is driven by the
  modules domain's enablement state.

---

## Mapping to V2 domains

| Legacy area        | V2 owner-domain         | Status this slice                     |
|--------------------|-------------------------|---------------------------------------|
| Tematy             | `topics-v2`             | FOUNDATION_READY (in-memory)          |
| Wydarzenia         | `events-v2`             | FOUNDATION_READY (in-memory)          |
| Integracje         | `integrations-v2`       | FOUNDATION_READY (in-memory)          |
| Newsletter chatowy | `newsletter-chat-v2`    | FOUNDATION_READY (in-memory, NO_EMAIL_DELIVERY) |
| Public Hub         | `public-hub` + app uc   | BACKEND_PARTIAL (composes 4 modules)  |

All four module domains expose enablement through the `modules` domain;
none of them depend on each other, and none of them depend on `public-hub`.
`public-hub` reads enabled keys + per-module summaries through small
resolver contracts so the composition surface stays a pure read-projection.
