# Step 11 — Gates Results

## Baseline (pre red-team)

| # | Gate | Command | Result | Exit |
|---|---|---|---|---|
| 1 | Type check | pnpm check | PASS | 0 |
| 2 | Lint | pnpm lint | PASS | 0 |
| 3 | Test | pnpm test | PASS (48/48) | 0 |
| 4 | Build | pnpm build | PASS | 0 |
| 5 | Rules umbrella | pnpm rules:check | 14/14 PASS | 0 |
| 6 | Arch umbrella | pnpm arch:check:v2 | 6/6 PASS | 0 |
| 7 | Commit decision | pnpm guards:commit | COMMIT_ALLOWED | 0 |
| 8 | Bundle smoke | pnpm guards:bundle | SMOKE_PASS | 0 |
| 9 | All local | pnpm guards:all-local | PASS | 0 |

## Final (post red-team restore)

Same results — all PASS.
