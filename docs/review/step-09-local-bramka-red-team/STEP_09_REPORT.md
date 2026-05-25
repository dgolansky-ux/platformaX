# Step 09 — Local BRAMKA Red-Team Audit Report

Generated: 2026-05-25T04:28Z

## 1. Branch

`main`

## 2. Last commit

`327f78e test(guards): add step-09 red-team audit of local BRAMKA gates`

## 3. Baseline gate results (all PASS before red-team)

| Gate | Result | Exit |
|---|---|---|
| pnpm check | PASS | 0 |
| pnpm lint | PASS | 0 |
| pnpm test | PASS (29 tests) | 0 |
| pnpm build | PASS | 0 |
| pnpm rules:check | PASS (14/14) | 0 |
| pnpm arch:check:v2 | PASS (6/6) | 0 |
| pnpm guards:commit | COMMIT_ALLOWED | 0 |
| pnpm guards:bundle | SMOKE_PASS (16 self-tests) | 0 |
| pnpm guards:all-local | PASS | 0 |

Note: baseline required sanitizing `RED_TEAM_TEST_MATRIX.md` from previous step-09 commit (contained a PostgreSQL credential pattern which triggered check-local-secret-scan).

## 4. Red-team tests executed

12 tests executed. See `RED_TEAM_TEST_MATRIX.md` for the complete matrix.

## 5. Guards that CAUGHT violations

| Test | Guard | Caught |
|---|---|---|
| RT1: Fake status | check-fake-done + rules:check | YES — BRAMKA_COMPLETE + FULL_DONE |
| RT2: Legacy import | audit-domain-boundaries (via arch:check:v2) | YES — "features/" + "legacy" keywords |
| RT3: Removed routes | check-removed-product-areas + rules:check | YES — seller + tasks + fundraiser |
| RT4: Cross-domain (absolute path) | audit-domain-boundaries | YES — cross-domain "repository" |
| RT5: Public DTO PII | check-public-dto-pii + arch:check:v2 | YES — email + phone + dateOfBirth |
| RT6: Media base64 | check-media-base64 + rules:check | YES — readAsDataURL + dataUrl + base64 |
| RT7: Env/secrets (real-looking) | check-env-safety + rules:check | YES — DATABASE_URL + postgresql:// + SUPABASE_SERVICE_ROLE_KEY |
| RT8: Test env | check-test-env-safety + rules:check | YES — dotenv.config path .env |
| RT9: Pagination (findAll) | check-pagination + rules:check | YES — findAll without pagination |
| RT10: Bundle validator | validate-bundle classifyEntry | YES — 7/7 patterns classified |
| RT11: File complexity | check-file-complexity + rules:check | YES — 366 lines > 350 limit |
| RT12: No-op UI/alert/confirm | check-diff-safety | YES — onClick, window.alert, window.confirm |

## 6. Guards that DID NOT catch violations (RED_TEAM_BLOCKERS)

| Test | Guard | Issue |
|---|---|---|
| RT2 | check-no-legacy-imports | Did NOT catch relative import `../../../features/legacy-example`. Only matches absolute-style paths like `client/src/features/`. Violation was caught by audit-domain-boundaries instead. |
| RT4 | audit-domain-boundaries | Did NOT catch relative cross-domain import `../social/repository`. Only matches `domains-v2/<other>/repository` patterns. Caught when using absolute-style import. |
| RT7 | check-env-safety | Did NOT catch `DATABASE_URL=postgresql://example` because guard skips lines containing "example" keyword. Real-looking values without "example" ARE caught. |
| RT9 | check-pagination | Did NOT catch `db.select().from(users)`. Guard only detects specific list indicators (`findAll`, `findMany`, `getList`, etc.). Generic ORM/SQL queries are not flagged. |

## 7. All temporary violations reverted

YES — confirmed. Working tree has only the sanitized `RED_TEAM_TEST_MATRIX.md` modification (from baseline fix). No injected files remain. No injected code remains.

## 8. Final gate results (all PASS)

| Gate | Result | Exit |
|---|---|---|
| pnpm check | PASS | 0 |
| pnpm lint | PASS | 0 |
| pnpm test | PASS (29 tests) | 0 |
| pnpm build | PASS | 0 |
| pnpm rules:check | PASS (14/14) | 0 |
| pnpm arch:check:v2 | PASS (6/6) | 0 |
| pnpm guards:commit | COMMIT_ALLOWED | 0 |
| pnpm guards:bundle | SMOKE_PASS | 0 |
| pnpm guards:all-local | PASS | 0 |

## 9. Changed files

- `docs/review/step-09-local-bramka-red-team/RED_TEAM_TEST_MATRIX.md` (sanitized previous credential pattern)
- `docs/review/step-09-local-bramka-red-team/STEP_09_REPORT.md` (this file, rewritten)
- `docs/review/step-09-local-bramka-red-team/RED_TEAM_TEST_MATRIX.md` (rewritten)
- `docs/review/step-09-local-bramka-red-team/GUARD_FAILURE_EVIDENCE.md` (rewritten)
- `docs/review/step-09-local-bramka-red-team/RESTORE_VERIFICATION.md` (rewritten)
- `docs/review/step-09-local-bramka-red-team/COMMAND_LOGS.md` (rewritten)
- `docs/review/step-09-local-bramka-red-team/BLOCKED_ITEMS.md` (rewritten)

## 10. Blockers

4 partial RED_TEAM_BLOCKERS found (see BLOCKED_ITEMS.md for details and recommended fixes). These are not full blockers — violations are still caught by overlapping guards or by using the expected import conventions, but the specific guards have gaps with relative paths or placeholder keywords.

## 11. Final status

```
RED_TEAM_BLOCKERS_FOUND
```

4 guard gaps documented. Recommended fixes in BLOCKED_ITEMS.md.

## Known issues from Krok 8

- `ZIP_MANIFEST.md` in evidence bundle may have stale data — not fixed in Krok 9.
- `validate-bundle.mjs` uses PowerShell for real ZIP validation — portability fix deferred.
