# topics-v2

**Status:** FOUNDATION_READY (in-memory store, no HTTP transport)

Owns the **Tematy** module's data. Topics belong to an owner — a personal
profile (`ownerType: "profile"`) or a community (`ownerType: "community"`) —
and only become publicly visible when the `topics` module is enabled for
that owner (gated through `TopicModuleEnablementResolver`).

## Public surface

Import only from `public-api.ts`. Other domains do not reach into the
internal files (store / policy / mapper / service) — the import graph guard
enforces this.

## Cross-domain ports

- `TopicOwnershipResolver` — implemented by the application layer; tells
  topics-v2 whether an actor may manage topics for a given owner.
- `TopicModuleEnablementResolver` — bridges the `modules` domain so this
  domain does not import modules' internals.

## Privacy

Public DTO carries no `createdByUserId`. `TopicDTO` (internal) does — it must
not leak to public surfaces; use `toTopicPublic` from the mapper.

## Out of scope this slice

- Persistence (DB schema is drafted in the slice report).
- Posts/feed runtime — surfaced through `content-v2` later.
- Subscribers / followers on topics.
