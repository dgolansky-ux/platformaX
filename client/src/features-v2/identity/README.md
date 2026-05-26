# identity â€” UI Feature

Status: `PARTIAL`

- Auth runtime: `AUTH_RUNTIME_PARTIAL` â€” real Supabase Auth via adapter
- Profile runtime: `IDENTITY_PROFILE_RUNTIME_PARTIAL` â€” backend service wired via in-memory boundary; HTTP transport / Supabase repository not started
- Onboarding profile persistence: `ONBOARDING_RUNTIME_PARTIAL` â€” onboarding writes to the identity service through `profileAdapter`; state is volatile across reloads
- Profile owner edit: `BIO_RUNTIME_PARTIAL` â€” `profileAdapter.updateMyProfile` is wired (step-33). `/profile` owner can update bio through the identity boundary. firstName/lastName/phone/dateOfBirth are accepted by the adapter contract but the editor surface is not built yet.

## Purpose
Frontend identity feature. Owns the auth subject on the client. Wraps Supabase
Auth behind a typed adapter so app-v2 auth screens never touch the SDK directly.
Also exposes the profile adapter (`profileAdapter`) â€” the only path through
which app-v2 may reach the identity backend domain.

## Structure
- `auth/types.ts` â€” typed contracts (`IdentityAuthAdapter`, `AuthBackend`, `AuthResult`, â€¦)
- `auth/auth-adapter.ts` â€” orchestration + safe error mapping (Polish, no provider internals)
- `auth/supabase-client.ts` â€” the ONLY module importing `@supabase/supabase-js`
- `profile/types.ts` â€” typed contracts (`OnboardingProfileAdapter`, result types incl. `UpdateMyProfileResult`)
- `profile/profile-adapter.ts` â€” the ONLY module importing the backend identity domain (`@server/domains-v2/identity/public-api`); exposes `getMyProfile` / `getPublicProfile` / `completeOnboarding` / `updateMyProfile`
- `profile/index.ts` â€” feature-scoped barrel
- `index.ts` â€” public entrypoint exposing `identityAuthAdapter` and `profileAdapter`

## Constraints
- Must not import from other feature domains' internal modules
- Must not import legacy code
- Only the Supabase anon/public key is used (frontend). The service role key and
  any database connection string must never reach the frontend.
- Onboarding PII (phone, date of birth) must not be written to auth metadata or
  to localStorage/sessionStorage â€” it goes only through `profileAdapter`.

## Not done yet
- No Supabase profile repository yet â€” `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`. SQL migration committed in `supabase/migrations/0001_identity_private_profiles.sql` (not applied).
- No HTTP transport â€” `profileAdapter` is in-memory only, state volatile across reloads.
- No protected app route after login (login still routes to `/onboarding`).
- No live end-to-end verification in this change (requires Supabase project + browser).

## Canonical governance

- Rules Registry: `docs/governance/RULES_REGISTRY.yml` (repo root)
- Governance Index: `docs/governance/GOVERNANCE_INDEX.md` (repo root)
- Domain Status Registry: `docs/governance/DOMAIN_STATUS_REGISTRY.yml` (repo root)
- Status Taxonomy: `docs/governance/STATUS_TAXONOMY.md` (repo root)

Local exceptions: none
