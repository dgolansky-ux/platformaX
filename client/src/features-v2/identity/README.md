# identity — UI Feature

Status: `PARTIAL`

- Auth runtime: `AUTH_RUNTIME_PARTIAL` — real Supabase Auth via adapter
- Profile runtime: `IDENTITY_PROFILE_CLIENT_BOUNDARY_PARTIAL` — client-only adapter against `@shared/contracts/profile-view`; no server runtime bundled; HTTP transport not started
- Profile transport: `CLIENT_PROFILE_TRANSPORT_NOT_CONNECTED` — the default adapter returns a typed not-connected result; nothing persists
- Profile owner edit: `BIO_RUNTIME_PARTIAL` — `profileAdapter.updateMyProfile` exists in the contract; wiring lands with the transport.

## Purpose
Frontend identity feature. Owns the auth subject on the client. Wraps Supabase
Auth behind a typed adapter so app-v2 auth screens never touch the SDK directly.
Also exposes the profile adapter (`profileAdapter`). The real identity + media
composition lives server-side in `server/application-v2/profile`; the client
depends only on `@shared/contracts/profile-view`.

## Structure
- `auth/types.ts` — typed contracts (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, …)
- `auth/auth-adapter.ts` — orchestration + safe error mapping (Polish, no provider internals)
- `auth/supabase-client.ts` — the ONLY module importing `@supabase/supabase-js`
- `profile/types.ts` — typed contracts (`OnboardingProfileAdapter`, result types incl. `UpdateMyProfileResult`), sourced from `@shared/contracts/profile-view`
- `profile/profile-adapter.ts` — `createProfileAdapter(port)` + the default client-only `profileAdapter` (transport not connected); imports zero `@server/*`
- `profile/index.ts` — feature-scoped barrel
- `index.ts` — public entrypoint exposing `identityAuthAdapter` and `profileAdapter`

## Constraints
- No file under `client/src` may import `@server/*` (enforced by check-client-server-boundary).
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Only the Supabase anon/public key is used (frontend). The service role key and
  any database connection string must never reach the frontend.
- Onboarding PII (phone, date of birth) must not be written to auth metadata or
  to localStorage/sessionStorage — it goes only through `profileAdapter`.

## Not done yet
- No Supabase profile repository yet — `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`. SQL migration committed in `supabase/migrations/0001_identity_private_profiles.sql` (not applied).
- No HTTP transport — the default `profileAdapter` is a client-only stub returning a typed not-connected result; nothing persists.
- No protected app route after login (login still routes to `/onboarding`).
- No live end-to-end verification in this change (requires Supabase project + browser).
