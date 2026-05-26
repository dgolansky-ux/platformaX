# STEP 33 — Profile runtime wiring (identity + media refs)

**Status:** `PROFILE_RUNTIME_WIRING_PR_READY`

> Report file is named `STEP_33_REPORT.md` (not `_REVIEW.md` as the task phrased
> it) because only `*_REPORT.md` is validated by `check-pre-commit-decision`,
> `check-self-audit-evidence` and `check-review-reports-index`. Rules win over
> the command wording.

## Scope

Wire `/profile` to the real identity public-api and resolve avatar/banner refs
through the media public-api, while keeping the existing mobile-first visual
shell intact and the feed/social/professional layers as honest visual shells.

- `client/src/features-v2/identity/profile/profile-adapter.ts` gained
  `updateMyProfile` (mapped to `identity.service.updatePrivateProfile`).
- New composition layer `client/src/app-v2/profile/data/` orchestrates
  auth + identity + media into a `PersonalProfileView`. Includes:
  - `profile-view-model.ts` — DTO → view mapping + media URL resolution.
  - `fetchProfileData.ts` — pure async state machine
    (`loading|anonymous|ready|empty|error`).
  - `useProfileData.ts` — React hook over `fetchProfileDataOnce`.
  - `useProfileBioEdit.ts` — owner-only bio update through identity.
- `ProfilePage.tsx` now uses `useProfileData` and falls back to the demo fixture
  for anonymous viewers, surfacing empty / error states explicitly.
- Owner-only `ProfileBioSheet` for editing bio through `updateMyProfile`.
- `ProfileAvatar`/`ProfileBanner` accept resolved media URLs.
- Extracted `ProfileTopBar` and `ProfileRuntimeBanner` from `ProfilePage` so the
  route stays under the component-line guard limit.

NOT in scope (deliberately):
- Friend feed runtime, social graph, comments/reactions runtime
  → `FEED_RUNTIME_NOT_STARTED`.
- Professional profile backend → `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED`.
- Live db push, Supabase migrations applied, Railway.
- Bio max-length is enforced at the boundary; full owner-editor for
  firstName/lastName/phone/dateOfBirth is deferred to the next slice.

## Architecture Impact Statement

- **Domains touched:** `identity` (frontend adapter widened with
  `updateMyProfile`), `media` (consumed via public-api), `app-v2/profile`
  (composition + UI). No backend domain internals changed.
- **Ownership:** identity owns the profile; media owns asset URL resolution;
  app-v2 only composes them. The shell never reaches into identity/media
  repositories, services, mappers or policies — only their public-api
  surfaces / typed feature adapters.
- **Cross-domain:** `client/src/features-v2/identity/profile/profile-adapter.ts`
  is the single place importing `@server/domains-v2/identity/public-api`;
  `client/src/features-v2/media/media-adapter.ts` is the single place importing
  `@server/domains-v2/media/public-api`. `client/src/app-v2/profile/data/*`
  imports only the feature barrels (`features-v2/identity`, `features-v2/media`)
  and identity's public-api **types** for DTO shapes (no runtime values from
  another feature; identity's feature barrel does not import media).
- **No new business domain** added (no `professional-profile`, no `feed`).
- **Backend repository unchanged** — same in-memory adapter as PR #17;
  onboarding writes and `/profile` reads share the default service instance, so
  a completed onboarding round-trips into the runtime profile view within the
  same session.

## Identity integration summary

- Identity public-api consumed via `profileAdapter`:
  - `getMyProfile(userId)` — owner-only `PrivateProfileDTO` for the runtime view.
  - `getPublicProfile(viewerId, profileUserId)` — public projection (no PII).
  - `updateMyProfile(userId, input)` — wraps `updatePrivateProfile` for owner
    bio updates (and accepts `avatarMediaRef` / `bannerMediaRef` patches when a
    media confirm slice lands).
