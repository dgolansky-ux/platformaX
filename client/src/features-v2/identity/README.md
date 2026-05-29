# identity — UI Feature

Status: `PARTIAL`

- Auth runtime: `AUTH_RUNTIME_PARTIAL` — real Supabase Auth via adapter
- Profile runtime: `IDENTITY_PROFILE_RUNTIME_PARTIAL` — frontend depends on the
  `OnboardingProfileAdapter` contract (`@shared/contracts/profile`). Today the
  adapter is a local mock (`MOCK_LOCAL_ONLY`, `BACKEND_NOT_STARTED`); the real
  backend service exists under `server/application-v2/use-cases/profile` and
  will be reached through an HTTP transport once that is wired.
- Onboarding profile persistence: `ONBOARDING_RUNTIME_PARTIAL` — onboarding
  writes go through the mock `profileAdapter`; state is volatile across reloads
  (`isPersistent()` is `false`).
- Profile owner edit: `BIO_RUNTIME_PARTIAL` — `profileAdapter.updateMyProfile`
  patches bio + the core personal-profile fields exposed by the adapter
  contract. The editor surface for firstName/lastName/phone/dateOfBirth is not
  built yet.

## Purpose
Frontend identity feature. Owns the auth subject on the client. Wraps Supabase
Auth behind a typed adapter so app-v2 auth screens never touch the SDK directly.
Also exposes the profile adapter (`profileAdapter`) — the only path through
which app-v2 reaches the profile application boundary.

## Structure
- `auth/types.ts` — typed contracts (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, …)
- `auth/auth-adapter.ts` — orchestration + safe error mapping (Polish, no provider internals)
- `auth/supabase-client.ts` — the ONLY module importing `@supabase/supabase-js`
- `profile/types.ts` — typed boundary re-exports (`OnboardingProfileAdapter`,
  result types, input types) sourced from `@shared/contracts/*`
- `profile/profile-adapter.ts` — local **mock** implementation of
  `OnboardingProfileAdapter` backed by an in-memory `Map`. No `@server/*`
  imports, no `localStorage`/`sessionStorage`. Will be replaced by an HTTP
  client adapter when transport is wired.
- `profile/index.ts` — feature-scoped barrel
- `index.ts` — public entrypoint exposing `identityAuthAdapter` and `profileAdapter`

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Must not import `@server/*` (production code) or `@shared/wiring/*` (no such
  path — removed because it pulled server runtime into the client bundle)
- Only the Supabase anon/public key is used (frontend). The service role key and
  any database connection string must never reach the frontend.
- Onboarding PII (phone, date of birth) must not be written to auth metadata or
  to localStorage/sessionStorage — it goes only through `profileAdapter`.

## Not done yet
- No Supabase profile repository yet — `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`.
  SQL migration committed in `supabase/migrations/0001_identity_private_profiles.sql`
  (not applied).
- No HTTP transport — `profileAdapter` is the local mock, state volatile across
  reloads.
- No protected app route after login (login still routes to `/onboarding`).
- No live end-to-end verification in this change (requires Supabase project + browser).
