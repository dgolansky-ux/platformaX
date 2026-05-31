# features-v2/social/contacts

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`
Legacy reference: `docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md`
Backend reference: `server/application-v2/use-cases/contacts/README.md`

## What this is

The eight-section Kontakty UI shell — Wszyscy / Kontakty / Specjaliści /
Bliżsi znajomi / Dalsi znajomi / Bliska rodzina / Dalsza rodzina / Prośby —
plus the per-person circle dropdown, the dashboard summary, the person
**details panel**, the request + accept-fields modals, and a deterministic
in-process mock adapter that implements the same async surface the future
HTTP adapter will expose. The circle sections are owner-local labels
(`friendCircle`); switching one changes only how MY list groups a person —
no consent, no PII (see analysis §8).

Every action button is rendered from the DTO's `availableActions` — the
components never recompute policy. `ProfileContactCard` and
`ContactPersonDetailsPanel` are exported for later embedding on the public
profile page (profile contact CTA); they show only `visibleContactFields`
the policy already approved, otherwise an explicit no-access state.

## What it is NOT

- Not wired to `application-v2/use-cases/contacts` (no HTTP transport yet).
- Not connected to a real user session — `viewerId` is a fixed demo id.
- Not yet exposing search, public-profile request modal or the
  `/contact-privacy` page (see analysis §7 — deferred).

## Status truth

- The mock adapter is the ONLY data source today. A green render here is
  NOT evidence the backend is reachable. The backend service surface lives
  in `server/application-v2/use-cases/contacts/public-api.ts` and is fully
  covered by its own tests, but no transport bridges the two today.
- When the HTTP transport ships, this folder swaps `mock-adapter.ts` for a
  thin `http-adapter.ts` against the same `ContactsMockAdapter` interface.
- IMPLEMENTED requires: real transport + real persistence + signed-in user
  context + UI smoke tests against the real adapter. Not this PR.
