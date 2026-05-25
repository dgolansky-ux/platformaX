# Step 18 — Command Logs

```
$ git checkout -b governance/final-bramka-acceptance
Switched to a new branch 'governance/final-bramka-acceptance'

$ node scripts/check-bramka-acceptance.mjs
BRAMKA ACCEPTANCE MATRIX: 25/25 passed
CHECK_BRAMKA_ACCEPTANCE_PASS
```

## Local gate results

```
$ pnpm check          → PASS
$ pnpm lint           → PASS
$ pnpm test           → PASS (216+ tests, 32 files)
$ pnpm build          → PASS
$ pnpm rules:check    → PASS (21/21)
$ pnpm arch:check:v2  → PASS (9/9)
$ pnpm guards:domains → PASS
$ pnpm guards:secrets → PASS
$ pnpm guards:review  → PASS
$ pnpm guards:self-audit → PASS
$ pnpm guards:bramka  → PASS (25/25)
$ pnpm guards:commit  → COMMIT_ALLOWED
$ pnpm guards:bundle  → SMOKE_PASS
$ pnpm guards:all-local → PASS
```
