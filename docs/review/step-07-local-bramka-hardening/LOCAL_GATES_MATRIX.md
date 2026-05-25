# Step 07 — Local Gates Matrix

## Guard scripts (23 total)

| # | Script | Scope | Type | Status |
|---|---|---|---|---|
| 1 | rules-check.mjs | umbrella | orchestrator | PASS (14 guards) |
| 2 | arch-check-v2.mjs | umbrella | orchestrator | PASS (6 guards) |
| 3 | no-commit-if-dirty-gates.mjs | umbrella | orchestrator | PASS (10 gates) |
| 4 | check-fake-done.mjs | status truth | guard | PASS |
| 5 | check-domain-status.mjs | governance | guard | PASS |
| 6 | check-no-legacy-imports.mjs | architecture | guard | PASS |
| 7 | check-removed-product-areas.mjs | scope | guard | PASS |
| 8 | audit-domain-boundaries.mjs | architecture | guard | PASS |
| 9 | check-test-env-safety.mjs | security | guard | PASS |
| 10 | check-env-safety.mjs | security | guard | PASS |
| 11 | check-public-dto-pii.mjs | privacy | guard | PASS |
| 12 | check-media-base64.mjs | architecture | guard | PASS |
| 13 | check-pagination.mjs | architecture | guard | PASS |
| 14 | check-file-complexity.mjs | quality | guard | PASS |
| 15 | check-build-artifacts.mjs | scope | guard | PASS |
| 16 | check-supabase-migrations-safety.mjs | security | guard | PASS |
| 17 | validate-bundle.mjs | packaging | guard | PASS |
| 18 | check-diff-safety.mjs | pre-commit | guard | PASS |
| 19 | check-local-secret-scan.mjs | security | guard | PASS |
| 20 | check-script-safety.mjs | meta-safety | guard | PASS |
| 21 | scaffold-domain.mjs | generator | scaffold | ready |
| 22 | scaffold-ui-shell.mjs | generator | scaffold | ready |
| 23 | scaffold-route.mjs | generator | scaffold | ready |

## Package scripts

| Script | Command |
|---|---|
| `rules:check` | 14-guard umbrella |
| `arch:check:v2` | 6-guard umbrella |
| `guards:diff` | diff safety |
| `guards:commit` | 10-gate pre-commit decision |
| `guards:bundle` | bundle smoke test |
| `guards:secrets` | local secret scan |
| `guards:boundaries` | domain boundaries |
| `guards:complexity` | file complexity |
| `guards:migrations` | migration safety |
| `guards:scripts` | script safety |
| `guards:all-local` | full local umbrella |
| `scaffold:domain` | domain scaffold generator |
| `scaffold:ui-shell` | UI shell scaffold generator |
| `scaffold:route` | route registry generator |

## Husky hooks

| Hook | Guards |
|---|---|
| pre-commit | diff-safety, fake-done, removed-products, env-safety, test-env-safety, tsc, lint:v2, lint-staged |
| pre-push | rules:check, arch:check:v2, boundaries, domain-status, removed-products, test-env-safety, lint, test, build |
| commit-msg | commitlint |
