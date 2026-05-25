# Step 12 — GitHub Plan Limitations

## Branch protection status

| Setting | Required | Actual | Status |
|---|---|---|---|
| Branch protection rule created | YES | YES | DONE |
| Branch protection enforced | YES | NO | **PLAN_LIMITATION** |
| Require PR before merge | YES | Configured but not enforced | **PLAN_LIMITATION** |
| Require 1 approval | YES | Configured but not enforced | **PLAN_LIMITATION** |
| Required status checks | YES | Configured (v2-gates) | PENDING_ENFORCEMENT |
| Branch up to date before merge | YES | Configured but not enforced | **PLAN_LIMITATION** |
| CODEOWNERS review enforced | YES | NO | **PLAN_LIMITATION** |
| Block force push | YES | Configured | DONE |
| Block branch deletion | YES | Configured | DONE |
| GitHub secret scanning | YES | NO | **PLAN_LIMITATION** (private repo on Free plan) |
| GitHub push protection | YES | NO | **PLAN_LIMITATION** |

## Explanation

GitHub Free plan for private repositories does **not enforce** branch protection rules.
The rules are created and configured, but GitHub does not block non-compliant actions.

This means:
- Direct pushes to `main` are technically possible (though blocked locally by Husky pre-push)
- PRs can be merged without required checks passing
- CODEOWNERS review is not enforced

## Mitigation

Local gates (Husky pre-commit, pre-push, commitlint, lint-staged) serve as the primary defense:
- `pre-commit`: diff safety, fake-done, removed areas, env safety, test-env safety, tsc, eslint, lint-staged
- `pre-push`: rules:check (14 guards), arch:check:v2 (6 checks), domain boundaries, domain status, removed areas, test-env safety, eslint, vitest, vite build
- `commit-msg`: commitlint enforces conventional commits with allowed scopes

## BRAMKA_COMPLETE

```
NO
```

BRAMKA_COMPLETE is still forbidden. GitHub enforcement limitations are recorded as `PLAN_LIMITATION`.
