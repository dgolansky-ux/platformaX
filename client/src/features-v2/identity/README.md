# identity — UI Feature

Status: `PARTIAL`

- Auth runtime: `AUTH_RUNTIME_PARTIAL` — real Supabase Auth via adapter
- Profile backend: `IDENTITY_PROFILE_BACKEND_NOT_STARTED`
- Onboarding profile persistence: `ONBOARDING_PROFILE_PERSISTENCE_NOT_STARTED`

## Purpose
Frontend identity feature. Owns the auth subject on the client. Wraps Supabase
Auth behind a typed adapter so app-v2 auth screens never touch the SDK directly.

## Structure
- `auth/types.ts` — typed contracts (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, …)
- `auth/auth-adapter.ts` — orchestration + safe error mapping (Polish, no provider internals)
- `auth/supabase-client.ts` — the ONLY module importing `@supabase/supabase-js`
- `index.ts` — public entrypoint exposing `identityAuthAdapter`

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Only the Supabase anon/public key is used (frontend). The service role key and
  any database connection string must never reach the frontend.
- Onboarding PII (phone, date of birth) must not be written to auth metadata.

## Not done yet
- No profile/identity backend (no `server/domains-v2/identity` runtime)
- No protected app route to land on after login (login currently routes to `/onboarding`)
- No onboarding profile persistence (still mock-local `useState`)
- No live end-to-end verification in this change (requires a provisioned Supabase project + browser)