- View mapper drops every private field (`phone`, `dateOfBirth`) from the owner
  `PersonalProfileView` shape — owner-view DTO PII safety is asserted by tests
  (`profile-view-model.test.ts`, `fetchProfileData.test.ts`).
- Identity validation errors surface as typed result codes
  (`INVALID_INPUT`, `NOT_FOUND`, `FORBIDDEN`) — the bio sheet surfaces the
  field-level message rather than swallowing it.

## Media refs integration summary

- Avatar/banner URLs are resolved through `mediaAdapter.getPublicMediaUrl`
  (single fixed-cap parallel pair — `MAX_PROFILE_MEDIA_REFS = 2`).
- With `STORAGE_ADAPTER_ENV_REQUIRED`, asset records have `publicUrl: null`, so
  the view falls back to the initial letter / gradient banner. The shell never
  fabricates a URL.
- Identity stores only `MediaAssetRef = { assetId }`; the profile UI never sees
  storage keys, owner ids or byte sizes (media public-mapper-no-leak guarantees
  that at the DTO layer).
- No `base64`/`dataUrl`/`readAsDataURL`/`FileReader` runtime — `check-media-base64`
  PASS and the profile-source scan in `ProfilePage.test.tsx` / `ProfileRuntime.test.tsx`
  re-asserts the absence.

## Public/private DTO safety

- The owner `PersonalProfileView` is constructed with an explicit allowlist of
  fields. Tests assert `JSON.stringify(view)` does not include `phone`,
  `dateOfBirth`, or any phone-shaped digit string.
- Public viewers use `toPublicPersonalProfileView`, which maps the strictly
  PII-free `PublicProfileDTO` and renders social/feed/contact sections as empty
  (no fixture leak through the public surface).
- Existing `ProfilePage.test.tsx` PII assertion still passes (no phone-shaped
  digits, `dateofbirth` substring, e-mail pattern, or `<input type="tel">` in
  the rendered DOM).

## No feed runtime / no professional backend / no legacy

- `ProfileQuickFeed` and `ProfileContacts` continue to render only their
  `fixtures.ts` data (visual shell, blueprint §16); the runtime never queries a
  social or content-v2 boundary — those domains remain `PLANNED`.
- `ProfileProfessionalLayer` is unchanged — a visible mode of the same identity
  profile, never a separate domain (blueprint §0).
- No legacy runtime imports; `audit-domain-boundaries`, `check-no-legacy-imports`
  and the per-test source-scan all PASS.

## Status truth

- `PROFILE_RUNTIME_PARTIAL` — composition layer wired; runtime depends on the
  in-memory identity boundary.
