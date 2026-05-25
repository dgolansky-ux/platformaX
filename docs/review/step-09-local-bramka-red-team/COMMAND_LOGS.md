# Step 09 — Command Logs

## Post-restore final validation

```
$ pnpm check → EXIT: 0
$ pnpm lint → EXIT: 0
$ pnpm test → 29/29 passed → EXIT: 0
$ pnpm build → ✓ built → EXIT: 0
$ pnpm rules:check → 14/14 PASS → EXIT: 0
$ pnpm arch:check:v2 → 6/6 PASS → EXIT: 0
$ pnpm guards:commit → 10/10 PASS → COMMIT_ALLOWED → EXIT: 0
$ pnpm guards:bundle → SMOKE_PASS (16 self-tests) → EXIT: 0
$ pnpm guards:all-local → all PASS → EXIT: 0
```

## Individual red-team test logs

See GUARD_FAILURE_EVIDENCE.md for detailed per-test logs.
