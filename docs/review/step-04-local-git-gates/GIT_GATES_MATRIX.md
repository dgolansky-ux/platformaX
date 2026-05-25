# Step 04 — Git Gates Matrix

| Gate | Trigger | Guards executed | Failure effect |
|---|---|---|---|
| **pre-commit** | `git commit` | check-diff-safety, check-fake-done, check-removed-product-areas, check-env-safety, check-test-env-safety, `pnpm check`, `pnpm lint:v2`, lint-staged | Commit blocked |
| **commit-msg** | `git commit` | commitlint (type-enum, scope-enum, blocked patterns) | Commit blocked |
| **pre-push** | `git push` | rules:check (14 guards), arch:check:v2 (6 guards), audit-domain-boundaries, check-domain-status, check-removed-product-areas, check-test-env-safety, `pnpm lint`, `pnpm test`, `pnpm build` | Push blocked |
| **lint-staged** | staged files | eslint --max-warnings=0 on *.{ts,tsx,js,mjs} | Commit blocked |

## Commitlint rules

| Rule | Level | Value |
|---|---|---|
| type-enum | error | feat, fix, refactor, test, docs, chore, repair |
| scope-enum | error | v2, governance, guards, architecture, routing, identity, social, content, media, system, ci, docs |
| subject-empty | error | never |
| type-empty | error | never |
| header-max-length | error | 120 |
| no-blocked-message | plugin | done, final, clean, fix stuff, working, full done, bramka complete |
