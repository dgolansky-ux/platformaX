# Step 17a — Command Logs

```
$ git checkout main
Already on 'main'

$ git pull --ff-only origin main
Already up to date.

$ git checkout -b governance/coding-standards-hardening
Switched to a new branch 'governance/coding-standards-hardening'
```

## Gate results

```
$ pnpm check            → EXIT 0 (tsc --noEmit)
$ pnpm lint             → EXIT 0 (eslint --max-warnings=0)
$ pnpm test             → EXIT 0 (230 tests, 32 files)
$ pnpm build            → EXIT 0 (vite build)
$ pnpm rules:check      → EXIT 0 (21/21 PASS)
$ pnpm arch:check:v2    → EXIT 0 (9/9 PASS)
$ pnpm guards:domains   → EXIT 0
$ pnpm guards:secrets   → EXIT 0
$ pnpm guards:commit    → COMMIT_ALLOWED
$ pnpm guards:bundle    → SMOKE_PASS
$ pnpm guards:review    → EXIT 0
$ pnpm guards:self-audit → EXIT 0
$ pnpm guards:bramka    → EXIT 0 (25/25 PASS)
$ pnpm guards:all-local → EXIT 0
```
