# Step 10 — Red-Team Blocker Fixes Report

Generated: 2026-05-25T04:42Z

## Objective

Fix the 4 red-team blockers identified in Step 09 and verify that all guards now catch violations that previously slipped through.

## Branch

`main`

## Fixed guards

| # | Guard | Problem | Fix applied |
|---|---|---|---|
| 1 | check-no-legacy-imports.mjs | Only matched absolute import paths | Added relative path resolution via `posix.normalize()` + keyword matching for `/features/`, `/pages/`, `/legacy/`, etc. |
| 2 | audit-domain-boundaries.mjs | Only matched `domains-v2/<other>/module` regex in import strings | Added `resolveRelativeImport()` + `getImportedDomainAndModule()` to resolve relative imports and detect cross-domain access to blocked modules |
| 3 | check-env-safety.mjs | Skipped "example" keyword in ALL files | Now only allows placeholder skip in `.env.example`, `.env.test.example`, and `docs/security/` / `docs/templates/` prefixes. Source files are always checked. |
| 4 | check-pagination.mjs | Only detected keyword-based list indicators | Added regex `QUERY_PATTERNS` for `.select().from(` and `db.select().from(`. Added `SAFE_MARKERS` (MOCK_LOCAL_ONLY, FIXED_CAP, UI_ONLY, TEST_FIXTURE) as opt-out. Added `getAll` to keyword list. |

## New/extended tests

| File | Tests added |
|---|---|
| `scripts/__tests__/legacy-imports.test.ts` | +4 tests for relative path detection |
| `scripts/__tests__/domain-boundaries.test.ts` | NEW: 5 tests for cross-domain relative path resolution |
| `scripts/__tests__/env-safety.test.ts` | +3 tests for example-in-source vs safe-file distinction |
| `scripts/__tests__/pagination.test.ts` | NEW: 7 tests for db.select, findAll, getAll, safe markers |

## Gate results (all PASS)

| Gate | Result |
|---|---|
| pnpm check | PASS |
| pnpm lint | PASS |
| pnpm test | PASS (48 tests, 8 files) |
| pnpm build | PASS |
| pnpm rules:check | PASS (14/14) |
| pnpm arch:check:v2 | PASS (6/6) |
| pnpm guards:commit | COMMIT_ALLOWED |
| pnpm guards:bundle | SMOKE_PASS |
| pnpm guards:all-local | PASS |

## Targeted red-team rerun (all 4 blockers now FAIL on violation)

| Blocker | Injection | Guard | Result | Restored |
|---|---|---|---|---|
| 1 | Relative `../../../features/legacy-example` in app-v2 | check-no-legacy-imports + arch:check:v2 | FAIL (exit 1) | PASS (exit 0) |
| 2 | Relative `../social/repository` in domains-v2/identity | audit-domain-boundaries + arch:check:v2 | FAIL (exit 1) | PASS (exit 0) |
| 3 | `DATABASE_URL=postgresql://example` in server/ source | check-env-safety + rules:check | FAIL (exit 1) | PASS (exit 0) |
| 4 | `db.select().from(users)` without limit in domains-v2 | check-pagination + rules:check | FAIL (exit 1) | PASS (exit 0) |

## Final status

```
RED_TEAM_BLOCKERS_FIXED
```
