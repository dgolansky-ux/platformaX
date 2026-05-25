# Step 30 — Architecture, Quality & Scalability Guards

Status: `ARCHITECTURE_QUALITY_SCALABILITY_GUARDS_PR_READY`  
Date: 2026-05-25  
Branch: `feat/architecture-quality-scalability-guards`

## Scope

Harden architecture, code quality, and scalability guardrails for PlatformaX V2. Prevent unbounded growth, performance anti-patterns, and boundary violations as the codebase scales.

## Changed Files

### New guard scripts
- `scripts/check-code-quality-structure.mjs` — function/component/file size limits
- `scripts/check-scalability-patterns.mjs` — unbounded lists, N+1, sync fanout, await-in-loop
- `scripts/check-frontend-performance-patterns.mjs` — key={index}, transition:all, timer cleanup
- `scripts/check-status-truth-consistency.mjs` — registry vs README vs evidence consistency
- `scripts/check-dependency-discipline.mjs` — duplicate deps, heavy packages, lockfile sync
- `scripts/check-logging-pii-security.mjs` — PII in logs, service role in client, base64 upload

### Strengthened existing guards
- `scripts/audit-domain-boundaries.mjs` — added public-api export checks, shared-ui domain isolation, app-v2 backend import block, feature cross-import block
- `scripts/rules-check.mjs` — added 6 new guards to the gate matrix

### Fixed violations in existing code
- `client/src/app-v2/profile/styles/profile-status.module.css` — replaced `transition: all` with explicit properties
- `client/src/app-v2/onboarding/OnboardingFlow.tsx` — added justified exception marker (multi-step form, refactor scheduled)
- `client/src/app-v2/profile/styles/profile-header.module.css` — added justified exception marker (6-block responsive CSS)

### Updated governance docs
- `docs/architecture/PlatformaX-V2-coding-standards.md` — added §22 (quality+scalability rules)
- `docs/architecture/PlatformaX-V2-architecture-enforcement.md` — added new guards to gate list, acceptance criteria
- `docs/architecture/PlatformaX-V2-active-rules.md` — added scalability, code quality, dependency rules

### Updated gate wiring
- `package.json` — `guards:all-local` extended with 6 new guards

### Test file
- `scripts/__tests__/guards-quality-scalability.test.mjs` — smoke tests for all new/strengthened guards

## Architecture Impact Statement

This change introduces enforcement-level (FAIL, not warn) guards for code quality, scalability patterns, and frontend performance. No domain logic or runtime behavior is changed. Existing code violations were either fixed (transition:all) or given justified exception markers (CSS/onboarding over new stricter limits). No guards were weakened. The 25/25 BRAMKA remains intact.

## New/Strengthened Guards

| Guard | Type | Blocks |
|---|---|---|
| check-code-quality-structure | NEW | Functions >80 lines, components >140, route/page >280, regular tsx >220, CSS module >320, backend >240, excess exports, excess props, index internals, generic utils |
| check-scalability-patterns | NEW | Unbounded lists, Promise.all without cap, await in DB/network loop, select(*), N+1, sync fanout, offset pagination, missing stable order |
| check-frontend-performance-patterns | NEW | key={index}, missing key, transition:all, event listener no cleanup, timer no cleanup, large inline fixtures |
| check-status-truth-consistency | NEW | Registry vs README mismatch, hasDomainLogic false with runtime evidence, IMPLEMENTED without tests, BACKEND_DONE without runtime |
| check-dependency-discipline | NEW | Duplicate libraries, heavy packages, missing lockfile entries, backend packages in frontend |
| check-logging-pii-security | NEW | PII in console.log, SERVICE_ROLE_KEY in client, localStorage as auth, base64 upload runtime |
| audit-domain-boundaries | STRENGTHENED | + public-api export internals, shared-ui domain imports, app-v2 backend imports, feature cross-imports |

## Code Quality Limits (enforced)

| File type | Max lines |
|---|---:|
| Function (non-component) | 80 |
| React component | 140 |
| Route/page/flow file | 280 |
| Regular .tsx | 220 |
| CSS module | 320 |
| Backend service/repository/policy/router/mapper | 240 |

## Scalability Rules

- Every list/feed/search: limit + maxLimit + cursor/fixed cap + stable order
- No N+1 in loops (reactions/comments/profiles)
- No sync fanout in request path
- No Promise.all on unbounded arrays
- No await in loop with DB/network without justification
- No select('*') without mapper
- No offset pagination for user-facing lists without justification

## Dependency Rules

- No duplicate libraries for same purpose
- No heavy packages for simple tasks (lodash, moment, jquery, etc.)
- All deps must be in lockfile
- Backend-only packages forbidden in client code

## Security/PII Rules

- No email/phone/dateOfBirth/token/session/password in console.log
- No SERVICE_ROLE_KEY or DATABASE_URL in client/src
- No localStorage/sessionStorage as auth/profile persistence
- No base64/dataUrl upload runtime (use media domain)

## Fixes Applied

- `profile-status.module.css:157` — `transition: all` → explicit `background, color`
- `OnboardingFlow.tsx` — QUALITY_STRUCTURE_EXCEPTION added (multi-step form, 299 lines near 280 route limit)
- `profile-header.module.css` — QUALITY_STRUCTURE_EXCEPTION + ALLOW_FILE_SIZE_EXCEPTION (6-block responsive CSS, 351 lines)

## No Weakened Guards

- All existing guards remain at same or stricter level
- No allowlist expansions
- No fail→warn conversions
- 25/25 BRAMKA not touched

## Gate Results

| Gate | Result |
|---|---|
| `pnpm check` (tsc --noEmit) | PASS |
| `pnpm lint` (eslint --max-warnings=0) | PASS |
| `pnpm test` (vitest run) | PASS — 51 files, 374 tests |
| `pnpm build` (vite build) | PASS — 305kB JS, 59kB CSS |
| `pnpm rules:check` (28 guards) | PASS — 28/28 |
| `pnpm arch:check:v2` | PASS |
| `pnpm guards:domains` | PASS |
| `pnpm guards:secrets` | PASS |
| `pnpm guards:review` | PASS |
| `pnpm guards:self-audit` | PASS |
| `pnpm guards:bramka` | PASS — 25/25 |
| `node scripts/check-build-artifacts.mjs` | PASS |

## Honest Limitations

- Function-length detection uses brace counting which may have edge cases with template literals or JSX expressions
- Component detection relies on PascalCase naming convention
- Scalability pattern detection is conservative — may not catch all N+1 patterns
- Status truth check depends on README format being consistent
- Exception markers allow escape — enforcement depends on review discipline
