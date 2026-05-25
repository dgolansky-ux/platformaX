# identity — UI Feature

Status: `PARTIAL`

- Auth runtime: `AUTH_RUNTIME_PARTIAL` — real Supabase Auth via adapter
- Profile runtime: `IDENTITY_PROFILE_RUNTIME_PARTIAL` — backend service wired via in-memory boundary; HTTP transport / Supabase repository not started
- Onboarding profile persistence: `ONBOARDING_RUNTIME_PARTIAL` — onboarding writes to the identity service through `profileAdapter`; state is volatile across reloads

## Purpose
Frontend identity feature. Owns the auth subject on the client. Wraps Supabase
Auth behind a typed adapter so app-v2 auth screens never touch the SDK directly.
Also exposes the profile adapter (`profileAdapter`) — the only path through
which app-v2 may reach the identity backend domain.

## Structure
- `auth/types.ts` — typed contracts (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, …)
- `auth/auth-adapter.ts` — orchestration + safe error mapping (Polish, no provider internals)
- `auth/supabase-client.ts` — the ONLY module importing `@supabase/supabase-js`
- `profile/types.ts` — typed contracts (`OnboardingProfileAdapter`, result types)
- `profile/profile-adapter.ts` — the ONLY module importing the backend identity domain (`@server/domains-v2/identity/public-api`)
- `profile/index.ts` — feature-scoped barrel
- `index.ts` — public entrypoint exposing `identityAuthAdapter` and `profileAdapter`

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Only the Supabase anon/public key is used (frontend). The service role key and
  any database connection string must never reach the frontend.
- Onboarding PII (phone, date of birth) must not be written to auth metadata or
  to localStorage/sessionStorage — it goes only through `profileAdapter`.

## Not done yet
- No Supabase profile repository yet — `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`. SQL migration committed in `supabase/migrations/0001_identity_private_profiles.sql` (not applied).
- No HTTP transport — `profileAdapter` is in-memory only, state volatile across reloads.
- No protected app route after login (login still routes to `/onboarding`).
- No live end-to-end verification in this change (requires Supabase project + browser).
