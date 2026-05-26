# STEP 29 — Profile full parity & code quality fixes

**Status:** `PROFILE_FULL_PARITY_QUALITY_FIXES_PR_READY`

> Report file is named `STEP_29_REPORT.md` (not `_REVIEW.md` as the task
> phrased it) because `check-pre-commit-decision`, `check-self-audit-evidence`
> and `check-review-reports-index` validate `*_REPORT.md`. Rules win over
> command wording.
>
> Pre-flight bullet 5 in HAND004 names `docs/review/step-28-quality-guards-
> hardening/STEP_28_REVIEW.md`. The guard-hardening deliverable shipped on
> main as **step-30** (`docs/review/step-30-architecture-quality-scalability-
> guards/STEP_30_REVIEW.md`, PR #18). The pre-flight intent is satisfied — see
> `pnpm rules:check` (28/28) — but the report filename differs. Recorded here
> as a documentation note, not a blocker.

## Scope (delta vs `main`)

Tight cleanup pass after the profile runtime wiring landed in PR #22
(step-33). No new feature work; only status-truth, stale copy, no-op CTA
hygiene and supporting tests/docs.

- **Status truth (CZĘŚĆ E):** `feature-registry.ts` upgraded `identity` from
  `SCAFFOLD_ONLY` / `hasDomainLogic: false` to `PARTIAL` /
  `hasDomainLogic: true` (auth adapter + profile boundary + `updateMyProfile`
  are wired). Comment annotates the move so the next reviewer reads the
  reason without git blame. `media` already at `PARTIAL` — kept.
- **Stale copy (CZĘŚĆ F):** `CheckEmailRoute` now reads
  `adapter.isConfigured()` and renders different honest copy depending on
  whether Supabase env is wired (`Link aktywacyjny wysłany` vs. an explicit
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` not-configured notice). The
  prior "auth backend nie istnieje" wording was stale since PR #11
  (Supabase Auth adapter). `app-v2/README.md` and
  `features-v2/identity/README.md` updated to reflect the post-PR #22 runtime
  surface (auth `PARTIAL`, onboarding writes through `profileAdapter`, profile
  composes identity + media, bio edit wired).
- **No-op CTA (CZĘŚĆ D):**
  - `ProfileContacts.tsx` — contact cards were focusable buttons with no
    handler. Now `disabled`/`aria-disabled` with a per-contact honest
    `title` (social runtime not wired yet).
  - `ProfileStatusBar.tsx` — status pill was an enabled `button` for owners
    with no `onClick` (silent no-op). Now `disabled` for everyone with an
    honest hint pointing to the missing status DTO slice
    (blueprint §10).
- **Tests:** `CheckEmailRoute.test.tsx` rewritten to inject a typed
  `authAdapter` fake and assert both configured / not-configured copy paths
  (plus the existing URL-PII guard and `/onboarding` link).
- **Docs:** `docs/review/step-29-profile-full-parity-quality-fixes/
  STEP_29_REPORT.md` + `PROFILE_PARITY_AUDIT.md`; `REVIEW_REPORTS_INDEX.md`
  entry; `docs/handoff/TODO.md` updated.

## Architecture Impact Statement

- **Domains touched:** `app-v2/profile` (UI hygiene only), `app-v2/auth`
  (CheckEmailRoute copy), `features-v2` (status registry + READMEs). No
  backend code changed. No cross-domain wiring changed.
- **Ownership:** unchanged. Identity owns the profile, media owns assets,
  social/feed remain `PLANNED`.
- **Cross-domain:** none introduced. `CheckEmailRoute` now consumes
  `identityAuthAdapter.isConfigured()` through the existing `features-v2/
  identity` barrel — same path used elsewhere in `app-v2`.
- **No new business domain.** Professional layer is still a *mode* of the
  same identity profile (blueprint §0).
- **Boundary guard:** `audit-domain-boundaries` PASS.

## Legacy parity status (CZĘŚĆ A / B / C)

- Legacy source `~/Desktop/Starykod-4` is not present on this machine, so a
  pixel-by-pixel parity audit cannot be re-run in this PR. The mobile shell
  parity work performed in PR #16 (step-22 → step-26) and the visual fidelity
  of `ProfileQuickFeed`, `FloatingNav`, `ProfileHeader`, `ProfileContacts`
  and the professional layer remain `MANUAL_REVIEW_REQUIRED` per their
  original step reports — none of those reports were downgraded by this PR.
- The supporting `PROFILE_PARITY_AUDIT.md` lists each profile area, who owns
  the most recent parity decision (step-22 → step-33), and explicit
  `VISUAL_DELTA` entries — including the legacy-source unavailability as a
  documented limitation rather than a fake DONE.

## Code quality (CZĘŚĆ G)

- No file exceeds its guard limit. Largest files unchanged from PR #22:
  `OnboardingFlow.tsx` 301 lines (has `QUALITY_STRUCTURE_EXCEPTION` marker
  scheduled for split when step count stabilises), `ProfilePage.tsx`
  177 lines (route limit 280), `profile-header.module.css` 354 lines
  (has `QUALITY_STRUCTURE_EXCEPTION` marker), all other CSS modules
  ≤ 320 lines.
- No new exceptions added. `check-file-size-limits` and
  `check-code-quality-structure` PASS.

## Status truth

- `app-v2/profile` — `PROFILE_RUNTIME_PARTIAL` (no change from PR #22).
- `identity` (features-v2) — `PARTIAL` (registry now matches README).
- `media` (features-v2) — `PARTIAL` (unchanged).
- All other features — `SCAFFOLD_ONLY` (unchanged).
- `FEED_RUNTIME_NOT_STARTED`, `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED`,
  `LIVE_UPLOAD_NOT_STARTED` (unchanged).

## VISUAL_DELTA (open items, MANUAL_REVIEW_REQUIRED)

| Area | Owner | Delta vs legacy | Reason |
|---|---|---|---|
| `ProfileHeader` | step-22 | none expected | shell shipped PR #16; not re-audited here (legacy unavailable) |
| `ProfileContacts` carousel auto-scroll | step-22 | requestAnimationFrame engine + duplication when ≥4 friends was deferred | needs social runtime; out of scope |
| `ProfileQuickFeed` skeleton timing | step-22 | 350ms stub vs legacy shimmer (verified in PR #16); not re-checked | needs side-by-side comparison |
| Status pill micro-animations | step-22 | pulse/sparkle CSS shipped; runtime edit deferred | DTO §10 not built |
| Professional editor sheet copy | step-24 | placeholder copy retained | profession editor is a later PR |
| Floating nav slide/bounce timings | step-22 | shipped, parity not re-verified vs legacy | legacy source unavailable |

Each `VISUAL_DELTA` row is a known-shortcoming acknowledgement, not a fake
DONE — the parent step reports already keep them `MANUAL_REVIEW_REQUIRED`.

## Largest files after change (lines)

| Lines | File |
|---|---|
| 301 | client/src/app-v2/onboarding/OnboardingFlow.tsx (exception marker) |
| 177 | client/src/app-v2/profile/ProfilePage.tsx |
| 149 | client/src/app-v2/auth/RegisterRoute.tsx |
| 141 | client/src/app-v2/profile/sections/ProfileProfessionalActivities.tsx |
| 134 | client/src/app-v2/navigation/FloatingNav.tsx |
| 118 | client/src/app-v2/profile/sections/ProfileBioSheet.tsx |
| 118 | client/src/app-v2/landing/sections/ValuesSection.tsx |
| 118 | client/src/app-v2/auth/LoginRoute.tsx |

All within guard limits.

## PRE-COMMIT DECISION

- **Changed files:**
  - `client/src/features-v2/feature-registry.ts` (identity → PARTIAL).
  - `client/src/features-v2/identity/README.md` (BIO_RUNTIME_PARTIAL + adapter surface).
  - `client/src/app-v2/README.md` (auth/onboarding/profile rows + body copy after PR #22).
  - `client/src/app-v2/auth/CheckEmailRoute.tsx` (configured/not-configured copy via adapter).
  - `client/src/app-v2/auth/__tests__/CheckEmailRoute.test.tsx` (assertions for both paths).
  - `client/src/app-v2/profile/sections/ProfileContacts.tsx` (no-op contact card → disabled-policy).
  - `client/src/app-v2/profile/sections/ProfileStatusBar.tsx` (no-op owner status pill → disabled-policy).
  - `docs/handoff/TODO.md` (drop step-29 from PENDING).
  - `docs/review/REVIEW_REPORTS_INDEX.md` (add step-29 row).
  - `docs/review/step-29-profile-full-parity-quality-fixes/{STEP_29_REPORT.md, PROFILE_PARITY_AUDIT.md}`.
- **Domains touched:** `app-v2/profile`, `app-v2/auth`, `features-v2/identity` (READMEs only). No backend.
- **Cross-domain imports:** none added.
- **Legacy runtime imports:** none.
- **Removed routes/nav/build chunks:** none.
- **Public DTO PII:** none — UI changes only.
- **Media base64/dataUrl:** none — no media code touched.
- **List pagination/limit/cursor:** N/A.
- **Fake DONE/status truth:** none — identity registry promotion is honest (auth+profile adapter both run); all open shortcomings are listed as `VISUAL_DELTA` / `MANUAL_REVIEW_REQUIRED`.
- **Env safety:** no secrets touched; no env reads added (adapter already reads env behind the abstraction).
- **TypeScript:** `pnpm check` PASS.
- **V2 lint:** `pnpm lint` PASS (`--max-warnings=0`).
- **Tests:** 61 files / 427 tests PASS (full suite, with `NODE_OPTIONS=--max-old-space-size=8192`).
- **Build:** `pnpm build` PASS.
- **Commit decision:** PROCEED.

## SELF-AUDIT / INDEPENDENT REVIEW PASS

- **What I changed:** status registry promotion for `identity`, two no-op
  buttons demoted to disabled-policy with honest titles, `CheckEmailRoute`
  rewritten to surface configured / not-configured states honestly,
  documentation freshened.
- **What I might have broken:**
  - `CheckEmailRoute.test.tsx` — rewritten to match the new copy; ran the
    full `pnpm vitest run client/src/app-v2` → 105 tests PASS.
  - Owner-only status-edit gesture (was a silent no-op anyway) — now an
    honest disabled-policy button. Documented in blueprint §10 follow-up.
- **Domain boundaries affected:** none. `CheckEmailRoute` imports from the
  identity feature barrel, the same path already used by the rest of `app-v2/
  auth`. `audit-domain-boundaries` PASS.
- **Cross-domain imports check:** none added.
- **Legacy/runtime check:** no legacy imports, no Supabase SDK reaches the
  shell, no `localStorage`/`sessionStorage`, no `base64`/`dataUrl`. Existing
  source scans (`ProfilePage.test.tsx`, `ProfileRuntime.test.tsx`,
  `no-storage.test.ts`) continue to pass.
- **Fake DONE/status truth check:** `check-status-truth-consistency` PASS;
  `check-fake-done` PASS; registry promotion is evidence-backed.
- **PII/base64/secrets check:** `check-public-dto-pii`, `check-media-base64`,
  `check-logging-pii-security`, `check-secret-scan` PASS.
- **Routes/nav/build graph check:** unchanged. `check-build-artifacts` PASS.
- **Guard weakening check:** no guards weakened, no allowlists expanded, no
  exception markers added in this PR. No `--no-verify`. No `eslint-disable`.
- **Evidence reviewed:** existing test scans, audit-domain-boundaries source,
  status-truth-consistency source, feature-registry guard, CheckEmailRoute
  copy and existing tests, profile section source scans.
- **Gates run:** see below.
- **Remaining risks:**
  - Legacy `Starykod-4` source unavailable on this machine → parity audit
    cannot be re-verified for the items already shipped in PR #16. Owner
    should re-run that comparison the next time legacy is mounted.
  - Status pill remains disabled-policy until the DTO slice (blueprint §10)
    lands — documented, not hidden.

## Gates

- `pnpm check` — PASS
- `pnpm lint` — PASS (`--max-warnings=0`)
- `pnpm test` — PASS (61 files / 427 tests, with `NODE_OPTIONS=--max-old-space-size=8192` to avoid worker OOM on this machine)
- `pnpm build` — PASS
- `pnpm rules:check` — PASS (28/28)
- `pnpm arch:check:v2` — PASS
- `pnpm guards:all-local` — PASS (BRAMKA 25/25)
- `node scripts/check-build-artifacts.mjs` — PASS

## Honest limitations

- `PROFILE_RUNTIME_PARTIAL` — identity boundary is still the in-memory
  adapter (`isPersistent: false`); inherited from PR #17 / PR #22.
- `LIVE_UPLOAD_NOT_STARTED` — media storage env-required; inherited.
- `FEED_RUNTIME_NOT_STARTED` — contacts/quickfeed remain visual fixtures;
  no `social`/`content-v2` runtime in this PR.
- `PROFESSIONAL_PROFILE_RUNTIME_NOT_STARTED` — professional layer still a
  visual shell.
- Status emoji / availability / visibility editing remains
  disabled-policy until the identity DTO slice (blueprint §10) is built.
- Pixel-level visual parity vs legacy not re-verified in this PR — legacy
  source is not mounted on this machine.
- `ZIP_NOT_GENERATED_BY_OPUS`.
