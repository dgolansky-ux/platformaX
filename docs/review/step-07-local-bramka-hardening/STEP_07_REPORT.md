# Step 07 — Local BRAMKA Hardening Report

Generated: 2026-05-25T02:57Z

## Objective

Map all BRAMKA requirements against existing implementation and fill local gaps.

## What was already implemented (Steps 01–06)

- 20 guard scripts (rules-check, arch-check, diff-safety, fake-done, domain-status, legacy-imports, removed-products, domain-boundaries, test-env-safety, env-safety, public-dto-pii, media-base64, pagination, file-complexity, build-artifacts, supabase-migrations, validate-bundle, no-commit-if-dirty-gates, check-diff-safety)
- Husky hooks (pre-commit, pre-push, commit-msg)
- lint-staged, commitlint
- CI workflow, CODEOWNERS, PR template
- All governance docs, ADRs, templates
- Domain Ownership Matrix, Release Checklist, Evidence Bundle Template

## What was added in Step 07

### New guard scripts (3)

| Script | Purpose |
|---|---|
| `scripts/check-local-secret-scan.mjs` | Regex-based local secret scanner (Stripe, GitHub PAT, JWT, AWS, OpenAI, Supabase, PG connection strings, private keys) |
| `scripts/check-script-safety.mjs` | Detects dangerous patterns in guard scripts (eval, Function, async exec, rm -rf /, DROP DATABASE) |
| `scripts/scaffold-route.mjs` | Route registry generator with removed-route blocking |

### New generator scripts (2)

| Script | Purpose |
|---|---|
| `scripts/scaffold-domain.mjs` | Creates server + client domain scaffold with README, .gitkeep, status tracking |
| `scripts/scaffold-ui-shell.mjs` | Creates app-v2 UI shell scaffold with README, constraints, status tracking |

### New template (1)

| File | Purpose |
|---|---|
| `docs/templates/VISUAL_MIGRATION_CHECKLIST_TEMPLATE.md` | Checklist for migrating legacy UI to V2 |

### New package.json scripts (8)

| Script | Command |
|---|---|
| `guards:secrets` | `node scripts/check-local-secret-scan.mjs` |
| `guards:boundaries` | `node scripts/audit-domain-boundaries.mjs` |
| `guards:complexity` | `node scripts/check-file-complexity.mjs` |
| `guards:migrations` | `node scripts/check-supabase-migrations-safety.mjs` |
| `guards:scripts` | `node scripts/check-script-safety.mjs` |
| `guards:all-local` | rules-check + secret-scan + script-safety |
| `scaffold:domain` | `node scripts/scaffold-domain.mjs` |
| `scaffold:ui-shell` | `node scripts/scaffold-ui-shell.mjs` |
| `scaffold:route` | `node scripts/scaffold-route.mjs` |

## What stays manual / deferred

| Item | Reason |
|---|---|
| GitHub branch protection | Requires GitHub UI / gh CLI (Step 06 docs ready) |
| Accessibility checklist | No runtime UI to audit yet |
| Observability/logging policy | No runtime to instrument yet |

## Final validation

| Command | Result |
|---|---|
| `pnpm check` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (20 tests, 6 files) |
| `pnpm build` | PASS |
| `pnpm rules:check` | PASS (14/14) |
| `pnpm arch:check:v2` | PASS (6/6) |
| `pnpm guards:commit` | PASS → COMMIT_ALLOWED |
| `pnpm guards:bundle` | PASS |
| `pnpm guards:secrets` | PASS |
| `pnpm guards:scripts` | PASS |
| `pnpm guards:all-local` | PASS |

## Final status

```
LOCAL_BRAMKA_HARDENING_READY
BRAMKA_IMPLEMENTATION_IN_PROGRESS
```
