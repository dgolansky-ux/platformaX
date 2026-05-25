# Step 17 — Command Logs

```
$ git checkout -b governance/documentation-freshness-gate
Switched to a new branch 'governance/documentation-freshness-gate'

$ node scripts/check-review-reports-index.mjs
CHECK_REVIEW_REPORTS_INDEX_PASS

$ node scripts/check-pre-commit-decision.mjs
CHECK_PRE_COMMIT_DECISION_PASS
```

## Local gate results

```
$ pnpm check          → PASS
$ pnpm lint           → PASS
$ pnpm test           → PASS (193 tests, 30 files)
$ pnpm build          → PASS
$ pnpm rules:check    → PASS (20/20)
$ pnpm arch:check:v2  → PASS (9/9)
$ pnpm guards:domains → PASS
$ pnpm guards:secrets → PASS
$ pnpm guards:review  → PASS
$ pnpm guards:commit  → COMMIT_ALLOWED
$ pnpm guards:bundle  → SMOKE_PASS
$ pnpm guards:all-local → PASS
```
