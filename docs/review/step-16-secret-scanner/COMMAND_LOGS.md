# Step 16 — Command Logs

```
$ git branch -d governance/domain-boundary-red-team
Deleted branch governance/domain-boundary-red-team (was bc40358).

$ git checkout -b governance/secret-scanner-gate
Switched to a new branch 'governance/secret-scanner-gate'

$ node scripts/check-secret-scan.mjs
CHECK_SECRET_SCAN_PASS

$ node scripts/check-secret-scan.mjs (with __redteam_secret_test.ts + .env)
SECRET_SCAN_VIOLATIONS:
  [PostgreSQL connection string] __redteam_secret_test.ts:1
  [JWT token literal] __redteam_secret_test.ts:2
  [OpenAI-style key (sk-)] __redteam_secret_test.ts:3
  [Stripe test key (sk_test)] __redteam_secret_test.ts:4
  [TRACKED_ENV_FILE] .env:0
check-secret-scan: 5 violation(s)

$ (cleanup: deleted __redteam_secret_test.ts and .env)

$ node scripts/check-secret-scan.mjs
CHECK_SECRET_SCAN_PASS
```

## Local gate results

```
$ pnpm check          → PASS
$ pnpm lint           → PASS
$ pnpm test           → PASS (175 tests, 28 files)
$ pnpm build          → PASS
$ pnpm rules:check    → PASS (18/18)
$ pnpm arch:check:v2  → PASS (9/9)
$ pnpm guards:domains → PASS
$ pnpm guards:secrets → PASS
$ pnpm guards:commit  → COMMIT_ALLOWED
$ pnpm guards:bundle  → SMOKE_PASS
$ pnpm guards:all-local → PASS
```
