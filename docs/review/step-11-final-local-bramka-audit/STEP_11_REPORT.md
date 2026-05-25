# Step 11 — Final Local BRAMKA Audit Report

Generated: 2026-05-25T06:43Z

## Repository state

| Item | Value |
|---|---|
| Branch | `main` |
| Last commit | `6a42061 repair(governance): verify local bramka with red-team audit` |
| Working tree | clean (only step-11 reports updated) |
| Ahead of origin | 6 commits |

## Baseline gate results (all PASS)

| Gate | Result | Exit |
|---|---|---|
| pnpm check | PASS | 0 |
| pnpm lint | PASS | 0 |
| pnpm test | PASS (50 tests, 8 files) | 0 |
| pnpm build | PASS | 0 |
| pnpm rules:check | PASS (14/14) | 0 |
| pnpm arch:check:v2 | PASS (6/6) | 0 |
| pnpm guards:commit | COMMIT_ALLOWED (10/10) | 0 |
| pnpm guards:bundle | SMOKE_PASS (17 self-tests) | 0 |
| pnpm guards:all-local | PASS | 0 |

## Red-team rerun: 12/12 PASS

All 12 tests caught their violations, including the 4 previously-blocked tests fixed in Step 10:

1. **Relative legacy import** — check-no-legacy-imports now catches `../../../features/`
2. **Relative cross-domain import** — audit-domain-boundaries now resolves `../social/repository`
3. **Env placeholder in source** — check-env-safety no longer skips "example" in source files
4. **db.select().from() without pagination** — check-pagination now detects query builder patterns

## Final local gates (all PASS)

Same as baseline — all gates pass after red-team restore.

## Evidence bundle

| Item | Value |
|---|---|
| ZIP path | `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-11-final-local-bramka-audit-v2.zip` |
| SHA256 path | `C:\Users\dgola\Desktop\ZIPY\platformax-v2-step-11-final-local-bramka-audit-v2.sha256.txt` |
| SHA256 | `B5A6BA2CF6DAEDBA8094FF4E5217EEE0C66F539B01C5A19C35674C54B1D18478` |
| File count | 176 |
| Backslash paths | 0 |
| Nested ZIPs | 0 |
| Banned files | 0 |
| validate-bundle.mjs | `VALIDATE_BUNDLE_PASS` (portable Node.js with adm-zip) |

## Manual GitHub gates pending

```
GITHUB_BRANCH_PROTECTION_PENDING
GITHUB_REQUIRED_CHECKS_PENDING
GITHUB_CODEOWNERS_REVIEW_PENDING
GITHUB_SECRET_SCANNING_PENDING
GITHUB_PUSH_PROTECTION_PENDING
```

## Final status

```
LOCAL_BRAMKA_VERIFIED
```
