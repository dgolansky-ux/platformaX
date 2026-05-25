# Step 10 — Command Logs

## Full gate suite (post-fix, pre-rerun)

```
$ pnpm check → EXIT: 0
$ pnpm lint → EXIT: 0
$ pnpm test → 48/48 passed (8 files) → EXIT: 0
$ pnpm build → EXIT: 0
$ pnpm rules:check → 14/14 PASS → EXIT: 0
$ pnpm arch:check:v2 → 6/6 PASS → EXIT: 0
$ pnpm guards:commit → COMMIT_ALLOWED → EXIT: 0
$ pnpm guards:bundle → SMOKE_PASS (16 self-tests) → EXIT: 0
$ pnpm guards:all-local → PASS → EXIT: 0
```

## Targeted red-team rerun

See TARGETED_RED_TEAM_RERUN.md for per-blocker injection/fail/restore evidence.
