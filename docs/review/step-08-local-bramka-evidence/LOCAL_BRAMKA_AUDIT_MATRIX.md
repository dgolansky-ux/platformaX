# Step 08 — Local BRAMKA Audit Matrix

| # | Requirement | Script/File | Result | Evidence |
|---|---|---|---|---|
| 1 | No .env tracked | check-env-safety.mjs | PASS | file check: not present |
| 2 | No secrets in code | check-local-secret-scan.mjs | PASS | regex scan clean |
| 3 | No legacy imports | check-no-legacy-imports.mjs | PASS | scan of app-v2/features-v2/domains-v2/shared |
| 4 | No removed product areas | check-removed-product-areas.mjs | PASS | scan of client/server/shared |
| 5 | No fake DONE statuses | check-fake-done.mjs | PASS | scan of docs/client/server/shared/scripts |
| 6 | Domain status valid | check-domain-status.mjs | PASS | domain-status.md parsed |
| 7 | Domain boundaries enforced | audit-domain-boundaries.mjs | PASS | cross-domain scan |
| 8 | No base64 uploads | check-media-base64.mjs | PASS | scan of V2 runtime dirs |
| 9 | Public DTO PII blocked | check-public-dto-pii.mjs | PASS | dto/public-api scan |
| 10 | Pagination enforced | check-pagination.mjs | PASS (no runtime lists) | NO_RUNTIME_LISTS |
| 11 | File complexity limits | check-file-complexity.mjs | PASS | line count scan |
| 12 | Build artifacts clean | check-build-artifacts.mjs | PASS | dist scan |
| 13 | Migration safety | check-supabase-migrations-safety.mjs | PASS (no migrations) | SKIPPED_NO_MIGRATIONS |
| 14 | Test env isolated | check-test-env-safety.mjs | PASS | test setup scan |
| 15 | Bundle paths valid | validate-bundle.mjs | PASS | self-test 6/6 |
| 16 | Diff safety | check-diff-safety.mjs | PASS | git diff scan |
| 17 | Script safety | check-script-safety.mjs | PASS | meta-safety scan |
| 18 | TypeScript compiles | tsc --noEmit | PASS | zero errors |
| 19 | ESLint clean | eslint . | PASS | zero warnings |
| 20 | Tests pass | vitest run | PASS | 20/20 tests |
| 21 | Build succeeds | vite build | PASS | dist produced |
| 22 | Husky pre-commit configured | .husky/pre-commit | EXISTS | 8 gates |
| 23 | Husky pre-push configured | .husky/pre-push | EXISTS | 9 gates |
| 24 | Commitlint configured | commitlint.config.mjs | EXISTS | type+scope enum |
| 25 | lint-staged configured | package.json | EXISTS | ts/tsx/js/mjs |
| 26 | CODEOWNERS set | .github/CODEOWNERS | EXISTS | @dgolansky-ux |
| 27 | PR template exists | .github/pull_request_template.md | EXISTS | Architecture Impact |
| 28 | CI workflow exists | .github/workflows/v2-gates.yml | EXISTS | 11 steps |
| 29 | ADRs exist | docs/architecture/adr/ | EXISTS | ADR-000 through ADR-008 |
| 30 | Governance docs exist | docs/ | EXISTS | 56 markdown files |
