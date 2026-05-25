# Step 08 — Gates Results

| # | Gate | Command | Result | Exit code |
|---|---|---|---|---|
| 1 | Type check | `pnpm check` | PASS | 0 |
| 2 | Lint | `pnpm lint` | PASS | 0 |
| 3 | Test | `pnpm test` | PASS (20/20) | 0 |
| 4 | Build | `pnpm build` | PASS | 0 |
| 5 | Rules umbrella | `pnpm rules:check` | 14/14 PASS | 0 |
| 6 | Arch umbrella | `pnpm arch:check:v2` | 6/6 PASS | 0 |
| 7 | Commit decision | `pnpm guards:commit` | COMMIT_ALLOWED | 0 |
| 8 | Bundle smoke | `pnpm guards:bundle` | SMOKE_PASS | 0 |
| 9 | Secret scan | `pnpm guards:secrets` | PASS | 0 |
| 10 | Script safety | `pnpm guards:scripts` | PASS | 0 |
| 11 | All local | `pnpm guards:all-local` | PASS | 0 |

## Individual rules:check sub-guards

| Guard | Result |
|---|---|
| check-fake-done.mjs | PASS |
| check-domain-status.mjs | PASS |
| check-no-legacy-imports.mjs | PASS |
| check-removed-product-areas.mjs | PASS |
| audit-domain-boundaries.mjs | PASS |
| check-test-env-safety.mjs | PASS |
| check-env-safety.mjs | PASS |
| check-public-dto-pii.mjs | PASS |
| check-media-base64.mjs | PASS |
| check-pagination.mjs | PASS |
| check-file-complexity.mjs | PASS |
| check-build-artifacts.mjs | PASS |
| check-supabase-migrations-safety.mjs | PASS |
| validate-bundle.mjs --smoke | PASS |

## Individual arch:check:v2 sub-guards

| Guard | Result |
|---|---|
| audit-domain-boundaries.mjs | PASS |
| check-no-legacy-imports.mjs | PASS |
| check-removed-product-areas.mjs | PASS |
| check-public-dto-pii.mjs | PASS |
| check-media-base64.mjs | PASS |
| check-pagination.mjs | PASS |
