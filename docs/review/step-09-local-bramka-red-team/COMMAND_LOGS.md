# Step 09 — Command Logs

## Baseline

```
$ git status → clean, ahead of origin by 4 commits
$ git branch → main
$ pnpm check → EXIT: 0
$ pnpm lint → EXIT: 0
$ pnpm test → 29/29 passed → EXIT: 0
$ pnpm build → EXIT: 0
$ pnpm rules:check → 14/14 PASS → EXIT: 0
$ pnpm arch:check:v2 → 6/6 PASS → EXIT: 0
$ pnpm guards:commit → COMMIT_ALLOWED → EXIT: 0
$ pnpm guards:bundle → SMOKE_PASS (16 self-tests) → EXIT: 0
$ pnpm guards:all-local → PASS (after sanitizing previous report) → EXIT: 0
```

## Red-team test runs

See GUARD_FAILURE_EVIDENCE.md for per-test logs.

## Post-restore final validation

```
$ pnpm check → EXIT: 0
$ pnpm lint → EXIT: 0
$ pnpm test → 29/29 passed → EXIT: 0
$ pnpm build → EXIT: 0
$ pnpm rules:check → 14/14 PASS → EXIT: 0
$ pnpm arch:check:v2 → 6/6 PASS → EXIT: 0
$ pnpm guards:commit → COMMIT_ALLOWED → EXIT: 0
$ pnpm guards:bundle → SMOKE_PASS → EXIT: 0
$ pnpm guards:all-local → PASS → EXIT: 0
```
