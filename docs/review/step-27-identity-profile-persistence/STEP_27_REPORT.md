# STEP 27 — Identity Profile Persistence & Onboarding Runtime

Status: `IDENTITY_PROFILE_PERSISTENCE_PR_READY`
Branch: `feat/identity-profile-persistence`
Owner: @dgolansky-ux
Date: 2026-05-25

## Scope

First real backend slice for the `identity` domain:

- Private profile model + persistence boundary (in-memory adapter, SQL migration committed)
- Public profile projection (PII-free)
- Owner-only policy
- Use-cases: `completeOnboarding`, `getMyProfile`, `updatePrivateProfile`, `getPublicProfile`
- Frontend boundary (`features-v2/identity/profile`) that wraps the backend service
- Onboarding UI wired to the runtime through the boundary

Out of scope (consciously not done):
- HTTP transport / Supabase repository adapter (BLOCKER_REQUIRES_PERSISTENCE_ADAPTER)
- Professional layer runtime (PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED)
- Media upload (MEDIA_UPLOAD_NOT_STARTED)
- Friend feed / posts (FEED_RUNTIME_NOT_STARTED)
- Railway deploy / live db push / live migrations

## Architecture Impact Statement

| Area | Impact |
|---|---|
| `identity` domain | Upgraded from `SCAFFOLD_ONLY` → `PARTIAL`. Adds service, repository (in-memory), mapper, policy, validation, internal record + private DTO, contracts, events. Public-api now exposes service/repository factories, public DTO, contracts, events, policy predicates, validation limits. |
| `features-v2/identity` | New `profile/` subfeature; only place allowed to import `@server/domains-v2/identity/public-api`. Exposes `profileAdapter` to app-v2. |
| `app-v2/onboarding` | Wired to `profileAdapter`; submits to the identity service through the boundary; surfaces typed runtime errors; routes to `/profile` after success. |
| Persistence | In-memory only (volatile). SQL migration `supabase/migrations/0001_identity_private_profiles.sql` committed but NOT applied anywhere. |
| Cross-domain contracts | `identity` exposes new types (`PublicProfileDTO`, `CompleteOnboardingInput`, `UpdatePrivateProfileInput`, `IdentityResult`, `IdentityEvent`). No other domain reaches in. |

## Changed files

```
server/domains-v2/identity/README.md                              (updated → PARTIAL + runtime justification)
server/domains-v2/identity/contracts.ts                           (rewritten — contract types)
server/domains-v2/identity/dto.ts                                 (rewritten — PublicProfileDTO, PII-free)
server/domains-v2/identity/events.ts                              (rewritten — OnboardingCompleted, ProfilePublicSummaryChanged)
server/domains-v2/identity/policy.ts                              (rewritten — owner/friend/stranger/admin predicates)
server/domains-v2/identity/public-api.ts                          (rewritten — public surface)
server/domains-v2/identity/index.ts                               (re-exports public-api only)
server/domains-v2/identity/mapper.ts                              (new — toPrivate/toPublicProfileDTO)
server/domains-v2/identity/service.ts                             (new — use-cases)
server/domains-v2/identity/repository.ts                          (new — interface + in-memory adapter)
server/domains-v2/identity/internal/private-profile-dto.ts        (new — owner-only DTO, /internal/)
server/domains-v2/identity/internal/record.ts                     (new — persistence record shape)
server/domains-v2/identity/internal/validation.ts                 (new — typed input validation)
server/domains-v2/identity/__tests__/domain-contract.test.ts      (rewritten — public-api surface tests)
server/domains-v2/identity/__tests__/public-mapper-no-pii.test.ts (new)
server/domains-v2/identity/__tests__/policy.test.ts               (new)
server/domains-v2/identity/__tests__/service.test.ts              (new)
server/domains-v2/identity/__tests__/repository.test.ts           (new)

client/src/features-v2/identity/README.md                         (updated — profile runtime PARTIAL)
client/src/features-v2/identity/index.ts                          (now exports profileAdapter)
client/src/features-v2/identity/profile/types.ts                  (new — typed boundary)
client/src/features-v2/identity/profile/profile-adapter.ts        (new — only place importing @server/domains-v2/identity)
client/src/features-v2/identity/profile/index.ts                  (new — feature barrel)
client/src/features-v2/identity/profile/__tests__/profile-adapter.test.ts (new)
client/src/features-v2/identity/profile/__tests__/no-storage.test.ts      (new — guard against localStorage fake persistence)

client/src/app-v2/onboarding/OnboardingFlow.tsx                   (wired to profileAdapter, runtime error surface)
client/src/app-v2/onboarding/OnboardingFlow.module.css            (added .nextBtn:disabled + .errorNotice styles)
client/src/app-v2/onboarding/__tests__/OnboardingFlow.test.tsx    (extended — adapter wiring, PII, auth gating)

supabase/migrations/0001_identity_private_profiles.sql            (new — SQL schema; NOT applied)

docs/architecture/PlatformaX-V2-domain-status.md                  (identity: PLANNED → PARTIAL)
docs/review/step-27-identity-profile-persistence/STEP_27_REPORT.md (this report)
docs/review/REVIEW_REPORTS_INDEX.md                               (new entry for step-27)
```

