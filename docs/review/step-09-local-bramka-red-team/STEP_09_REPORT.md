# Step 09 — Local BRAMKA Red-Team Audit Report

Generated: 2026-05-25T04:15Z

## Objective

Controlled red-team testing of all local BRAMKA guards to confirm they block invalid changes.

## Methodology

For each test:
1. Inject a specific violation into the codebase
2. Run the responsible guard
3. Confirm FAIL with exit code 1
4. Capture evidence log
5. Revert the change
6. Confirm the guard returns to PASS

## Results

**12/12 red-team tests PASSED** — every guard caught its violation.

| # | Test | Guard | Caught | Restored |
|---|---|---|---|---|
| 1 | Fake status (FULL_DONE) | check-fake-done | YES | YES |
| 2 | Legacy import | check-no-legacy-imports | YES | YES |
| 3 | Removed route (/seller) | check-removed-product-areas | YES | YES |
| 4 | Cross-domain import | audit-domain-boundaries | YES | YES |
| 5 | Public DTO PII | check-public-dto-pii | YES | YES |
| 6 | Media base64 | check-media-base64 | YES | YES |
| 7 | Env/secrets | check-env-safety | YES | YES |
| 8 | Test env | check-test-env-safety | YES | YES |
| 9 | Pagination | check-pagination | YES | YES |
| 10 | Bundle validator | validate-bundle (classifyEntry) | YES | N/A (in-memory) |
| 11 | File complexity | check-file-complexity | YES | YES |
| 12 | No-op UI (onClick) | check-diff-safety | YES | YES |

## Notes on guard behavior

- **check-env-safety** skips lines containing "example" or "placeholder" (by design). Red-team test used a realistic non-placeholder value.
- **check-no-legacy-imports** matches absolute import paths (`client/src/features/`), not relative paths (`../../features/`). This is the intended behavior per the guard's scope definition.
- **audit-domain-boundaries** matches `domains-v2/<other>/repository` patterns. Relative path imports like `../social/repository` are not currently caught. This is a known limitation; the guard enforces the documented import convention.
- **check-pagination** requires specific list indicators (`findAll`, `findMany`, `getList`, etc.). Generic `db.select()` without these keywords is not flagged. The guard operates on convention-based detection.

## Final state

- Branch: `main`
- Working tree: clean
- All gates: PASS

## Final status

```
LOCAL_BRAMKA_RED_TEAM_PASSED
```