- `IDENTITY_PROFILE_RUNTIME_PARTIAL` — unchanged from PR #17; `isPersistent: false`.
- `MEDIA_REFS_RUNTIME_PARTIAL` — refs are read/passed; live media storage still
  env-required (PR #20).
- `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED`.
- `FEED_RUNTIME_NOT_STARTED`.
- `BIO_RUNTIME_PARTIAL` (only field with a wired owner-update path so far).
- `LIVE_UPLOAD_NOT_STARTED` (inherited from PR #20).

## Largest files after change (lines)

| Lines | File |
|---|---|
| 177 | client/src/app-v2/profile/ProfilePage.tsx |
| 118 | client/src/app-v2/profile/sections/ProfileBioSheet.tsx |
| 108 | client/src/app-v2/profile/data/profile-view-model.ts |
| 71  | client/src/app-v2/profile/data/useProfileBioEdit.ts |
| 65  | client/src/app-v2/profile/data/fetchProfileData.ts |
| 64  | client/src/features-v2/identity/profile/profile-adapter.ts |
| 60  | client/src/app-v2/profile/data/useProfileData.ts |

Within guard limits: route/page ≤ 280, regular .tsx ≤ 220, CSS module ≤ 320,
function ≤ 80, component ≤ 140.

## PRE-COMMIT DECISION

- **Changed files:**
  - `client/src/features-v2/identity/{index.ts, profile/{index.ts, types.ts,
    profile-adapter.ts, __tests__/profile-adapter.test.ts}}` — `updateMyProfile`
    on the adapter + identity barrel export + tests.
  - `client/src/app-v2/profile/data/{profile-view-model.ts, fetchProfileData.ts,
    useProfileData.ts, useProfileBioEdit.ts, __tests__/{profile-view-model.test.ts,
    fetchProfileData.test.ts}}` (new composition layer).
  - `client/src/app-v2/profile/{ProfilePage.tsx, types.ts, fixtures.ts}` — wire
    runtime, expand view model with optional avatar/banner URLs + public fixture.
  - `client/src/app-v2/profile/sections/{ProfileTopBar.tsx, ProfileRuntimeBanner.tsx,
    ProfileBioSheet.tsx, ProfileAvatar.tsx, ProfileBanner.tsx, ProfileHeader.tsx}`
    — new components + pass-through of `avatarUrl`/`bannerUrl`.
  - `client/src/app-v2/profile/__tests__/ProfileRuntime.test.tsx` — runtime
    boundary scan + state assertions.
  - `client/src/app-v2/profile/styles/{profile-layout.module.css,
    profile-media.module.css}` — runtime banner + avatar `<img>` styles.
  - `client/src/app-v2/onboarding/__tests__/OnboardingFlow.test.tsx` — add the
    new `updateMyProfile` field to the test adapter.
  - `docs/review/step-33-profile-runtime-wiring/STEP_33_REPORT.md` (this).
  - `docs/review/REVIEW_REPORTS_INDEX.md` (this PR adds the step entry).
- **Domains touched:** `identity` (frontend adapter), `media` (consumed via
  public-api), `app-v2/profile` (composition + UI).
- **Cross-domain imports:** identity backend via `features-v2/identity` barrel
  only; media backend via `features-v2/media` barrel only.
- **Legacy runtime imports:** none.
- **Removed routes/nav/build chunks:** none.
- **Public DTO PII:** none — `check-public-dto-pii` PASS; view-model + adapter
  tests assert no PII enters the view.
- **Media base64/dataUrl:** none — `check-media-base64` PASS; no
  `readAsDataURL`/`FileReader` in profile sources.
- **List pagination/limit/cursor:** N/A — no list runtime added (single
  owner profile; social/feed remain mock).
- **Fake DONE/status truth:** none — adapter `isPersistent: false`; statuses
  set to PARTIAL/NOT_STARTED honestly.
- **Env safety:** no secrets touched; no `SERVICE_ROLE_KEY`/`DATABASE_URL` in
  the client; Supabase SDK still only in `features-v2/identity/auth/supabase-client.ts`.
- **TypeScript:** `pnpm check` PASS.
- **V2 lint:** `pnpm lint` PASS (full lint, `--max-warnings=0`; `pnpm lint:v2`
  is the V2-scoped subset and also PASS).
- **Tests:** 61 files / 427 tests PASS (full suite).
- **Build:** `pnpm build` PASS.
- **Commit decision:** PROCEED.

## SELF-AUDIT / INDEPENDENT REVIEW PASS

- **What I changed:** added an app-v2 composition layer (`profile/data/`) and a
  bio edit sheet; extended the identity frontend adapter with `updateMyProfile`;
  wired `ProfilePage` to runtime; split the page into `ProfileTopBar` +
  `ProfileRuntimeBanner` to keep the component under the line guard.
- **What I might have broken:**
  - `OnboardingFlow.test.tsx` mock adapter — fixed by adding the new
    `updateMyProfile` field.
  - Existing `ProfilePage.test.tsx` — verified to still PASS (20 tests); the
    anonymous fallback preserves the demo fixture render path.
  - `ProfileMediaSheet.test.tsx` — still PASS; the media sheet now receives
    `userId="me"` while anonymous, unchanged from the prior placeholder.
- **Domain boundaries affected:** identity adapter widened (intended); no other
  domain's internals touched.
- **Cross-domain imports check:** `audit-domain-boundaries` PASS; `features-v2/
  identity` and `features-v2/media` are imported by `app-v2/profile` only via
  the feature barrels (allowed for the composition layer). Identity does NOT
  import media.
- **Legacy/runtime check:** profile-source scan in `ProfileRuntime.test.tsx`
  asserts no `@supabase/supabase-js`, no `domains-v2/*/service|repository|
  mapper|policy` deep imports, no `localStorage`/`sessionStorage` runtime,
  no `base64`/`dataUrl`/`FileReader`/`readAsDataURL`.
- **Fake DONE/status truth check:** `check-status-truth-consistency` PASS;
  statuses set honestly (PARTIAL/NOT_STARTED).
- **PII/base64/secrets check:** `check-public-dto-pii`, `check-media-base64`,
  `check-logging-pii-security`, `check-secret-scan`, `check-local-secret-scan`
  — all PASS.
- **Routes/nav/build graph check:** no routes/nav removed; `check-build-artifacts`
  PASS; `validate-bundle.mjs --smoke` PASS.
- **Guard weakening check:** no guards weakened; one fixed-cap `Promise.all(
  pending)` uses a `MAX_PROFILE_MEDIA_REFS = 2` constant + `.slice(0, MAX_…)`
  so `check-scalability-patterns` reads a visible cap (no exception marker
  used, no allowlist edit). No `--no-verify`. No `eslint-disable`. No `as any`.
- **Evidence reviewed:** scalability guard source (`promise-all-unbounded` rule),
  identity service/policy/contracts/dto, media service/dto/contracts, frontend
  adapters and types, existing profile tests, audit-domain-boundaries rules.
- **Gates run:** see below.
- **Remaining risks:**
  - In-memory identity repository — onboarding state still wipes on reload.
    Documented; `isPersistent: false` exposed via the adapter + the onboarding
    "finished" screen.
  - The runtime banner appears above the visual shell; tested under empty/error
    states via the new `fetchProfileData.test.ts`, but the rendered banner
    layout is unverified on real hardware in this PR.
  - Only `bio` has a wired owner edit path. firstName/lastName/phone/
    dateOfBirth will need a fuller editor later (BIO_RUNTIME_PARTIAL).

## Gates

- `pnpm check` — PASS
- `pnpm lint` — PASS (`--max-warnings=0`)
- `pnpm test` — PASS (61 files / 427 tests, with `NODE_OPTIONS=--max-old-space-size=8192`
  to avoid worker OOM on this machine)
- `pnpm build` — PASS
- `pnpm rules:check` — PASS (28/28)
- `pnpm arch:check:v2` — PASS
- `pnpm guards:all-local` — PASS
- `node scripts/check-build-artifacts.mjs` — PASS
- BRAMKA acceptance — 25/25 PASS

## Honest limitations

- `PROFILE_RUNTIME_PARTIAL` — identity boundary is still the in-memory adapter
  (`isPersistent: false`); state wipes on reload.
- `LIVE_UPLOAD_NOT_STARTED` — media storage is env-required (PR #20); a
  confirmed upload cannot complete, so the avatar/banner URL is `null` end-to-end.
- `FEED_RUNTIME_NOT_STARTED` — quick feed / contacts / social links remain
  fixtures; no `content-v2`/`social` boundary is wired.
- `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED` — professional layer still a
  visual shell, blueprint §0.
- Status emoji/availability — only `bio` is wired to identity; status emoji /
  state / visibility need a future DTO slice (blueprint §10).
- The new tests rely on a typed in-memory identity service; no live DB push,
  no remote migration, no Railway.
- `ZIP_NOT_GENERATED_BY_OPUS`.
