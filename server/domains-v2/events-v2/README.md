# events-v2

**Status:** FOUNDATION_READY (in-memory store, no HTTP transport)

Owns the **Wydarzenia** module's data. Events belong to an owner — a personal
profile or a community — and only surface publicly when the `events` module
is enabled for that owner.

## Out of scope this slice

- Payments / tickets.
- RSVP (a small foundation may be added later; not in this slice).
- Calendar provider sync.

## Public surface

Import only from `public-api.ts`. Public DTO carries no `createdByUserId`.
