# Step 14 — Command Logs

## Baseline (all PASS)

```
$ pnpm check          → PASS (exit 0)
$ pnpm lint           → PASS (exit 0)
$ pnpm test           → PASS (158 tests, 27 files, exit 0)
$ pnpm build          → PASS (exit 0)
$ pnpm rules:check    → PASS (17/17, exit 0)
$ pnpm arch:check:v2  → PASS (9/9, exit 0)
$ pnpm guards:domains → PASS (exit 0)
$ pnpm guards:commit  → COMMIT_ALLOWED (exit 0)
$ pnpm guards:bundle  → SMOKE_PASS (exit 0)
$ pnpm guards:all-local → PASS (exit 0)
```

## Post-restore (all PASS)

```
$ git status          → clean
$ pnpm rules:check    → PASS (17/17, exit 0)
$ pnpm guards:domains → PASS (exit 0)
$ pnpm guards:all-local → PASS (exit 0)
```
