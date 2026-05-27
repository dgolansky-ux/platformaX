# Step 47 — Personal Profile Core Runtime in Identity

Status: `PERSONAL_PROFILE_CORE_RUNTIME_SERVER_READY_NOT_FULLY_WIRED`
Date: 2026-05-27
Branch: `feat/personal-profile-core-runtime`

## Scope

Backend / runtime slice that extends the `identity` domain with the personal
profile core fields and the matching application-layer use-cases. No HTTP
transport, no real media upload, no Supabase db push, no Railway, no UI polish.

## What was added

### Identity domain
- New value types in `dto.ts`: `PersonalStatusVisibility`, `PersonalStatusDTO`,
  `CivilStatus`, `SocialLinkKind`, `SocialLinks`.
- `PrivateProfileRecord` (internal) extended with: `location`, `profileSlug`,
  `statusText`, `statusEmoji`, `statusDescription`, `statusVisibility`,
  `statusPhotoAssetId`, `civilStatus`, `socialLinks`.
- `PrivateProfileDTO` (owner-only) exposes the new fields plus a composed
  `personalStatus` block.
- `PublicProfileDTO` exposes the new public-safe fields and a composed
  `personalStatus` that is filtered by the mapper based on viewer role:
  - `private` → never sent to non-owners,
  - `friends_only` → only sent to a resolved `friend` viewer (no social
    runtime yet, so strangers correctly stay blind),
  - `public` → sent to everyone with profile access.
- New use-cases on `IdentityService`:
  - `updatePersonalStatus(userId, input)` — owner-only.
  - `clearPersonalStatus(userId)` — owner-only.
  - `attachAvatarMediaRef(userId, assetId)`,
    `attachBannerMediaRef(userId, assetId)`,
    `attachStatusPhotoMediaRef(userId, assetId)` — thin setters; the
    application layer validates media-asset ownership/purpose/ready before
    calling these.
- `updatePrivateProfile` now accepts `location`, `profileSlug`, `civilStatus`,
  `socialLinks` with server-side validation: slug regex + 3–32 length,
  `https://` requirement on social links, closed-enum check on `civilStatus`,
  80-char cap on `location`.
- Repository extended:
  - `findBySlug(slug)` lookup.
  - `update` now only assigns explicitly-present patch keys so omitted fields
    keep their prior value (regression-tested).
  - `CreateProfileRecordInput` / `UpdateProfileRecordPatch` extended.
- Forward-additive SQL migration
  `supabase/migrations/0003_identity_personal_profile_fields.sql`
  (NOT applied; no live db push, no destructive operations). Adds the new
  columns and a partial unique index on `profile_slug`.
- File-size discipline: `service.ts` split — `internal/onboarding.ts`
  (onboarding flow) and `internal/patch.ts` (patch builders) extracted to keep
  the use-case file under the backend service budget.

### Media domain (additive)
- New `MediaPurpose` value: `statusPhoto`. `MEDIA_VALIDATION_LIMITS.statusPhotoMaxBytes`
  set to 5 MB. `maxBytesFor` updated.
- New service method: `createStatusPhotoUploadIntent(userId, meta)`.
- `verifyProfileAssetForAttach` already covers the new purpose by virtue of
  the `MediaPurpose` widening — no extra method needed.

### application-v2/profile (extended)
- View DTOs extended with `profileSlug`, `location`, `civilStatus`,
  `socialLinks`, `personalStatus` and `PersonalStatusView` (with pre-resolved
  photo URL).
- New use-cases: `updatePersonalStatus`, `clearPersonalStatus`,
  `attachProfileStatusPhotoRef(userId, assetId)`. The status-photo attach
  goes through `media.verifyProfileAssetForAttach` with the new
  `statusPhoto` purpose before identity persists the ref.
- 9 new application service tests for personal status + new core fields.

### Frontend feature adapter
- `OnboardingProfileAdapter` extended with `updatePersonalStatus`,
  `clearPersonalStatus`, `attachProfileStatusPhotoRef`. The frontend never
  imports identity / media internals.

## What was intentionally NOT done

- No HTTP transport / controller. The frontend feature adapter still invokes
  the application service in-process.
- No real media storage backend — `STORAGE_ADAPTER_ENV_REQUIRED`.
- No live Supabase repository, no `supabase db push`, no Railway, no
  deployment.
- No professional profile runtime, no social graph, no friend feed, no
  content-v2 posts, no comments, no milestones, no communities.
- No UI polish. The frontend feature adapter is wired but no profile screen
  consumes the new fields yet (deliberate — UI is out of scope this step).
- No `localStorage` / `sessionStorage` fallback, no `readAsDataURL`, no
  base64 uploads, no SERVICE_ROLE_KEY in the frontend.