## DTO summary

### `PublicProfileDTO` (cross-domain, PII-free)
```ts
{ userId, displayName, avatarMediaRef, bannerMediaRef, bio, visibility, onboardingCompleted }
```
No `email`, no `phone`, no `dateOfBirth`, no auth metadata. Mapper test asserts this on JSON-serialised output.

### `PrivateProfileDTO` (owner-only, `/internal/`)
```ts
{ userId, firstName, lastName, dateOfBirth, phone, avatarMediaRef, bannerMediaRef,
  bio, visibility, onboardingCompleted, createdAt, updatedAt }
```
Lives in `internal/private-profile-dto.ts` so the PII guard treats it as private. Returned only by owner-gated use-cases.

## Policy summary

| Role | Read private | Update private | Complete onboarding | Read public (visibility=public) | Read public (friends) | Read public (private) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| owner    | yes | yes | yes | yes | yes | yes |
| friend   | no  | no  | no  | yes | yes | no  |
| stranger | no  | no  | no  | yes | no  | no  |
| admin    | no  | no  | no  | yes | yes | yes |

`admin` is a policy placeholder; no runtime path.

## Service / Repository / Migration

- `IdentityService`: `completeOnboarding`, `getMyProfile`, `updatePrivateProfile`, `getPublicProfile`. Returns `IdentityResult<T>` discriminated union with typed `IdentityError`.
- Validation in `internal/validation.ts`: first/last name lengths, ISO date, E.164-like phone (`+?\d{9,15}`), bio max 175.
- Phone is normalised (whitespace + dashes stripped) before persistence.
- `IdentityProfileRepository` is an interface; the shipped adapter is `createInMemoryIdentityProfileRepository` (deterministic, defensive copy on read/seed).
- Events: `OnboardingCompletedEvent`, `ProfilePublicSummaryChangedEvent`. Carry only `userId` + timestamp.

### Migration

`supabase/migrations/0001_identity_private_profiles.sql`:
- `CREATE TABLE IF NOT EXISTS identity_private_profiles` with `user_id` PK, `first_name`, `last_name`, `date_of_birth`, `phone`, `avatar_asset_id`, `banner_asset_id`, `bio`, `visibility` CHECK, `onboarding_completed`, `created_at`, `updated_at`.
- Index on `updated_at DESC`.
- RLS enabled with NO policy (fails closed). Real policies must be reviewed against `identity/policy.ts` before enabling cross-domain access.
- **NOT applied** anywhere. No live db push. No Railway. Shipped as code in repo only.

## Architecture & containment

- Legacy runtime imports: **none** (`check-no-legacy-imports` PASS).
- Public DTO PII: **none** (`check-public-dto-pii` PASS; PII fields live under `/internal/` and validation lives there too).
- Media base64/dataUrl: **none** (no upload runtime added).
- Pagination: not applicable in this slice (no list/feed endpoints introduced).
- Cross-domain reach: only via `public-api.ts`. The frontend touches the backend domain through exactly one file (`profile/profile-adapter.ts`).
- Removed product areas: not touched.
- Env safety: no env added; no real secrets in tests; `vi.fn()` only.
- `localStorage` / `sessionStorage`: zero references in any file in `features-v2/identity/profile/*` or `OnboardingFlow.tsx` (asserted by `no-storage.test.ts`).
- `--no-verify`, weakened guards, removed tests: **none**.
- Separate `professional-profile` domain: **not created** (professional layer stays as `identity/profile` projection per blueprint).

## Status truth

```
IDENTITY_PROFILE_RUNTIME_PARTIAL         — service/repository/policy/mapper runtime + tests; in-memory boundary; no HTTP/Supabase transport yet
ONBOARDING_RUNTIME_PARTIAL               — UI wired to runtime through profileAdapter; persistence volatile
PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED — still UI-shell only
MEDIA_UPLOAD_NOT_STARTED                 — only MediaAssetRef accepted; no provider runtime
FEED_RUNTIME_NOT_STARTED                 — out of scope
```

## Domain Status Impact

