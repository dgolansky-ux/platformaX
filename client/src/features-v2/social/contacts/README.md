# features-v2/social/contacts

Status: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`
Legacy reference: `docs/review/contacts-v2/LEGACY_CONTACTS_ANALYSIS.md`
Backend reference: `server/application-v2/use-cases/contacts/README.md`

## What this is

The four-tab Kontakty UI shell (Znajomi / Kontakty / Specjaliści / Prośby),
the accept-fields modal, and a deterministic in-process mock adapter that
implements the same async surface the future HTTP adapter will expose.

## What it is NOT

- Not wired to `application-v2/use-cases/contacts` (no HTTP transport yet).
- Not connected to a real user session — `viewerId` is a fixed demo id.
- Not yet exposing search, family-tier picker, public-profile request modal
  or the `/contact-privacy` page (see analysis §7 — deferred).

## Status truth

- The mock adapter is the ONLY data source today. A green render here is
  NOT evidence the backend is reachable. The backend service surface lives
  in `server/application-v2/use-cases/contacts/public-api.ts` and is fully
  covered by its own tests, but no transport bridges the two today.
- When the HTTP transport ships, this folder swaps `mock-adapter.ts` for a
  thin `http-adapter.ts` against the same `ContactsMockAdapter` interface.
- IMPLEMENTED requires: real transport + real persistence + signed-in user
  context + UI smoke tests against the real adapter. Not this PR.