- No dependency added.
- No guard weakened. A local-only `.claude/settings.local.json` had a
  redundant `Bash(gh pr *)` wildcard that covered the dangerous `gh pr merge`
  command; it was tightened (removed the wildcard; specific entries for
  `gh pr view/create/list/checks/status` remain). The file is gitignored.

## Public DTO PII discipline

`PublicProfileDTO` test suite verifies:
- no `email`, `phone`, `dateOfBirth`, `phone`-related strings in the JSON,
- `friends_only` status hidden from `stranger`,
- `private` status hidden from `friend` too,
- `public` status visible to anyone with profile access.

## Status truth

| Surface | Previous | New |
|---|---|---|
| `server/domains-v2/identity` | `PARTIAL` | `PARTIAL` (core personal-profile fields + status runtime added) |
| `server/domains-v2/media` | `PARTIAL` | `PARTIAL` (`statusPhoto` purpose added — additive) |
| `server/application-v2/profile` | `PARTIAL` | `PARTIAL` (status + status-photo + new core fields composed) |
| social/content-v2/communities | unchanged | `SCAFFOLD_ONLY` / `NOT_CONNECTED` (unchanged) |

No domain promoted to `IMPLEMENTED`. No fake DONE.

## Final status

`PERSONAL_PROFILE_CORE_RUNTIME_SERVER_READY_NOT_FULLY_WIRED`

Identity owns the canonical personal-profile data (including status,
socialLinks, civilStatus, location, slug). The application layer composes
identity + media into view DTOs. The frontend feature adapter exposes the
new use-cases but the profile UI does not yet render them (out of scope).

## Gate results

| Gate | Result |
|---|---|
| `pnpm check` (tsc --noEmit) | PASS |
| `pnpm lint` (eslint --max-warnings=0) | PASS |
| `pnpm test` (vitest run, 532 tests) | PASS |
| `pnpm build` (vite build) | PASS |
| `pnpm rules:check` (43 guards) | PASS |
| `pnpm arch:check:v2` (9 gates) | PASS |

## Forbidden actions — explicit confirmation

- No `--no-verify` used. (PX-GOV-003)
- No direct push to main. (PX-GOV-004)
- No force push. (PX-GOV-004)
- No guard softened or removed. (PX-GOV-002 — only a local-machine permission
  wildcard was tightened.)
- No `localStorage`/`sessionStorage` fake backend. (active-rules §2)
- No base64 / dataUrl / readAsDataURL upload runtime. (PX-MEDIA-001)
- No PII added to any public DTO. (PX-SEC-001, PX-DTO-001)
- No legacy runtime imported. (PX-ARCH-001, PX-ARCH-002)
- No Supabase `db push` / live migration executed. Migration 0003 ships as
  code only. (PX-INFRA-002, PX-DB-001)
- No Railway action taken. (PX-INFRA-001)
- No dependency added. (PX-DEPS-001)
- No SERVICE_ROLE_KEY anywhere in the frontend graph. (PX-SEC-002)

## Self-audit

| Item | Result |
|---|---|
| Governance docs read before work (`PX-AI-001`) | YES |
| Status truth honored (`PX-AI-002`, `PX-STATUS-001`) | YES — final status is `SERVER_READY_NOT_FULLY_WIRED`, not `DONE` |
| 12-field SELF-AUDIT included | YES |
| `pnpm rules:check` PASS | YES |
| `pnpm arch:check:v2` PASS | YES |
| `pnpm check` PASS | YES |
| `pnpm lint` PASS | YES |
| `pnpm test` PASS | YES |
| `pnpm build` PASS | YES |
| No fake DONE (`PX-GOV-001`) | YES |
| No PII in any public DTO (`PX-SEC-001`) | YES — verified by `check-public-dto-pii` + new mapper tests |
| No guard weakened (`PX-GOV-002`) | YES |
| BLOCKED if rules conflict (`PX-AI-003`) | N/A — no rules conflict |

## Evidence

- Identity domain: `server/domains-v2/identity/{dto,contracts,mapper,service,repository,internal/record,internal/private-profile-dto,internal/validation,internal/patch,internal/onboarding,public-api}.ts`
- Identity tests: `__tests__/{service,repository,public-mapper-no-pii}.test.ts` (50 tests across these three)
- Media domain: `server/domains-v2/media/{dto,service,internal/validation}.ts`
- Application service: `server/application-v2/profile/{dto,service,public-api}.ts` + 9 new tests
- Frontend adapter: `client/src/features-v2/identity/profile/{types,profile-adapter,index}.ts`
- Forward-additive SQL: `supabase/migrations/0003_identity_personal_profile_fields.sql`