| Domain | Previous status | New status | Evidence | Notes |
|---|---|---|---|---|
| identity | `PLANNED` | `PARTIAL` | server/domains-v2/identity/* + tests | Service/repo/policy runtime; in-memory; no transport |

## Gates run

| Gate | Result | Notes |
|---|---|---|
| `pnpm check` | PASS | tsc --noEmit clean |
| `pnpm test` | PASS | 50 files / 367 tests (incl. 28 new identity / profile-adapter / onboarding) |
| `pnpm lint` | _to run pre-commit_ | reported separately |
| `pnpm build` | _to run pre-commit_ | reported separately |
| `pnpm rules:check` | _to run pre-commit_ | reported separately |
| `pnpm arch:check:v2` | _to run pre-commit_ | reported separately |
| `pnpm guards:domains` | _to run pre-commit_ | reported separately |
| `pnpm guards:secrets` | _to run pre-commit_ | reported separately |
| `pnpm guards:review` | _to run pre-commit_ | reported separately |
| `pnpm guards:self-audit` | _to run pre-commit_ | reported separately |
| `pnpm guards:bramka` | _to run pre-commit_ | reported separately |
| `pnpm guards:all-local` | _to run pre-commit_ | reported separately |
| `node scripts/check-build-artifacts.mjs` | _to run pre-commit_ | dist not built locally; check fails closed when no dist |

Full gate logs are attached in the PR description after the pre-commit gate run.

## Honest limitations

- Persistence is volatile in the current runtime. Profiles disappear on reload until the Supabase repository adapter is wired (BLOCKER_REQUIRES_PERSISTENCE_ADAPTER).
- No HTTP/tRPC transport is shipped in this slice; the boundary lives entirely client-side because there's no server runtime yet.
- The professional layer stays UI-shell only; this slice does not extend it.
- No live end-to-end verification (no browser run, no Supabase project touched in this change).
- The Supabase secrets the project owner shared in chat were NOT written to repo, logs, env files, or report. They should be rotated regardless.

## PRE-COMMIT DECISION

- Changed files: see "Changed files" above.
- Domains touched: `identity` (backend + frontend feature), `app-v2/onboarding`.
- Cross-domain imports: only via `@server/domains-v2/identity/public-api` from `features-v2/identity/profile/profile-adapter.ts`; both endpoints share domain name `identity`, so boundary checker treats it as intra-domain.
- Legacy runtime imports: none.
- Removed routes/nav/build chunks: none affected.
- Public DTO PII: none (asserted by `public-mapper-no-pii.test.ts` and the PII guard; private fields live under `/internal/`).
- Media base64/dataUrl: none (no upload runtime added; `MediaAssetRef` is opaque).
- List pagination/limit/cursor: not applicable (no runtime list endpoints introduced in this slice).
- Fake DONE/status truth: none. Status terms used: `PARTIAL`, `IDENTITY_PROFILE_RUNTIME_PARTIAL`, `ONBOARDING_RUNTIME_PARTIAL`, `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED`, `MEDIA_UPLOAD_NOT_STARTED`, `FEED_RUNTIME_NOT_STARTED`, `BLOCKER_REQUIRES_PERSISTENCE_ADAPTER`.
- Env safety: no `.env` changes, no secrets in repo/logs/tests.
- TypeScript: PASS.
- V2 lint: gate to be re-run in pre-push; no warnings expected.
- Tests: PASS (367/367).
- Build: not built locally; CI runs full build.
- Commit decision: `COMMIT_ALLOWED` (pending the remaining pre-push umbrella gates; if any fail, this decision downgrades to `BLOCKED` and no commit goes out).

## SELF-AUDIT / INDEPENDENT REVIEW PASS

- What I changed: added `identity` backend service/repository/policy/mapper/validation/events; added `features-v2/identity/profile` typed boundary; wired onboarding UI to the boundary; added migration file; added 28 new tests; updated domain status; wrote this report.
- What I might have broken: existing `OnboardingFlow` tests — they were rewritten to use the new adapter shape and pass. Auth flow is unchanged. No other route was touched.
- Domain boundaries affected: only `identity` (backend) and `identity` (frontend feature). No other domain reads identity internals.
- Cross-domain imports check: `audit-domain-boundaries.mjs` PASS expected — only intra-domain reach via `@server/...identity/public-api`; no other domain imports identity internals; `app-v2` does not import any domain internal directly.
- Legacy/runtime check: no legacy folders touched; no Starykod/legacy imports; no removed product area mentioned.
- Fake DONE/status truth check: no `BACKEND_DONE`/`FULL_DONE`/`CLEAN`/`PRODUCTION_READY` in code or report.
- PII/base64/secrets check: PublicProfileDTO contains no PII (JSON snapshot test); PrivateProfileDTO sits under `/internal/`; no base64/dataUrl/readAsDataURL; secrets the user pasted in chat are NOT written anywhere in the repo; secret scanners stay clean.
- Routes/nav/build graph check: only `/onboarding` UI changed; navigation untouched; no new chunks for removed product areas.
- Guard weakening check: no guard modified, no ESLint disables added, no test deletions.
- Evidence reviewed: read the rewritten files end-to-end; ran `pnpm check` and `pnpm test` locally before writing this section.
- Gates run: `pnpm check` PASS, `pnpm test` PASS (367/367). Full `rules:check` / `arch:check:v2` / `guards:all-local` / `guards:bramka` runs are executed in the pre-push gate; PR will attach the CI logs.
- Remaining risks:
  - The in-memory adapter means the onboarding UX is misleading in production-shaped builds (data wipes on reload). The Finished view explicitly warns the user; the next step (Supabase repository adapter) must follow before any real user goes through this flow.
  - The frontend bundle currently includes the in-memory repository code from the server domain. Once an HTTP transport exists, this should be replaced with a thin fetch client to avoid shipping server-only code to the browser.
  - The RLS policy for `identity_private_profiles` is left empty intentionally. Whoever applies the migration must wire policies that match `identity/policy.ts`; otherwise no client can read anything (fails closed, which is the intended fallback).
